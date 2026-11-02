import { beforeAll, describe, expect, it } from "bun:test";
import { db, schema } from "db";
import { eq } from "drizzle-orm";
import { runSeed } from "db/src/seed";
import { app } from "../src/index";

describe("Public Cars API (/api/cars)", () => {
  beforeAll(async () => {
    await runSeed();

    // Pastikan ada satu mobil berstatus draft untuk menguji bahwa draft tidak pernah muncul
    const [brand] = await db.select().from(schema.brands).limit(1);
    await db
      .insert(schema.cars)
      .values({
        brandId: brand.id,
        title: "Mobil Rahasia Draft 2024",
        slug: "mobil-rahasia-draft-2024",
        model: "Draft Car",
        year: 2024,
        price: 999000000,
        transmission: "matic",
        mileage: 1000,
        status: "draft",
      })
      .onConflictDoNothing();
  });

  it("GET /api/cars/filters returns filter options and ranges", async () => {
    const res = await app.request("/api/cars/filters");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: {
        brands: Array<{ name: string; slug: string; carCount: number }>;
        priceRange: { min: number; max: number };
        yearRange: { min: number; max: number };
        transmissions: string[];
        fuelTypes: string[];
      };
    };

    expect(body.success).toBe(true);
    expect(body.data.brands.length).toBeGreaterThan(0);
    expect(body.data.priceRange.min).toBeGreaterThan(0);
    expect(body.data.priceRange.max).toBeGreaterThan(body.data.priceRange.min);
    expect(body.data.transmissions).toContain("manual");
    expect(body.data.transmissions).toContain("matic");
  });

  it("GET /api/cars returns public cars and never shows draft cars", async () => {
    const res = await app.request("/api/cars?limit=50");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ slug: string; status: string }>;
      pagination: { total: number };
    };

    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(10);

    // Pastikan mobil berstatus draft tidak ada di daftar
    const draftCars = body.data.filter((c) => c.status === "draft");
    expect(draftCars.length).toBe(0);

    const secretCar = body.data.find(
      (c) => c.slug === "mobil-rahasia-draft-2024",
    );
    expect(secretCar).toBeUndefined();
  });

  it("filters cars by brand", async () => {
    const res = await app.request("/api/cars?brand=toyota");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ brand: { slug: string } }>;
    };

    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    for (const car of body.data) {
      expect(car.brand.slug).toBe("toyota");
    }
  });

  it("filters cars by price range and year range", async () => {
    const minPrice = 150000000;
    const maxPrice = 200000000;
    const res = await app.request(
      `/api/cars?minPrice=${minPrice}&maxPrice=${maxPrice}&minYear=2018`,
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ price: number; year: number }>;
    };

    expect(body.success).toBe(true);
    for (const car of body.data) {
      expect(car.price).toBeGreaterThanOrEqual(minPrice);
      expect(car.price).toBeLessThanOrEqual(maxPrice);
      expect(car.year).toBeGreaterThanOrEqual(2018);
    }
  });

  it("filters cars by search keyword", async () => {
    const res = await app.request("/api/cars?search=Avanza");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ title: string }>;
    };

    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].title.toLowerCase()).toContain("avanza");
  });

  it("sorts cars by price ascending and descending", async () => {
    const resAsc = await app.request("/api/cars?sort=price_asc&limit=5");
    const bodyAsc = (await resAsc.json()) as {
      data: Array<{ price: number }>;
    };

    for (let i = 0; i < bodyAsc.data.length - 1; i++) {
      expect(bodyAsc.data[i].price).toBeLessThanOrEqual(
        bodyAsc.data[i + 1].price,
      );
    }

    const resDesc = await app.request("/api/cars?sort=price_desc&limit=5");
    const bodyDesc = (await resDesc.json()) as {
      data: Array<{ price: number }>;
    };

    for (let i = 0; i < bodyDesc.data.length - 1; i++) {
      expect(bodyDesc.data[i].price).toBeGreaterThanOrEqual(
        bodyDesc.data[i + 1].price,
      );
    }
  });

  it("GET /api/cars/:slug returns detail for valid car", async () => {
    const slug = "toyota-avanza-13-g-manual-2020";
    const res = await app.request(`/api/cars/${slug}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: {
        slug: string;
        title: string;
        brand: { name: string };
        photos: Array<unknown>;
        viewsCount: number;
      };
    };

    expect(body.success).toBe(true);
    expect(body.data.slug).toBe(slug);
    expect(body.data.brand.name).toBe("Toyota");
    expect(body.data.photos.length).toBeGreaterThan(0);
  });

  it("GET /api/cars/:slug returns 404 for draft car or non-existent slug", async () => {
    const draftRes = await app.request("/api/cars/mobil-rahasia-draft-2024");
    expect(draftRes.status).toBe(404);

    const notFoundRes = await app.request(
      "/api/cars/mobil-yang-pasti-tidak-ada-999",
    );
    expect(notFoundRes.status).toBe(404);
  });
});
