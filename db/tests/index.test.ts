import { describe, expect, it } from "bun:test";
import { count, eq, sql } from "drizzle-orm";
import { db, schema } from "../src/index";

describe("Database Schema & Seed Verification", () => {
  it("connects to PostgreSQL", async () => {
    const res = await db.execute(sql`SELECT 1 as result`);
    expect(res).toBeDefined();
  });

  it("verifies all tables exist", async () => {
    const tables = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const tableNames = tables.map((t: any) => t.table_name);
    const expected = [
      "brands",
      "cars",
      "car_photos",
      "promos",
      "testimonials",
      "articles",
      "leads",
      "site_settings",
      "admin_users",
      "sessions",
    ];
    for (const name of expected) {
      expect(tableNames).toContain(name);
    }
  });

  it("verifies seed data is populated", async () => {
    const [adminCount] = await db
      .select({ val: count() })
      .from(schema.adminUsers);
    expect(Number(adminCount.val)).toBeGreaterThanOrEqual(1);

    const [brandCount] = await db.select({ val: count() }).from(schema.brands);
    expect(Number(brandCount.val)).toBeGreaterThanOrEqual(8);

    const [carCount] = await db.select({ val: count() }).from(schema.cars);
    expect(Number(carCount.val)).toBeGreaterThanOrEqual(10);

    const [settings] = await db.select().from(schema.siteSettings).limit(1);
    expect(settings).toBeDefined();
    expect(settings.showroomName).toBe("Bintang Mobil");
  });

  it("verifies car relations with brand and photos", async () => {
    const carList = await db.query.cars.findMany({
      with: {
        brand: true,
        photos: true,
      },
      limit: 1,
    });
    expect(carList.length).toBe(1);
    expect(carList[0].brand).toBeDefined();
    expect(carList[0].photos.length).toBeGreaterThan(0);
  });
});
