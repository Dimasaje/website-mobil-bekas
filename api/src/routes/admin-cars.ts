import { db, schema } from "db";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";
import { adminPhotosRouter } from "./photos";

export const adminCarsRouter = new Hono();

adminCarsRouter.use("*", requireAdminAuth);

// Helper fungsi pembuatan slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function ensureUniqueSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug || "mobil";
  let counter = 1;
  while (true) {
    const existing = await db
      .select({ id: schema.cars.id })
      .from(schema.cars)
      .where(eq(schema.cars.slug, slug))
      .limit(1);

    if (existing.length === 0 || (excludeId && existing[0].id === excludeId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter++}`;
  }
}

const carInputSchema = z.object({
  brandId: z.string().uuid("ID merek tidak valid"),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(150),
  slug: z.string().trim().optional(),
  model: z.string().trim().min(1, "Model mobil wajib diisi"),
  year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive("Harga harus lebih dari 0"),
  transmission: z.enum(["manual", "matic"]),
  mileage: z.coerce.number().nonnegative("Jarak tempuh tidak boleh negatif"),
  fuelType: z.enum(["bensin", "diesel", "hybrid", "listrik"]).default("bensin"),
  engineCapacity: z.coerce.number().positive().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  licensePlate: z.string().trim().optional().nullable(),
  stnkValidUntil: z
    .string()
    .datetime()
    .or(z.string().date())
    .optional()
    .nullable(),
  description: z.string().trim().optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  status: z
    .enum(["draft", "tersedia", "booking", "terjual", "diarsipkan"])
    .default("tersedia"),
  isFeatured: z.boolean().default(false),
});

const carUpdateSchema = carInputSchema.partial();

// GET /api/admin/cars - List mobil untuk admin dengan filter lengkap
adminCarsRouter.get("/", async (c) => {
  const query = c.req.query();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.status) {
    conditions.push(eq(schema.cars.status, query.status));
  }
  if (query.brandId) {
    conditions.push(eq(schema.cars.brandId, query.brandId));
  }
  if (query.isFeatured !== undefined) {
    conditions.push(eq(schema.cars.isFeatured, query.isFeatured === "true"));
  }
  if (query.search && query.search.trim()) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(
        ilike(schema.cars.title, term),
        ilike(schema.cars.model, term),
        ilike(schema.cars.licensePlate, term),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db
    .select({ val: count() })
    .from(schema.cars)
    .where(whereClause);

  const total = Number(totalRes?.val || 0);
  const totalPages = Math.ceil(total / limit);

  const carList = await db.query.cars.findMany({
    where: whereClause,
    orderBy: [desc(schema.cars.createdAt)],
    limit,
    offset,
    with: {
      brand: true,
      photos: {
        orderBy: [asc(schema.carPhotos.order)],
      },
    },
  });

  return c.json({
    success: true,
    data: carList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

// GET /api/admin/cars/:id - Detail mobil untuk admin
adminCarsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const car = await db.query.cars.findMany({
    where: eq(schema.cars.id, id),
    limit: 1,
    with: {
      brand: true,
      photos: {
        orderBy: [asc(schema.carPhotos.order)],
      },
    },
  });

  if (car.length === 0) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Mobil tidak ditemukan",
        },
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: car[0],
  });
});

// POST /api/admin/cars - Tambah mobil baru
adminCarsRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parseResult = carInputSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data mobil tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const data = parseResult.data;

  // Verifikasi brandId
  const [brand] = await db
    .select({ id: schema.brands.id })
    .from(schema.brands)
    .where(eq(schema.brands.id, data.brandId))
    .limit(1);

  if (!brand) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Merek kendaraan tidak ditemukan",
        },
      },
      400,
    );
  }

  // Buat slug otomatis jika tidak diisi atau pastikan unik
  const baseSlug = data.slug
    ? generateSlug(data.slug)
    : generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const [createdCar] = await db
    .insert(schema.cars)
    .values({
      brandId: data.brandId,
      title: data.title,
      slug,
      model: data.model,
      year: data.year,
      price: data.price,
      transmission: data.transmission,
      mileage: data.mileage,
      fuelType: data.fuelType,
      engineCapacity: data.engineCapacity || null,
      color: data.color || null,
      licensePlate: data.licensePlate || null,
      stnkValidUntil: data.stnkValidUntil
        ? new Date(data.stnkValidUntil)
        : null,
      description: data.description || null,
      features: data.features,
      status: data.status,
      isFeatured: data.isFeatured,
    })
    .returning();

  return c.json(
    {
      success: true,
      message: "Mobil berhasil ditambahkan",
      data: createdCar,
    },
    201,
  );
});

// PATCH /api/admin/cars/:id - Perbarui data mobil
adminCarsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = carUpdateSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data pembaruan mobil tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const [existing] = await db
    .select()
    .from(schema.cars)
    .where(eq(schema.cars.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Mobil tidak ditemukan",
        },
      },
      404,
    );
  }

  const data = parseResult.data;
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.brandId !== undefined) {
    const [brand] = await db
      .select({ id: schema.brands.id })
      .from(schema.brands)
      .where(eq(schema.brands.id, data.brandId))
      .limit(1);
    if (!brand) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Merek kendaraan tidak ditemukan",
          },
        },
        400,
      );
    }
    updateValues.brandId = data.brandId;
  }

  if (data.title !== undefined) updateValues.title = data.title;
  if (data.model !== undefined) updateValues.model = data.model;
  if (data.year !== undefined) updateValues.year = data.year;
  if (data.price !== undefined) updateValues.price = data.price;
  if (data.transmission !== undefined)
    updateValues.transmission = data.transmission;
  if (data.mileage !== undefined) updateValues.mileage = data.mileage;
  if (data.fuelType !== undefined) updateValues.fuelType = data.fuelType;
  if (data.engineCapacity !== undefined)
    updateValues.engineCapacity = data.engineCapacity;
  if (data.color !== undefined) updateValues.color = data.color;
  if (data.licensePlate !== undefined)
    updateValues.licensePlate = data.licensePlate;
  if (data.stnkValidUntil !== undefined) {
    updateValues.stnkValidUntil = data.stnkValidUntil
      ? new Date(data.stnkValidUntil)
      : null;
  }
  if (data.description !== undefined)
    updateValues.description = data.description;
  if (data.features !== undefined) updateValues.features = data.features;
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.isFeatured !== undefined) updateValues.isFeatured = data.isFeatured;

  if (data.slug !== undefined) {
    const baseSlug = generateSlug(data.slug || existing.title);
    updateValues.slug = await ensureUniqueSlug(baseSlug, id);
  }

  const [updatedCar] = await db
    .update(schema.cars)
    .set(updateValues)
    .where(eq(schema.cars.id, id))
    .returning();

  return c.json({
    success: true,
    message: "Data mobil berhasil diperbarui",
    data: updatedCar,
  });
});

// PATCH /api/admin/cars/:id/status - Ubah status cepat
adminCarsRouter.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));

  const schemaValidation = z.object({
    status: z.enum(["draft", "tersedia", "booking", "terjual", "diarsipkan"]),
  });

  const parsed = schemaValidation.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Status harus salah satu dari: draft, tersedia, booking, terjual, diarsipkan",
        },
      },
      400,
    );
  }

  const [updated] = await db
    .update(schema.cars)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(schema.cars.id, id))
    .returning();

  if (!updated) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Mobil tidak ditemukan",
        },
      },
      404,
    );
  }

  return c.json({
    success: true,
    message: `Status mobil berhasil diubah menjadi ${parsed.data.status}`,
    data: updated,
  });
});

// PATCH /api/admin/cars/:id/featured - Ubah flag unggulan
adminCarsRouter.patch("/:id/featured", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));

  const schemaValidation = z.object({
    isFeatured: z.boolean(),
  });

  const parsed = schemaValidation.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "isFeatured harus berupa boolean (true/false)",
        },
      },
      400,
    );
  }

  const [updated] = await db
    .update(schema.cars)
    .set({ isFeatured: parsed.data.isFeatured, updatedAt: new Date() })
    .where(eq(schema.cars.id, id))
    .returning();

  if (!updated) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Mobil tidak ditemukan",
        },
      },
      404,
    );
  }

  return c.json({
    success: true,
    message: `Mobil berhasil ${parsed.data.isFeatured ? "dijadikan" : "dihapus dari"} unggulan`,
    data: updated,
  });
});

// DELETE /api/admin/cars/:id - Penghapusan berupa arsip (soft delete)
adminCarsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const [car] = await db
    .select({ id: schema.cars.id, status: schema.cars.status })
    .from(schema.cars)
    .where(eq(schema.cars.id, id))
    .limit(1);

  if (!car) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Mobil tidak ditemukan",
        },
      },
      404,
    );
  }

  // Penghapusan berupa arsip, bukan hilang permanen
  const [archived] = await db
    .update(schema.cars)
    .set({ status: "diarsipkan", updatedAt: new Date() })
    .where(eq(schema.cars.id, id))
    .returning();

  return c.json({
    success: true,
    message: "Mobil berhasil diarsipkan",
    data: archived,
  });
});

// Mount photos routes on /:carId/photos subpaths
adminCarsRouter.route("/", adminPhotosRouter);
