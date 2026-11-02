import { beforeAll, describe, expect, it } from "bun:test";
import { count, eq, sql } from "drizzle-orm";
import { db, schema } from "../src/index";
import { runSeed } from "../src/seed";

// Mobil contoh pertama dari seed; dipakai agar test relasi tidak bergantung
// pada urutan/isi tabel cars di database yang sudah terpakai.
const SEED_CAR_SLUG = "toyota-avanza-13-g-manual-2020";

describe("Database Schema & Seed Verification", () => {
  beforeAll(async () => {
    await runSeed();
  });

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

  // Deterministik: memakai slug mobil seed yang pasti ada dan berfoto, bukan
  // "mobil pertama" yang bergantung isi database pengembangan.
  it("verifies seed car relations with brand and photos", async () => {
    const car = await db.query.cars.findFirst({
      where: eq(schema.cars.slug, SEED_CAR_SLUG),
      with: {
        brand: true,
        photos: true,
      },
    });

    expect(car).toBeDefined();
    expect(car!.brand).toBeDefined();
    expect(car!.photos.length).toBeGreaterThan(0);
  });

  it("verifies no car is left without a brand", async () => {
    const orphans = await db.execute(
      sql`SELECT c.slug FROM cars c LEFT JOIN brands b ON b.id = c.brand_id WHERE b.id IS NULL LIMIT 5`,
    );

    expect(orphans.length).toBe(0);
  });
});
