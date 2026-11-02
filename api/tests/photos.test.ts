import { beforeAll, describe, expect, it } from "bun:test";
import { db, schema } from "db";
import { eq } from "drizzle-orm";
import { runSeed } from "db/src/seed";
import sharp from "sharp";
import { app } from "../src/index";

describe("Admin Car Photos API (/api/admin/cars/:carId/photos)", () => {
  let adminCookie = "";
  let testCarId = "";
  let testImageBuffer: Buffer;

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

    // Create a dedicated car for testing photos
    const [brand] = await db.select().from(schema.brands).limit(1);
    const testSlug = `mobil-uji-coba-foto-${crypto.randomUUID().slice(0, 8)}`;
    const [car] = await db
      .insert(schema.cars)
      .values({
        brandId: brand.id,
        title: "Mobil Uji Coba Foto 2025",
        slug: testSlug,
        model: "Test Car",
        year: 2025,
        price: 200000000,
        transmission: "manual",
        mileage: 5000,
        status: "tersedia",
      })
      .returning();
    testCarId = car.id;

    // Create dummy 100x100 PNG
    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 0, g: 120, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  });

  it("rejects photo upload without admin authentication", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([testImageBuffer], { type: "image/png" }),
      "car.png",
    );

    const res = await app.request(`/api/admin/cars/${testCarId}/photos`, {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(401);
  });

  it("successfully uploads photo, generates variants, and sets first photo as primary", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([testImageBuffer], { type: "image/png" }),
      "car.png",
    );

    const res = await app.request(`/api/admin/cars/${testCarId}/photos`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: formData,
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      success: boolean;
      data: Array<{
        id: string;
        url: string;
        isPrimary: boolean;
        order: number;
        variants: { large: string; medium: string; thumb: string };
      }>;
    };

    expect(body.success).toBe(true);
    expect(body.data.length).toBe(1);
    const uploaded = body.data[0];
    expect(uploaded.isPrimary).toBe(true);
    expect(uploaded.url).toContain(".webp");
    expect(uploaded.variants.large).toBeDefined();
    expect(uploaded.variants.medium).toBeDefined();
    expect(uploaded.variants.thumb).toBeDefined();

    // Verify static serving and cache headers
    const staticRes = await app.request(uploaded.url);
    expect(staticRes.status).toBe(200);
    expect(staticRes.headers.get("cache-control")).toContain(
      "max-age=31536000",
    );
    expect(staticRes.headers.get("content-type")).toContain("image/webp");
  });

  it("rejects unsupported file type", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["not an image content"], { type: "text/plain" }),
      "script.txt",
    );

    const res = await app.request(`/api/admin/cars/${testCarId}/photos`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: formData,
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
  });

  it("uploads second photo, reorders, and sets primary photo", async () => {
    // 1. Upload second photo
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([testImageBuffer], { type: "image/png" }),
      "car2.png",
    );

    const uploadRes = await app.request(`/api/admin/cars/${testCarId}/photos`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: formData,
    });
    expect(uploadRes.status).toBe(201);
    const uploadBody = (await uploadRes.json()) as {
      data: Array<{ id: string; isPrimary: boolean; order: number }>;
    };
    const secondPhotoId = uploadBody.data[0].id;
    expect(uploadBody.data[0].isPrimary).toBe(false);

    // Get all photos of car
    const allPhotos = await db
      .select()
      .from(schema.carPhotos)
      .where(eq(schema.carPhotos.carId, testCarId));
    expect(allPhotos.length).toBe(2);

    const firstPhotoId = allPhotos.find((p) => p.id !== secondPhotoId)!.id;

    // 2. Set second photo as primary
    const setPrimaryRes = await app.request(
      `/api/admin/cars/${testCarId}/photos/${secondPhotoId}/primary`,
      {
        method: "PATCH",
        headers: { Cookie: adminCookie },
      },
    );
    expect(setPrimaryRes.status).toBe(200);

    const afterPrimary = await db
      .select()
      .from(schema.carPhotos)
      .where(eq(schema.carPhotos.carId, testCarId));

    const p1 = afterPrimary.find((p) => p.id === firstPhotoId);
    const p2 = afterPrimary.find((p) => p.id === secondPhotoId);
    expect(p2?.isPrimary).toBe(true);
    expect(p1?.isPrimary).toBe(false);

    // 3. Reorder photos
    const reorderRes = await app.request(
      `/api/admin/cars/${testCarId}/photos/reorder`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          photos: [
            { id: secondPhotoId, order: 0 },
            { id: firstPhotoId, order: 1 },
          ],
        }),
      },
    );
    expect(reorderRes.status).toBe(200);

    // 4. Delete photo and verify file cleanup & primary promotion
    const deleteRes = await app.request(
      `/api/admin/cars/${testCarId}/photos/${secondPhotoId}`,
      {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      },
    );
    expect(deleteRes.status).toBe(200);

    // The remaining photo (firstPhotoId) should now be promoted to primary
    const remainingPhotos = await db
      .select()
      .from(schema.carPhotos)
      .where(eq(schema.carPhotos.carId, testCarId));

    expect(remainingPhotos.length).toBe(1);
    expect(remainingPhotos[0].id).toBe(firstPhotoId);
    expect(remainingPhotos[0].isPrimary).toBe(true);
  });

  it("rejects upload without a file", async () => {
    const form = new FormData();
    form.set("keterangan", "tanpa berkas");

    const res = await app.request(`/api/admin/cars/${testCarId}/photos`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: form,
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects files larger than 10MB", async () => {
    const oversized = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      "besar.png",
      { type: "image/png" },
    );
    const form = new FormData();
    form.set("file", oversized);

    const res = await app.request(`/api/admin/cars/${testCarId}/photos`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: form,
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UPLOAD_FAILED");
    expect(body.error.message).toContain("10MB");
  });
});
