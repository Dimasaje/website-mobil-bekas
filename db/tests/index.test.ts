import { describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { client, db } from "../src/index";

describe("Database connectivity & Drizzle", () => {
  it("connects to local PostgreSQL and executes query", async () => {
    const res = await db.execute(sql`SELECT 1 as result`);
    expect(res).toBeDefined();
  });

  it("verifies migrated tables exist", async () => {
    const tables = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_check'`,
    );
    expect(tables.length).toBeGreaterThan(0);
  });
});
