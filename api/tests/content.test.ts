import { beforeAll, describe, expect, it } from "bun:test";
import { db, schema } from "db";
import { runSeed } from "db/src/seed";
import { app } from "../src/index";

describe("Content & Site Settings API (/api/* & /api/admin/*)", () => {
  let adminCookie = "";

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
  });

  describe("Public Content Endpoints", () => {
    it("GET /api/promos returns only active promos", async () => {
      const res = await app.request("/api/promos");
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        success: boolean;
        data: Array<{ id: string; title: string; isActive: boolean }>;
      };
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      for (const p of body.data) {
        expect(p.isActive).toBe(true);
      }
    });

    it("GET /api/testimonials returns only displayed testimonials", async () => {
      const res = await app.request("/api/testimonials");
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        success: boolean;
        data: Array<{ customerName: string; isDisplayed: boolean }>;
      };
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      for (const t of body.data) {
        expect(t.isDisplayed).toBe(true);
      }
    });

    it("GET /api/articles returns only published articles", async () => {
      const res = await app.request("/api/articles");
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        success: boolean;
        data: Array<{ title: string; status: string; slug: string }>;
        pagination: { total: number };
      };
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      for (const a of body.data) {
        expect(a.status).toBe("terbit");
      }
    });

    it("GET /api/articles/:slug returns detail for published article and 404 for draft", async () => {
      // 1. Valid published article
      const validSlug = "tips-cek-mobil-bekas-bebas-banjir-tabrak";
      const res = await app.request(`/api/articles/${validSlug}`);
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        success: boolean;
        data: { title: string; content: string };
      };
      expect(body.success).toBe(true);
      expect(body.data.title).toContain("Bebas Banjir");

      // 2. Draft article created via admin should return 404 in public API
      const draftSlug = `draft-article-${crypto.randomUUID().slice(0, 6)}`;
      await db.insert(schema.articles).values({
        title: "Draft Secret Article",
        slug: draftSlug,
        content: "Konten draft rahasia yang belum dipublikasi.",
        status: "draft",
      });

      const draftRes = await app.request(`/api/articles/${draftSlug}`);
      expect(draftRes.status).toBe(404);
    });

    it("GET /api/settings returns public showroom settings and credit parameters", async () => {
      const res = await app.request("/api/settings");
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        success: boolean;
        data: {
          showroomName: string;
          whatsappNumber: string;
          address: string;
          defaultInterestRate: string;
          minDownPaymentPercent: string;
          heroTitle: string;
          heroSubtitle: string;
        };
      };
      expect(body.success).toBe(true);
      expect(body.data.showroomName).toBe("Bintang Mobil");
      expect(body.data.whatsappNumber).toBeDefined();
      expect(Number(body.data.defaultInterestRate)).toBeGreaterThan(0);
      expect(Number(body.data.minDownPaymentPercent)).toBeGreaterThan(0);
      expect(body.data.heroTitle).toBeDefined();
    });
  });

  describe("Admin Content Endpoints (/api/admin/*)", () => {
    it("rejects unauthenticated requests to admin content endpoints", async () => {
      expect((await app.request("/api/admin/promos")).status).toBe(401);
      expect((await app.request("/api/admin/testimonials")).status).toBe(401);
      expect((await app.request("/api/admin/articles")).status).toBe(401);
      expect((await app.request("/api/admin/settings")).status).toBe(401);
    });

    it("performs CRUD operations on promos", async () => {
      // Create
      const createRes = await app.request("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          title: `Promo Akhir Tahun ${crypto.randomUUID().slice(0, 6)}`,
          description: "Bunga 0% tenor 1 tahun",
          isActive: true,
        }),
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as { data: { id: string } };
      const promoId = created.data.id;

      // Read detail
      const detailRes = await app.request(`/api/admin/promos/${promoId}`, {
        headers: { Cookie: adminCookie },
      });
      expect(detailRes.status).toBe(200);

      // Update
      const updateRes = await app.request(`/api/admin/promos/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ isActive: false }),
      });
      expect(updateRes.status).toBe(200);

      // Delete
      const deleteRes = await app.request(`/api/admin/promos/${promoId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(deleteRes.status).toBe(200);
    });

    it("performs CRUD operations on testimonials", async () => {
      // Create
      const createRes = await app.request("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          customerName: "Bapak Ahmad",
          location: "Bekasi",
          carName: "Honda HR-V 2019",
          quote: "Pelayanan sangat ramah dan transparan.",
          rating: 5,
        }),
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as { data: { id: string } };
      const testId = created.data.id;

      // Update
      const updateRes = await app.request(`/api/admin/testimonials/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ isDisplayed: false }),
      });
      expect(updateRes.status).toBe(200);

      // Delete
      const deleteRes = await app.request(`/api/admin/testimonials/${testId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(deleteRes.status).toBe(200);
    });

    it("performs CRUD operations on articles", async () => {
      // Create as draft
      const createRes = await app.request("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          title: `Panduan Perawatan Transmisi Matic ${crypto.randomUUID().slice(0, 6)}`,
          content: "Oli matic wajib diganti secara rutin setiap 40.000 km.",
          status: "draft",
        }),
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as {
        data: { id: string; status: string; slug: string };
      };
      const articleId = created.data.id;
      expect(created.data.status).toBe("draft");

      // Publish article
      const updateRes = await app.request(`/api/admin/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ status: "terbit" }),
      });
      expect(updateRes.status).toBe(200);

      // Delete
      const deleteRes = await app.request(`/api/admin/articles/${articleId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(deleteRes.status).toBe(200);
    });

    it("updates site settings via PATCH /api/admin/settings", async () => {
      const updateRes = await app.request("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          phoneNumber: "021-99998888",
          defaultInterestRate: "7.75",
          heroTitle: "Pusat Mobil Bekas Berkualitas Jakarta",
        }),
      });

      expect(updateRes.status).toBe(200);
      const body = (await updateRes.json()) as {
        success: boolean;
        data: {
          defaultInterestRate: string;
          heroTitle: string;
          phoneNumber: string;
        };
      };
      expect(body.success).toBe(true);
      expect(body.data.defaultInterestRate).toBe("7.75");
      expect(body.data.heroTitle).toBe("Pusat Mobil Bekas Berkualitas Jakarta");
      expect(body.data.phoneNumber).toBe("021-99998888");
    });

    it("rejects invalid payloads on admin content endpoints", async () => {
      const promoRes = await app.request("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ title: "ab" }),
      });
      expect(promoRes.status).toBe(400);

      const testimonialRes = await app.request("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ customerName: "A", quote: "ok", rating: 9 }),
      });
      expect(testimonialRes.status).toBe(400);

      const articleRes = await app.request("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          title: "Artikel Uji",
          content: "Konten artikel yang cukup panjang.",
          status: "tayang",
        }),
      });
      expect(articleRes.status).toBe(400);

      const settingsRes = await app.request("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ showroomName: "x", whatsappNumber: "123" }),
      });
      expect(settingsRes.status).toBe(400);

      const body = (await settingsRes.json()) as {
        success: boolean;
        error: { code: string };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects unauthenticated writes to admin content endpoints", async () => {
      const requests = [
        app.request("/api/admin/promos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Promo Tanpa Login" }),
        }),
        app.request("/api/admin/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerName: "Test", quote: "Testimoni" }),
        }),
        app.request("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Artikel", content: "Konten panjang" }),
        }),
        app.request("/api/admin/settings", { method: "PATCH" }),
      ];

      for (const res of await Promise.all(requests)) {
        expect(res.status).toBe(401);
      }
    });
  });
});
