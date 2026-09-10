import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const env = {
  APP_MODE: "development",
  ALLOWED_ORIGINS: "http://localhost:5173",
  SUPABASE_URL: "https://database.test",
  SUPABASE_SECRET_KEY: "test-key",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("safe server errors", () => {
  it("keeps health independent from database initialization", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const response = await worker.fetch(new Request("https://worker.test/api/health"), {
      ...env,
      SUPABASE_URL: "",
      SUPABASE_SECRET_KEY: "",
    });

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a generic response and logs database error details", async () => {
    const databaseMessage = "relation private_customer_table does not exist";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      message: databaseMessage,
      details: "internal SQL details",
    }, { status: 500 })));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await worker.fetch(
      new Request("https://worker.test/api/customers"),
      env,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
    expect(consoleError).toHaveBeenCalledWith(
      "API request failed",
      expect.objectContaining({ context: "list customers", status: 500 }),
    );
    expect(JSON.stringify(consoleError.mock.calls)).toContain(databaseMessage);
  });

  it("sanitizes unexpected initialization failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await worker.fetch(new Request("https://worker.test/api/customers"), {
      ...env,
      SUPABASE_URL: "not-a-url",
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
    expect(consoleError).toHaveBeenCalled();
  });
});
