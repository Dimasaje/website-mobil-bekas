import { beforeAll, describe, expect, it } from "bun:test";
import { db, schema } from "db";
import { runSeed } from "db/src/seed";
import { app } from "../src/index";

describe("Leads API (/api/leads & /api/admin/leads)", () => {
  let adminCookie = "";
  let sampleCarId = "";

  beforeAll(async () => {
    await runSeed();

    // Login as admin to get cookie
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@bintangmobil.com",
        password: "Admin123!",
      }),
    });
    adminCookie = loginRes.headers.get("set-cookie") || "";

    // Get a sample car ID
    const [car] = await db.select().from(schema.cars).limit(1);
    sampleCarId = car.id;
  });

  describe("Public Lead Submission (POST /api/leads)", () => {
    it("successfully submits a valid lead with Indonesian phone (08...)", async () => {
      const res = await app.request("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "10.0.0.1",
        },
        body: JSON.stringify({
          type: "test_drive",
          name: "Budi Santoso",
          phone: "081234567890",
          carId: sampleCarId,
          notes: "Ingin coba akhir pekan ini",
          data: { preferredDate: "2026-11-08" },
        }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        success: boolean;
        data: { id: string; type: string; status: string };
      };
      expect(body.success).toBe(true);
      expect(body.data.type).toBe("test_drive");
      expect(body.data.status).toBe("baru");
      expect(body.data.id).toBeDefined();
    });

    it("successfully submits lead with country code (+628 / 628)", async () => {
      const res = await app.request("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "10.0.0.2",
        },
        body: JSON.stringify({
          type: "tukar_tambah",
          name: "Siti Aminah",
          phone: "+62 813-8888-9999",
          notes: "Tukar tambah Avanza lama",
          data: { oldCar: "Toyota Avanza 2015" },
        }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
    });

    it("rejects invalid Indonesian phone number", async () => {
      const res = await app.request("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "10.0.0.3",
        },
        body: JSON.stringify({
          type: "kontak",
          name: "Invalid User",
          phone: "123456", // Bukan nomor HP Indonesia
        }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        success: boolean;
        error: { code: string; message: string };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects bot submissions when honeypot is populated", async () => {
      const res = await app.request("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "10.0.0.4",
        },
        body: JSON.stringify({
          type: "simulasi",
          name: "Spam Bot",
          phone: "081299998888",
          honeypot: "http://spam-link.com",
        }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        success: boolean;
        error: { code: string };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SPAM_DETECTED");
    });

    it("enforces rate limiting after 5 submissions from same IP", async () => {
      const testIp = "10.0.0.99";
      for (let i = 0; i < 5; i++) {
        const res = await app.request("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": testIp,
          },
          body: JSON.stringify({
            type: "kontak",
            name: `User ${i}`,
            phone: "081234567891",
          }),
        });
        expect(res.status).toBe(201);
      }

      // 6th attempt should be blocked
      const blockedRes = await app.request("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": testIp,
        },
        body: JSON.stringify({
          type: "kontak",
          name: "User 6",
          phone: "081234567891",
        }),
      });

      expect(blockedRes.status).toBe(429);
      const body = (await blockedRes.json()) as {
        success: boolean;
        error: { code: string };
      };
      expect(body.error.code).toBe("TOO_MANY_REQUESTS");
    });
  });

  describe("Admin Lead Management (/api/admin/leads)", () => {
    let createdLeadId = "";

    beforeAll(async () => {
      // Create a test lead
      const res = await app.request("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "10.0.1.1",
        },
        body: JSON.stringify({
          type: "test_drive",
          name: "Pak Rahmat",
          phone: "081298765432",
          carId: sampleCarId,
          notes: "Test drive hari Sabtu pagi",
        }),
      });
      const body = (await res.json()) as { data: { id: string } };
      createdLeadId = body.data.id;
    });

    it("rejects unauthenticated requests to /api/admin/leads", async () => {
      const res = await app.request("/api/admin/leads");
      expect(res.status).toBe(401);
    });

    it("lists leads with filters and pagination for authenticated admin", async () => {
      const res = await app.request("/api/admin/leads?type=test_drive", {
        headers: { Cookie: adminCookie },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        success: boolean;
        data: Array<{ id: string; type: string; car: unknown }>;
        pagination: { total: number };
      };
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      for (const item of body.data) {
        expect(item.type).toBe("test_drive");
      }
    });

    it("gets lead detail with car relation", async () => {
      const res = await app.request(`/api/admin/leads/${createdLeadId}`, {
        headers: { Cookie: adminCookie },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        success: boolean;
        data: {
          id: string;
          name: string;
          phone: string;
          car: { id: string; title: string };
        };
      };
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdLeadId);
      expect(body.data.name).toBe("Pak Rahmat");
      expect(body.data.car).toBeDefined();
    });

    it("updates lead status and notes", async () => {
      const res = await app.request(`/api/admin/leads/${createdLeadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          status: "dihubungi",
          notes: "Sudah dihubungi via WA, jadwal disetujui jam 10 pagi",
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        success: boolean;
        data: { status: string; notes: string };
      };
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("dihubungi");
      expect(body.data.notes).toContain("Sudah dihubungi via WA");
    });

    it("returns 404 for non-existent lead ID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.request(`/api/admin/leads/${fakeId}`, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(404);
    });

    it("rejects invalid admin lead updates and unauthenticated writes", async () => {
      const [lead] = await db.select().from(schema.leads).limit(1);

      const invalidRes = await app.request(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ status: "status-tidak-valid" }),
      });
      expect(invalidRes.status).toBe(400);

      const noAuthRes = await app.request(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "selesai" }),
      });
      expect(noAuthRes.status).toBe(401);
    });
  });
});
