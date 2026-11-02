import { describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { client, db, healthCheck } from "../src/index";

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

  it("can insert and select from healthCheck schema via Drizzle ORM", async () => {
    const inserted = await db
      .insert(healthCheck)
      .values({ status: "qa-test" })
      .returning();
    expect(inserted.length).toBe(1);
    expect(inserted[0].status).toBe("qa-test");

    const found = await db
      .select()
      .from(healthCheck)
      .where(sql`status = 'qa-test'`);
    expect(found.length).toBeGreaterThan(0);

    // cleanup
    await db.execute(sql`DELETE FROM health_check WHERE status = 'qa-test'`);
  });
});
