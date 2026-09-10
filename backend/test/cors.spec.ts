import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const env = {
  APP_MODE: "demo",
  ALLOWED_ORIGINS: " http://localhost:5173, ,https://app.example ",
  SUPABASE_URL: "https://database.test",
  SUPABASE_SECRET_KEY: "test-key",
};

afterEach(() => vi.unstubAllGlobals());

describe("exact-origin CORS", () => {
  it("returns the exact allowed origin and varies by Origin", async () => {
    const response = await worker.fetch(new Request("https://worker.test/api/health", {
      headers: { Origin: "http://localhost:5173" },
    }), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    expect(response.headers.get("Vary")).toBe("Origin");
  });

  it("trims configured origins and ignores empty entries", async () => {
    const response = await worker.fetch(new Request("https://worker.test/api/health", {
      headers: { Origin: "https://app.example" },
    }), env);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example");
  });

  it("does not grant CORS access to a disallowed origin", async () => {
    const response = await worker.fetch(new Request("https://worker.test/api/health", {
      headers: { Origin: "https://evil.example" },
    }), env);

    expect(response.status).toBe(200);
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
  });

  it("does not support wildcard allowlist entries", async () => {
    const response = await worker.fetch(new Request("https://worker.test/api/health", {
      headers: { Origin: "*" },
    }), { ...env, ALLOWED_ORIGINS: "*" });

    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
  });

  it("allows API reads without an Origin header", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetch);

    const response = await worker.fetch(
      new Request("https://worker.test/api/customers"),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("returns the expected headers for an allowed preflight", async () => {
    const response = await worker.fetch(new Request("https://worker.test/api/customers", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:5173" },
    }), env);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    expect(response.headers.get("Vary")).toBe("Origin");
  });

  it("rejects a disallowed preflight without exposing details", async () => {
    const response = await worker.fetch(new Request("https://worker.test/api/customers", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example" },
    }), env);

    expect(response.status).toBe(403);
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
    await expect(response.json()).resolves.toEqual({ error: "Origin not allowed" });
  });

  for (const origin of ["http://localhost:5173", "https://evil.example"]) {
    it(`keeps demo mutations blocked for ${origin}`, async () => {
      const response = await worker.fetch(new Request("https://worker.test/api/events", {
        method: "POST",
        headers: { Origin: origin },
        body: "{}",
      }), env);

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: "Actions are disabled in the public demo.",
        code: "DEMO_READ_ONLY",
      });
    });
  }
});
