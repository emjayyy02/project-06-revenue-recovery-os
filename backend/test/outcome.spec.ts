import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const id = "90000000-0000-4000-8000-000000000001";
const env = { SUPABASE_URL: "https://database.test", SUPABASE_SECRET_KEY: "test-key" };
const request = (body: unknown) => new Request(`https://worker.test/api/interventions/${id}/outcome`, {
  method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
});
afterEach(() => vi.unstubAllGlobals());

describe("outcome API", () => {
  for (const outcome of ["recovered", "not_recovered"]) {
    for (const unresolved of [null, "pending"]) {
      it(`records ${outcome} from sent + ${unresolved} atomically`, async () => {
        const fetch = vi.fn().mockResolvedValueOnce(Response.json([{ id, status: "sent", outcome: unresolved }]))
          .mockImplementationOnce((_url, init) => Response.json([{ id, status: "sent", ...JSON.parse(init.body) }]));
        vi.stubGlobal("fetch", fetch);
        const response = await worker.fetch(request({ outcome }), env);
        expect(response.status).toBe(200);
        const { data } = await response.json() as { data: { outcome: string; outcome_recorded_at: string; status: string } };
        expect(data.outcome).toBe(outcome);
        expect(data.status).toBe("sent");
        expect(Number.isFinite(Date.parse(data.outcome_recorded_at))).toBe(true);
        const [url, init] = fetch.mock.calls[1];
        expect(init.method).toBe("PATCH");
        expect(new URL(url).searchParams.get("status")).toBe("eq.sent");
        expect(new URL(url).searchParams.get("or")).toBe("(outcome.is.null,outcome.eq.pending)");
        expect(Object.keys(JSON.parse(init.body)).sort()).toEqual(["outcome", "outcome_recorded_at"]);
      });
    }
    for (const status of ["pending_approval", "approved", "executing", "failed", "rejected"]) {
      it(`rejects ${status} → ${outcome}`, async () => {
        const fetch = vi.fn().mockResolvedValue(Response.json([{ id, status, outcome: null }]));
        vi.stubGlobal("fetch", fetch);
        expect((await worker.fetch(request({ outcome }), env)).status).toBe(409);
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    }
    for (const existingOutcome of ["recovered", "not_recovered"]) {
      it(`rejects resolved ${existingOutcome} → ${outcome}`, async () => {
        const fetch = vi.fn().mockResolvedValue(Response.json([{ id, status: "sent", outcome: existingOutcome }]));
        vi.stubGlobal("fetch", fetch);
        expect((await worker.fetch(request({ outcome }), env)).status).toBe(409);
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    }
  }
  for (const body of [{}, { outcome: "pending" }, { outcome: null }, { outcome: "sent" },
    { outcome: 1 }, { outcome: "recovered", status: "sent" }, null]) {
    it(`rejects invalid payload ${JSON.stringify(body)}`, async () => {
      const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
      expect((await worker.fetch(request(body), env)).status).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    });
  }
  it("rejects malformed JSON with 400", async () => {
    expect((await worker.fetch(new Request(`https://worker.test/api/interventions/${id}/outcome`, {
      method: "POST", body: "{",
    }), env)).status).toBe(400);
  });
  it("returns 404 for a missing intervention", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
    expect((await worker.fetch(request({ outcome: "recovered" }), env)).status).toBe(404);
  });
  it("returns 409 when a concurrent write wins after the read", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json([{ id, status: "sent", outcome: null }]))
      .mockResolvedValueOnce(Response.json([])));
    expect((await worker.fetch(request({ outcome: "recovered" }), env)).status).toBe(409);
  });
  it("surfaces database write failure without claiming a saved outcome", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json([{ id, status: "sent", outcome: null }]))
      .mockResolvedValueOnce(Response.json({ message: "write failed" }, { status: 400 })));
    expect((await worker.fetch(request({ outcome: "recovered" }), env)).status).toBe(500);
  });
});
