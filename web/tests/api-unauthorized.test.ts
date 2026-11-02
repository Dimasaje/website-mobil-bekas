import { afterEach, describe, expect, it } from "bun:test";
import {
  ApiClientError,
  request,
  setUnauthorizedHandler,
} from "../src/lib/api";

const originalFetch = globalThis.fetch;

function stubFetch(status: number, body: unknown = {}) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  setUnauthorizedHandler(null);
});

describe("global 401 handling (T-49)", () => {
  it("calls the unauthorized handler on a 401, so admin forms redirect to login", async () => {
    let calls = 0;
    setUnauthorizedHandler(() => {
      calls += 1;
    });
    stubFetch(401, {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Sesi tidak ditemukan" },
    });

    await expect(
      request("/api/admin/cars", { method: "POST" }),
    ).rejects.toThrow(ApiClientError);
    expect(calls).toBe(1);
  });

  it("keeps the API error available after the handler runs", async () => {
    setUnauthorizedHandler(() => {});
    stubFetch(401, {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Sesi tidak ditemukan" },
    });

    try {
      await request("/api/admin/leads/1", { method: "PATCH" });
      throw new Error("harus gagal");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect((err as ApiClientError).status).toBe(401);
      expect((err as ApiClientError).message).toBe("Sesi tidak ditemukan");
    }
  });

  it("does not fire on success or on non-401 errors", async () => {
    let calls = 0;
    setUnauthorizedHandler(() => {
      calls += 1;
    });

    stubFetch(200, { success: true, data: { ok: true } });
    await request("/api/admin/cars");
    expect(calls).toBe(0);

    stubFetch(422, { success: false, error: { code: "VALIDATION_ERROR" } });
    await expect(request("/api/admin/cars")).rejects.toThrow(ApiClientError);
    expect(calls).toBe(0);
  });

  it("clears the handler when the admin layout unmounts", async () => {
    let calls = 0;
    setUnauthorizedHandler(() => {
      calls += 1;
    });
    setUnauthorizedHandler(null);
    stubFetch(401, { success: false, error: { code: "UNAUTHORIZED" } });

    await expect(request("/api/admin/cars")).rejects.toThrow(ApiClientError);
    expect(calls).toBe(0);
  });
});
