import { beforeAll, describe, expect, it } from "bun:test";
import { db, schema } from "db";
import { eq } from "drizzle-orm";
import { runSeed } from "db/src/seed";
import { app } from "../src/index";

describe("Admin Cars CRUD API (/api/admin/cars)", () => {
  let adminCookie = "";
  let brandId = "";
  let createdCarId = "";
  const uniqueTitle = `Honda Civic Turbo ${crypto.randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    await runSeed();

    // Login as admin
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@bintangmobil.com",
        password: "Admin123!",
      }),
    });
    adminCookie = loginRes.headers.get("set-cookie") || "";

    // Get brand ID
    const [brand] = await db.select().from(schema.brands).limit(1);
    brandId = brand.id;
  });

  it("rejects unauthenticated requests to /api/admin/cars", async () => {
    const res = await app.request("/api/admin/cars");
    expect(res.status).toBe(401);
  });

  it("successfully creates a new car with auto-generated slug", async () => {
    const res = await app.request("/api/admin/cars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        brandId,
        title: uniqueTitle,
        model: "Civic Turbo RS",
        year: 2023,
        price: 520000000,
        transmission: "matic",
        mileage: 12000,
        fuelType: "bensin",
        engineCapacity: 1500,
        color: "Rallye Red",
        licensePlate: "B 1111 CIV",
        description: "Tangan pertama, mulus seperti baru.",
        features: ["Sunroof", "Honda Sensing", "Wireless CarPlay"],
        status: "tersedia",
        isFeatured: true,
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      success: boolean;
      data: { id: string; slug: string; status: string; isFeatured: boolean };
    };

    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    createdCarId = body.data.id;

    expect(body.data.slug).toBeDefined();
    expect(body.data.status).toBe("tersedia");
    expect(body.data.isFeatured).toBe(true);
  });

  it("handles slug collision by appending unique suffix", async () => {
    const res = await app.request("/api/admin/cars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        brandId,
        title: uniqueTitle, // Same title will trigger collision
        model: "Civic Turbo RS",
        year: 2023,
        price: 515000000,
        transmission: "matic",
        mileage: 15000,
        status: "tersedia",
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      success: boolean;
      data: { slug: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.slug).toContain("-1");
  });

  it("gets list of cars including draft and diarsipkan for admin", async () => {
    const res = await app.request("/api/admin/cars?limit=10", {
      headers: { Cookie: adminCookie },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ id: string; title: string }>;
      pagination: { total: number };
    };
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.pagination.total).toBeGreaterThan(0);
  });

  it("gets detail of car by ID", async () => {
    expect(createdCarId).not.toBe("");
    const res = await app.request(`/api/admin/cars/${createdCarId}`, {
      headers: { Cookie: adminCookie },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { id: string; title: string; brand: unknown };
    };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdCarId);
    expect(body.data.brand).toBeDefined();
  });

  it("updates car details", async () => {
    const res = await app.request(`/api/admin/cars/${createdCarId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        price: 510000000,
        mileage: 13000,
        description: "Diskon akhir tahun khusus cash keras.",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { price: number; mileage: number; description: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.price).toBe(510000000);
    expect(body.data.mileage).toBe(13000);
    expect(body.data.description).toContain("Diskon akhir tahun");
  });

  it("updates car status quickly via /status endpoint", async () => {
    const res = await app.request(`/api/admin/cars/${createdCarId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: "booking" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { status: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("booking");
  });

  it("toggles isFeatured quickly via /featured endpoint", async () => {
    const res = await app.request(`/api/admin/cars/${createdCarId}/featured`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ isFeatured: false }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { isFeatured: boolean };
    };
    expect(body.success).toBe(true);
    expect(body.data.isFeatured).toBe(false);
  });

  it("deletes car as archive (soft delete) and verifies it is hidden from public API", async () => {
    // 1. Delete car
    const delRes = await app.request(`/api/admin/cars/${createdCarId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });

    expect(delRes.status).toBe(200);
    const delBody = (await delRes.json()) as {
      success: boolean;
      data: { status: string };
    };
    expect(delBody.success).toBe(true);
    expect(delBody.data.status).toBe("diarsipkan");

    // 2. Check in database - still exists, status is diarsipkan
    const [carInDb] = await db
      .select()
      .from(schema.cars)
      .where(eq(schema.cars.id, createdCarId));
    expect(carInDb).toBeDefined();
    expect(carInDb.status).toBe("diarsipkan");

    // 3. Verify public API does not return it
    const publicListRes = await app.request("/api/cars?limit=50");
    expect(publicListRes.status).toBe(200);
    const publicListBody = (await publicListRes.json()) as {
      data: Array<{ id: string }>;
    };
    const foundInPublic = publicListBody.data.find(
      (c) => c.id === createdCarId,
    );
    expect(foundInPublic).toBeUndefined();

    // 4. Verify public slug route returns 404
    const publicSlugRes = await app.request(`/api/cars/${carInDb.slug}`);
    expect(publicSlugRes.status).toBe(404);
  });

  it("rejects create with invalid payload (invalid brand UUID, short title)", async () => {
    const res = await app.request("/api/admin/cars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        brandId: "bukan-uuid",
        title: "a",
        model: "",
        year: 1800,
        price: -1,
        transmission: "otomatis",
        mileage: -5,
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; details: unknown[] };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.length).toBeGreaterThan(0);
  });

  it("returns 404 when updating or deleting a non-existent car", async () => {
    const missingId = crypto.randomUUID();

    const patchRes = await app.request(`/api/admin/cars/${missingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ title: "Judul Baru Tidak Ada" }),
    });
    expect(patchRes.status).toBe(404);

    const delRes = await app.request(`/api/admin/cars/${missingId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    expect(delRes.status).toBe(404);
  });

  it("rejects status and featured updates without a valid session", async () => {
    const id = crypto.randomUUID();
    const statusRes = await app.request(`/api/admin/cars/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "terjual" }),
    });
    expect(statusRes.status).toBe(401);

    const featuredRes = await app.request(`/api/admin/cars/${id}/featured`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: true }),
    });
    expect(featuredRes.status).toBe(401);
  });
});
