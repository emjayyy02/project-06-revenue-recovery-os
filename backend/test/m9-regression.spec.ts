import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { getRiskLevel } from "../src/services/risk-engine";

const id = "90000000-0000-4000-8000-000000000001";
const env = {
  SUPABASE_URL: "https://database.test", SUPABASE_SECRET_KEY: "test-key",
  N8N_INTERVENTION_WEBHOOK_URL: "https://automation.test/webhook",
};
const post = (path: string, body?: unknown) => new Request(`https://worker.test/api/${path}`, {
  method: "POST", ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
afterEach(() => vi.unstubAllGlobals());

describe("M1–M8 route regression", () => {
  for (const action of ["approve", "reject"]) {
    it(`preserves ${action} behavior and does not write business outcomes`, async () => {
      const fetch = vi.fn().mockResolvedValueOnce(Response.json([{ id, status: "pending_approval" }]))
        .mockImplementationOnce((_url, init) => Response.json({ id, ...JSON.parse(init.body) }));
      vi.stubGlobal("fetch", fetch);
      const response = await worker.fetch(post(`interventions/${id}/${action}`), env);
      expect(response.status).toBe(200);
      const update = JSON.parse(fetch.mock.calls[1][1].body);
      expect(update.status).toBe(action === "approve" ? "approved" : "rejected");
      expect(update).not.toHaveProperty("outcome");
    });
  }
  it("preserves approval creation and pending deduplication", async () => {
    const payload = { customer_id: id, playbook_id: id, type: "recovery_outreach", recommended_action: "Check in" };
    const fetch = vi.fn().mockResolvedValueOnce(Response.json([]))
      .mockImplementationOnce((_url, init) => Response.json({ id, ...JSON.parse(init.body) }))
      .mockResolvedValueOnce(Response.json([{ id }]));
    vi.stubGlobal("fetch", fetch);
    expect((await worker.fetch(post("interventions", payload), env)).status).toBe(201);
    expect((await worker.fetch(post("interventions", payload), env)).status).toBe(409);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetch.mock.calls[1][1].body).status).toBe("pending_approval");
  });
  for (const status of ["approved", "failed"]) {
    it(`preserves execution/retry from ${status}, attempts and external payload`, async () => {
      const fetch = vi.fn().mockResolvedValueOnce(Response.json([{
        id, status, execution_attempts: 2, customers: { company: "Test" }, recovery_playbooks: { name: "Check in" },
      }])).mockResolvedValueOnce(Response.json(null)).mockResolvedValueOnce(Response.json({ accepted: true }));
      vi.stubGlobal("fetch", fetch);
      const response = await worker.fetch(post(`interventions/${id}/execute`), env);
      expect(response.status).toBe(202);
      const update = JSON.parse(fetch.mock.calls[1][1].body);
      expect(update).toMatchObject({ status: "executing", execution_attempts: 3, execution_error: null });
      expect(update).not.toHaveProperty("outcome");
      expect(fetch.mock.calls[2][0]).toBe(env.N8N_INTERVENTION_WEBHOOK_URL);
      expect(JSON.parse(fetch.mock.calls[2][1].body)).toMatchObject({ intervention_id: id, attempt: 3 });
    });
  }
  it("preserves failed webhook handling", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json([{ id, status: "approved", execution_attempts: 0 }]))
      .mockResolvedValueOnce(Response.json(null))
      .mockResolvedValueOnce(new Response("failed", { status: 502 }))
      .mockResolvedValueOnce(Response.json(null));
    vi.stubGlobal("fetch", fetch);
    expect((await worker.fetch(post(`interventions/${id}/execute`), env)).status).toBe(502);
    expect(JSON.parse(fetch.mock.calls[3][1].body)).toMatchObject({ status: "failed", execution_error: "n8n webhook returned 502" });
  });
  for (const status of ["sent", "failed"]) {
    it(`preserves ${status} callbacks without inventing recovery outcomes`, async () => {
      const fetch = vi.fn().mockResolvedValueOnce(Response.json([{ id, status: "executing" }]))
        .mockImplementationOnce((_url, init) => Response.json({ id, ...JSON.parse(init.body) }));
      vi.stubGlobal("fetch", fetch);
      expect((await worker.fetch(post(`interventions/${id}/execution-result`, { status, error: "test failure" }), env)).status).toBe(200);
      const update = JSON.parse(fetch.mock.calls[1][1].body);
      expect(update.status).toBe(status);
      expect(update).not.toHaveProperty("outcome");
      expect(update).not.toHaveProperty("outcome_recorded_at");
      if (status === "sent") { expect(update.executed_at).toBeTypeOf("string"); expect(update.execution_error).toBeNull(); }
      else { expect(update.executed_at).toBeNull(); expect(update.execution_error).toBe("test failure"); }
    });
  }
  it("preserves customer, risk, signals and event read routes", async () => {
    const fetch = vi.fn().mockImplementation(() => Response.json([{ id }]));
    vi.stubGlobal("fetch", fetch);
    for (const path of ["customers", `customers/${id}`, `customers/${id}/risk`, `customers/${id}/signals`, `customers/${id}/events`, "interventions"]) {
      expect((await worker.fetch(new Request(`https://worker.test/api/${path}`), env)).status).toBe(200);
    }
    const riskQuery = new URL(fetch.mock.calls[2][0]);
    expect(riskQuery.searchParams.get("order")).toBe("calculated_at.desc");
    expect(riskQuery.searchParams.get("limit")).toBe("1");
  });
  it("preserves risk recalculation and signal generation", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json([
      { id, customer_id: id, event_type: "payment_failed" },
      { id: "event2", customer_id: id, event_type: "usage_decline", event_value: { decline_percent: 60 } },
    ])).mockResolvedValueOnce(Response.json(null))
      .mockResolvedValueOnce(Response.json(null))
      .mockImplementationOnce((_url, init) => Response.json({ id, ...JSON.parse(init.body) }));
    vi.stubGlobal("fetch", fetch);
    const response = await worker.fetch(post(`customers/${id}/risk/recalculate`), env);
    expect(response.status).toBe(200);
    const { data } = await response.json() as { data: { score: { score: number; risk_level: string }; signals: unknown[] } };
    expect(data.score).toMatchObject({ score: 45, risk_level: "medium" });
    expect(data.signals).toHaveLength(2);
  });
  it("preserves advisory AI fallback without database writes", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json([{ id, full_name: "Test User", company: "Test", account_value: 100, owner: null }]))
      .mockResolvedValueOnce(Response.json([{ score: 80, risk_level: "critical" }]))
      .mockResolvedValueOnce(Response.json([])).mockResolvedValueOnce(Response.json([]));
    vi.stubGlobal("fetch", fetch);
    const response = await worker.fetch(post(`customers/${id}/ai-assistance`), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ provider: "fallback", data: { risk_summary: expect.stringContaining("80/100") } });
    expect(fetch.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
  });
  it("preserves deterministic risk thresholds", () => {
    expect([0, 24, 25, 49, 50, 74, 75, 100].map(getRiskLevel)).toEqual([
      "low", "low", "medium", "medium", "high", "high", "critical", "critical",
    ]);
  });
});
