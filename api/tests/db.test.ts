import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("API DB check endpoint", () => {
  it("successfully queries database via api", async () => {
    const res = await app.request("/api/db-check");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; database: string };
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });
});
