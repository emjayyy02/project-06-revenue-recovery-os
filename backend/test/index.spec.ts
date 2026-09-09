import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import worker from "../src/index";

describe("Revenue Recovery OS API", () => {
  it("returns health status", async () => {
    const request = new Request("https://example.com/api/health");
    const ctx = createExecutionContext();

    const response = await worker.fetch(request, env);

    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "revenue-recovery-api",
    });
  });

  it("returns 404 for unknown routes", async () => {
    const request = new Request("https://example.com/unknown");
    const ctx = createExecutionContext();

    const response = await worker.fetch(request, env);

    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(404);

    await expect(response.json()).resolves.toEqual({
      error: "Not Found",
    });
  });
});