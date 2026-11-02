import { db, schema } from "db";
import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";

export const leadsRouter = new Hono();
export const adminLeadsRouter = new Hono();

// Basic rate limiting for spam protection (max 5 submissions per 10 minutes per IP)
const submissionAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = submissionAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    submissionAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Indonesian phone number regex: +628..., 628..., 08... with 9 to 15 total digits
const indoPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;

const createLeadSchema = z.object({
  type: z.enum(["tukar_tambah", "test_drive", "kontak", "simulasi"], {
    message: "Tipe lead tidak valid",
  }),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s-]/g, ""))
    .refine((val) => indoPhoneRegex.test(val), {
      message:
        "Nomor telepon tidak valid. Gunakan format nomor HP Indonesia (misal: 08123456789 atau 628123456789)",
    }),
  carId: z.string().uuid("ID mobil tidak valid").optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  data: z.record(z.string(), z.unknown()).optional().default({}),
  honeypot: z.string().optional(), // Bot field; must be empty
});

// POST /api/leads - Pengiriman lead dari pengunjung
leadsRouter.post("/", async (c) => {
  const ip =
    c.req.header("x-forwarded-for") ||
    c.req.header("cf-connecting-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return c.json(
      {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message:
            "Terlalu banyak permintaan pengiriman lead. Silakan coba lagi beberapa saat lagi.",
        },
      },
      429,
    );
  }

  const rawBody = await c.req.json().catch(() => ({}));
  const parseResult = createLeadSchema.safeParse(rawBody);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validasi formulir lead gagal",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const { type, name, phone, carId, notes, data, honeypot } = parseResult.data;

  // Spam protection: honeypot trap
  if (honeypot && honeypot.trim().length > 0) {
    return c.json(
      {
        success: false,
        error: {
          code: "SPAM_DETECTED",
          message: "Permintaan ditolak",
        },
      },
      400,
    );
  }

  // Verifikasi carId ada di DB jika diberikan
  if (carId) {
    const [carExists] = await db
      .select({ id: schema.cars.id })
      .from(schema.cars)
      .where(eq(schema.cars.id, carId))
      .limit(1);

    if (!carExists) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Mobil terkait tidak ditemukan",
          },
        },
        404,
      );
    }
  }

  const [newLead] = await db
    .insert(schema.leads)
    .values({
      type,
      name,
      phone,
      carId: carId || null,
      notes: notes || null,
      data,
      status: "baru",
    })
    .returning();

  return c.json(
    {
      success: true,
      message:
        "Permintaan berhasil dikirim. Tim kami akan segera menghubungi Anda.",
      data: {
        id: newLead.id,
        type: newLead.type,
        status: newLead.status,
        createdAt: newLead.createdAt,
      },
    },
    201,
  );
});

// Admin Leads Endpoints (Protected by requireAdminAuth)
adminLeadsRouter.use("*", requireAdminAuth);

const adminLeadQuerySchema = z.object({
  type: z.enum(["tukar_tambah", "test_drive", "kontak", "simulasi"]).optional(),
  status: z.enum(["baru", "dihubungi", "selesai"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// GET /api/admin/leads - Daftar lead untuk admin
adminLeadsRouter.get("/", async (c) => {
  const query = c.req.query();
  const parseResult = adminLeadQuerySchema.safeParse(query);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Parameter query tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const { type, status, page, limit } = parseResult.data;
  const conditions = [];

  if (type) conditions.push(eq(schema.leads.type, type));
  if (status) conditions.push(eq(schema.leads.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db
    .select({ val: count() })
    .from(schema.leads)
    .where(whereClause);

  const total = Number(totalRes?.val || 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const leadList = await db.query.leads.findMany({
    where: whereClause,
    orderBy: [desc(schema.leads.createdAt)],
    limit,
    offset,
    with: {
      car: {
        columns: {
          id: true,
          title: true,
          slug: true,
          price: true,
        },
      },
    },
  });

  return c.json({
    success: true,
    data: leadList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

// GET /api/admin/leads/:id - Detail lead untuk admin
adminLeadsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const lead = await db.query.leads.findMany({
    where: eq(schema.leads.id, id),
    limit: 1,
    with: {
      car: {
        columns: {
          id: true,
          title: true,
          slug: true,
          price: true,
          year: true,
          transmission: true,
        },
      },
    },
  });

  if (lead.length === 0) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Lead tidak ditemukan",
        },
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: lead[0],
  });
});

const updateLeadSchema = z.object({
  status: z.enum(["baru", "dihubungi", "selesai"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// PATCH /api/admin/leads/:id - Perbarui status atau catatan lead
adminLeadsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = updateLeadSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data update tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const { status, notes } = parseResult.data;

  const [existing] = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .where(eq(schema.leads.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Lead tidak ditemukan",
        },
      },
      404,
    );
  }

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (status !== undefined) updateValues.status = status;
  if (notes !== undefined) updateValues.notes = notes;

  const [updated] = await db
    .update(schema.leads)
    .set(updateValues)
    .where(eq(schema.leads.id, id))
    .returning();

  return c.json({
    success: true,
    message: "Data lead berhasil diperbarui",
    data: updated,
  });
});
