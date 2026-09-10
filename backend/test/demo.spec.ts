import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const id = "90000000-0000-4000-8000-000000000001";
const env = { SUPABASE_URL: "https://database.test", SUPABASE_SECRET_KEY: "test-key" };
const post = (path: string, body = "{") => new Request(`https://worker.test/api/${path}`, { method: "POST", body });
afterEach(() => vi.unstubAllGlobals());

describe("M11 demo boundary", () => {
  for (const mode of ["demo", undefined, "invalid"]) {
    for (const path of ["events", `customers/${id}/risk/recalculate`, "interventions",
      ...["approve", "reject", "execute", "execution-result", "outcome"].map(action => `interventions/${id}/${action}`)]) {
      it(`${mode}: blocks ${path} before privileged work`, async () => {
        const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
        // Invalid DB configuration proves the guard also precedes client creation.
        const response = await worker.fetch(post(path), { SUPABASE_URL: "", SUPABASE_SECRET_KEY: "", APP_MODE: mode });
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: "Actions are disabled in the public demo.", code: "DEMO_READ_ONLY" });
        expect(fetch).not.toHaveBeenCalled();
      });
    }
  }
  for (const method of ["PUT", "PATCH", "DELETE", "POST"]) {
    it(`denies future ${method} mutations by default`, async () => {
      expect((await worker.fetch(new Request("https://worker.test/api/future", { method }), { ...env, APP_MODE: "demo" })).status).toBe(403);
    });
  }
  for (const mode of ["demo", undefined, "invalid", "development"]) {
    it(`${mode}: assistance selects the permitted provider and only reads DB`, async () => {
      const fetch = vi.fn().mockResolvedValueOnce(Response.json([{ id, full_name: "Test User", company: "Test", account_value: 100, owner: null }]))
        .mockResolvedValueOnce(Response.json([{ score: 80, risk_level: "critical" }]))
        .mockResolvedValueOnce(Response.json([])).mockResolvedValueOnce(Response.json([]))
        .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify({ risk_summary: "Provider summary", recommended_next_action: "Review", draft_message: "Hello" }) } }] }));
      vi.stubGlobal("fetch", fetch);
      const response = await worker.fetch(post(`customers/${id}/ai-assistance`), { ...env, APP_MODE: mode, OPENROUTER_API_KEY: "test-provider-key" });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ provider: mode === "development" ? "openrouter" : "fallback" });
      expect(fetch).toHaveBeenCalledTimes(mode === "development" ? 5 : 4);
      expect(fetch.mock.calls.slice(0, 4).every(([url, init]) => new URL(url).hostname === "database.test" && init.method === "GET")).toBe(true);
      if (mode === "development") expect(fetch.mock.calls[4][0]).toBe("https://openrouter.ai/api/v1/chat/completions");
    });
  }
  it("development still creates events", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ id })); vi.stubGlobal("fetch", fetch);
    expect((await worker.fetch(post("events", JSON.stringify({ customer_id: id, event_type: "login", source: "test", occurred_at: "2026-09-10T00:00:00Z" })), { ...env, APP_MODE: "development" })).status).toBe(201);
    expect(fetch.mock.calls[0][1].method).toBe("POST");
  });
  it("demo reads remain available", async () => {
    const fetch = vi.fn().mockImplementation(() => Response.json([])); vi.stubGlobal("fetch", fetch);
    for (const path of ["health", "customers", `customers/${id}/events`, `customers/${id}/risk`, `customers/${id}/signals`, "interventions", "analytics"]) {
      expect((await worker.fetch(new Request(`https://worker.test/api/${path}`), { ...env, APP_MODE: "demo" })).status).toBe(200);
    }
    expect(fetch.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
  });
});
