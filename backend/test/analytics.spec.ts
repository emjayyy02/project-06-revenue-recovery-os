import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAnalytics, readAllPages } from "../src/services/analytics";
import worker from "../src/index";

const customers = [
  { id: "a", company: "Alpha", account_value: 100.1 },
  { id: "b", company: "Beta", account_value: 200.2 },
  { id: "c", company: "Gamma", account_value: 500 },
  { id: "d", company: "Delta", account_value: 900 },
];
const risks = [
  { id: "1", customer_id: "a", risk_level: "critical", calculated_at: "2026-01-01T00:00:00Z" },
  { id: "2", customer_id: "a", risk_level: "high", calculated_at: "2026-02-01T00:00:00Z" },
  { id: "3", customer_id: "b", risk_level: "critical", calculated_at: "2026-02-01T00:00:00Z" },
  { id: "4", customer_id: "c", risk_level: "low", calculated_at: "2026-02-01T00:00:00Z" },
];
const intervention = (id: string, customer_id: string, outcome: string | null, status = "sent") => ({
  id, customer_id, outcome, status, executed_at: "2026-02-01T00:00:00Z",
  outcome_recorded_at: outcome === "recovered" || outcome === "not_recovered" ? "2026-03-01T00:00:00Z" : null,
});
afterEach(() => vi.unstubAllGlobals());

describe("analytics formulas", () => {
  it("counts customers and revenue once using latest risk, regardless of input order", () => {
    const result = calculateAnalytics(customers, risks, []);
    expect(result.total_customers).toBe(4);
    expect(result.at_risk_customers).toBe(2);
    expect(result.critical_customers).toBe(1);
    expect(result.revenue_exposure).toBe(300.3);
    expect(result.risk_distribution).toEqual({ low: 1, medium: 0, high: 1, critical: 1, uncalculated: 1 });
    expect(result.revenue_exposure_by_risk).toEqual({ low: 500, medium: 0, high: 100.1, critical: 200.2 });
    expect(calculateAnalytics(customers, [...risks].reverse(), [])).toEqual(result);
  });
  it("handles equal timestamps deterministically", () => {
    const tied = [{ ...risks[1], id: "9", risk_level: "medium" }, risks[1]];
    expect(calculateAnalytics(customers, tied, []).risk_distribution.medium).toBe(1);
    expect(calculateAnalytics(customers, tied.reverse(), []).risk_distribution.medium).toBe(1);
  });
  it("deduplicates recovered customers but counts all resolved intervention outcomes", () => {
    const result = calculateAnalytics(customers, risks, [
      intervention("1", "a", "recovered"), intervention("2", "a", "recovered"),
      intervention("3", "b", "not_recovered"), intervention("4", "b", null),
      intervention("5", "c", "pending"),
      ...["pending_approval", "approved", "rejected", "executing", "failed"].map(status => intervention(status, "d", null, status)),
    ]);
    expect(result.recovered_customers).toBe(1);
    expect(result.intervention_outcomes).toEqual({ pending: 2, recovered: 2, not_recovered: 1 });
    expect(result.recovery_success_rate).toBeCloseTo(200 / 3);
  });
  it("updates metrics and activity after recording an outcome", () => {
    const pending = calculateAnalytics(customers, risks, [intervention("1", "a", null)]);
    const resolved = calculateAnalytics(customers, risks, [intervention("1", "a", "recovered")]);
    expect(pending.intervention_outcomes.pending).toBe(1);
    expect(pending.recovery_success_rate).toBe(0);
    expect(resolved.intervention_outcomes).toEqual({ pending: 0, recovered: 1, not_recovered: 0 });
    expect(resolved.recovery_success_rate).toBe(100);
    expect(resolved.recent_recovery_activity[0]).toMatchObject({ outcome: "recovered", occurred_at: "2026-03-01T00:00:00Z" });
  });
  it("returns safe zero states", () => {
    const result = calculateAnalytics([], [], []);
    expect(result.total_customers).toBe(0);
    expect(result.revenue_exposure).toBe(0);
    expect(result.recovery_success_rate).toBe(0);
    expect(result.recent_recovery_activity).toEqual([]);
    expect(JSON.stringify(result)).not.toMatch(/NaN|Infinity/);
  });
  it("does not invent outcome dates for legacy rows", () => {
    const result = calculateAnalytics(customers, [], [{ ...intervention("1", "a", "recovered"), outcome_recorded_at: null }]);
    expect(result.recovered_customers).toBe(1);
    expect(result.recent_recovery_activity).toEqual([{
      intervention_id: "1", customer_id: "a", company: "Alpha", outcome: "sent", occurred_at: "2026-02-01T00:00:00Z",
    }]);
  });
  it("uses real timestamps and limits activity to eight events, newest first", () => {
    const result = calculateAnalytics(customers, [], Array.from({ length: 12 }, (_, i) => ({
      ...intervention(String(i), "a", "recovered"), outcome_recorded_at: `2026-03-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    })));
    expect(result.recent_recovery_activity).toHaveLength(8);
    expect(result.recent_recovery_activity[0].occurred_at).toBe("2026-03-12T00:00:00Z");
    expect(result.recent_recovery_activity[7].occurred_at).toBe("2026-03-05T00:00:00Z");
  });
  it("ignores unknown outcomes and orphaned rows", () => {
    const result = calculateAnalytics(customers, risks, [intervention("1", "missing", "recovered"), intervention("2", "a", "legacy")]);
    expect(result.intervention_outcomes).toEqual({ pending: 0, recovered: 0, not_recovered: 0 });
  });
});

describe("analytics queries", () => {
  it("reads beyond an API page cap, without treating a short page as completion", async () => {
    const rows = Array.from({ length: 1205 }, (_, id) => ({ id }));
    const result = await readAllPages(async from => ({ data: rows.slice(from, from + 500), error: null }));
    expect(result).toEqual(rows);
  });
  it("rejects a query error instead of returning partial metrics", async () => {
    await expect(readAllPages(async () => ({ data: null, error: { message: "unavailable" } }))).rejects.toThrow("unavailable");
  });
  it("serves the typed data envelope from paged Supabase queries", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const url = new URL(input);
      if (Number(url.searchParams.get("offset")) > 0) return Response.json([]);
      if (url.pathname.endsWith("/customers")) return Response.json(customers);
      if (url.pathname.endsWith("/risk_scores")) return Response.json(risks);
      if (url.pathname.endsWith("/interventions")) return Response.json([intervention("1", "a", null)]);
      throw new Error("Unexpected URL");
    }));
    const response = await worker.fetch(new Request("https://worker.test/api/analytics"), {
      SUPABASE_URL: "https://database.test", SUPABASE_SECRET_KEY: "test-key",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: calculateAnalytics(customers, risks, [intervention("1", "a", null)]) });
  });
});
