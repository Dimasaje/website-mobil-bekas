import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("API health check", () => {
  it("returns status ok on /api/health", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
