import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("API Server Dasar", () => {
  it("returns health status and database connectivity", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: { status: string; database: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.database).toBe("ok");
  });

  it("includes basic security headers", async () => {
    const res = await app.request("/api/health");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBeDefined();
  });

  it("handles 404 routes with consistent JSON error format", async () => {
    const res = await app.request("/api/route-yang-tidak-ada");
    expect(res.status).toBe(404);

    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toContain("tidak ditemukan");
  });
});
