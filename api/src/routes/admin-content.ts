import { db, schema } from "db";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";
import { ensureUniqueSlug, generateSlug } from "./admin-cars";

// Helper slug check for promos and articles
async function ensureUniquePromoSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug || "promo";
  let counter = 1;
  while (true) {
    const existing = await db
      .select({ id: schema.promos.id })
      .from(schema.promos)
      .where(eq(schema.promos.slug, slug))
      .limit(1);

    if (existing.length === 0 || (excludeId && existing[0].id === excludeId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter++}`;
  }
}

async function ensureUniqueArticleSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug || "artikel";
  let counter = 1;
  while (true) {
    const existing = await db
      .select({ id: schema.articles.id })
      .from(schema.articles)
      .where(eq(schema.articles.slug, slug))
      .limit(1);

    if (existing.length === 0 || (excludeId && existing[0].id === excludeId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter++}`;
  }
}

// 1. Admin Promos Router
export const adminPromosRouter = new Hono();
adminPromosRouter.use("*", requireAdminAuth);

const promoInputSchema = z.object({
  title: z.string().trim().min(3, "Judul promo minimal 3 karakter").max(150),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional().nullable(),
  bannerUrl: z.string().trim().optional().nullable(),
  startDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  endDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  isActive: z.boolean().default(true),
});

adminPromosRouter.get("/", async (c) => {
  const promoList = await db
    .select()
    .from(schema.promos)
    .orderBy(desc(schema.promos.createdAt));
  return c.json({ success: true, data: promoList });
});

adminPromosRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [promo] = await db
    .select()
    .from(schema.promos)
    .where(eq(schema.promos.id, id))
    .limit(1);

  if (!promo) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Promo tidak ditemukan" },
      },
      404,
    );
  }
  return c.json({ success: true, data: promo });
});

adminPromosRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parseResult = promoInputSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data promo tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const data = parseResult.data;
  const baseSlug = data.slug
    ? generateSlug(data.slug)
    : generateSlug(data.title);
  const slug = await ensureUniquePromoSlug(baseSlug);

  const [newPromo] = await db
    .insert(schema.promos)
    .values({
      title: data.title,
      slug,
      description: data.description || null,
      bannerUrl: data.bannerUrl || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: data.isActive,
    })
    .returning();

  return c.json(
    { success: true, message: "Promo berhasil dibuat", data: newPromo },
    201,
  );
});

adminPromosRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = promoInputSchema.partial().safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data pembaruan promo tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const [existing] = await db
    .select()
    .from(schema.promos)
    .where(eq(schema.promos.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Promo tidak ditemukan" },
      },
      404,
    );
  }

  const data = parseResult.data;
  const updateValues: Record<string, unknown> = {};

  if (data.title !== undefined) updateValues.title = data.title;
  if (data.description !== undefined)
    updateValues.description = data.description;
  if (data.bannerUrl !== undefined) updateValues.bannerUrl = data.bannerUrl;
  if (data.startDate !== undefined) {
    updateValues.startDate = data.startDate ? new Date(data.startDate) : null;
  }
  if (data.endDate !== undefined) {
    updateValues.endDate = data.endDate ? new Date(data.endDate) : null;
  }
  if (data.isActive !== undefined) updateValues.isActive = data.isActive;

  if (data.slug !== undefined) {
    const baseSlug = generateSlug(data.slug || existing.title);
    updateValues.slug = await ensureUniquePromoSlug(baseSlug, id);
  }

  const [updated] = await db
    .update(schema.promos)
    .set(updateValues)
    .where(eq(schema.promos.id, id))
    .returning();

  return c.json({
    success: true,
    message: "Promo berhasil diperbarui",
    data: updated,
  });
});

adminPromosRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [deleted] = await db
    .delete(schema.promos)
    .where(eq(schema.promos.id, id))
    .returning();

  if (!deleted) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Promo tidak ditemukan" },
      },
      404,
    );
  }
  return c.json({ success: true, message: "Promo berhasil dihapus" });
});

// 2. Admin Testimonials Router
export const adminTestimonialsRouter = new Hono();
adminTestimonialsRouter.use("*", requireAdminAuth);

const testimonialInputSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Nama pelanggan minimal 2 karakter")
    .max(100),
  location: z.string().trim().optional().nullable(),
  carName: z.string().trim().optional().nullable(),
  photoUrl: z.string().trim().optional().nullable(),
  quote: z.string().trim().min(5, "Testimoni minimal 5 karakter").max(1000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isDisplayed: z.boolean().default(true),
});

adminTestimonialsRouter.get("/", async (c) => {
  const testimonialList = await db
    .select()
    .from(schema.testimonials)
    .orderBy(desc(schema.testimonials.createdAt));
  return c.json({ success: true, data: testimonialList });
});

adminTestimonialsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [testimonial] = await db
    .select()
    .from(schema.testimonials)
    .where(eq(schema.testimonials.id, id))
    .limit(1);

  if (!testimonial) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Testimoni tidak ditemukan" },
      },
      404,
    );
  }
  return c.json({ success: true, data: testimonial });
});

adminTestimonialsRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parseResult = testimonialInputSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data testimoni tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const [newTestimonial] = await db
    .insert(schema.testimonials)
    .values(parseResult.data)
    .returning();

  return c.json(
    {
      success: true,
      message: "Testimoni berhasil dibuat",
      data: newTestimonial,
    },
    201,
  );
});

adminTestimonialsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = testimonialInputSchema.partial().safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data testimoni tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const [updated] = await db
    .update(schema.testimonials)
    .set(parseResult.data)
    .where(eq(schema.testimonials.id, id))
    .returning();

  if (!updated) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Testimoni tidak ditemukan" },
      },
      404,
    );
  }

  return c.json({
    success: true,
    message: "Testimoni berhasil diperbarui",
    data: updated,
  });
});

adminTestimonialsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [deleted] = await db
    .delete(schema.testimonials)
    .where(eq(schema.testimonials.id, id))
    .returning();

  if (!deleted) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Testimoni tidak ditemukan" },
      },
      404,
    );
  }
  return c.json({ success: true, message: "Testimoni berhasil dihapus" });
});

// 3. Admin Articles Router
export const adminArticlesRouter = new Hono();
adminArticlesRouter.use("*", requireAdminAuth);

const articleInputSchema = z.object({
  title: z.string().trim().min(3, "Judul artikel minimal 3 karakter").max(200),
  slug: z.string().trim().optional(),
  content: z.string().trim().min(10, "Konten artikel minimal 10 karakter"),
  coverImageUrl: z.string().trim().optional().nullable(),
  status: z.enum(["draft", "terbit"]).default("draft"),
  publishedAt: z
    .string()
    .datetime()
    .or(z.string().date())
    .optional()
    .nullable(),
});

adminArticlesRouter.get("/", async (c) => {
  const query = c.req.query();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const [totalRes] = await db.select({ val: count() }).from(schema.articles);
  const total = Number(totalRes?.val || 0);
  const totalPages = Math.ceil(total / limit);

  const articleList = await db
    .select()
    .from(schema.articles)
    .orderBy(desc(schema.articles.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: articleList,
    pagination: { page, limit, total, totalPages },
  });
});

adminArticlesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [article] = await db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.id, id))
    .limit(1);

  if (!article) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Artikel tidak ditemukan" },
      },
      404,
    );
  }
  return c.json({ success: true, data: article });
});

adminArticlesRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parseResult = articleInputSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data artikel tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const data = parseResult.data;
  const baseSlug = data.slug
    ? generateSlug(data.slug)
    : generateSlug(data.title);
  const slug = await ensureUniqueArticleSlug(baseSlug);

  const publishedAt =
    data.status === "terbit"
      ? data.publishedAt
        ? new Date(data.publishedAt)
        : new Date()
      : null;

  const [newArticle] = await db
    .insert(schema.articles)
    .values({
      title: data.title,
      slug,
      content: data.content,
      coverImageUrl: data.coverImageUrl || null,
      status: data.status,
      publishedAt,
    })
    .returning();

  return c.json(
    { success: true, message: "Artikel berhasil dibuat", data: newArticle },
    201,
  );
});

adminArticlesRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = articleInputSchema.partial().safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data artikel tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const [existing] = await db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Artikel tidak ditemukan" },
      },
      404,
    );
  }

  const data = parseResult.data;
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateValues.title = data.title;
  if (data.content !== undefined) updateValues.content = data.content;
  if (data.coverImageUrl !== undefined)
    updateValues.coverImageUrl = data.coverImageUrl;
  if (data.status !== undefined) {
    updateValues.status = data.status;
    if (
      data.status === "terbit" &&
      !existing.publishedAt &&
      !data.publishedAt
    ) {
      updateValues.publishedAt = new Date();
    }
  }
  if (data.publishedAt !== undefined) {
    updateValues.publishedAt = data.publishedAt
      ? new Date(data.publishedAt)
      : null;
  }

  if (data.slug !== undefined) {
    const baseSlug = generateSlug(data.slug || existing.title);
    updateValues.slug = await ensureUniqueArticleSlug(baseSlug, id);
  }

  const [updated] = await db
    .update(schema.articles)
    .set(updateValues)
    .where(eq(schema.articles.id, id))
    .returning();

  return c.json({
    success: true,
    message: "Artikel berhasil diperbarui",
    data: updated,
  });
});

adminArticlesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [deleted] = await db
    .delete(schema.articles)
    .where(eq(schema.articles.id, id))
    .returning();

  if (!deleted) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Artikel tidak ditemukan" },
      },
      404,
    );
  }
  return c.json({ success: true, message: "Artikel berhasil dihapus" });
});

// 4. Admin Site Settings Router
export const adminSettingsRouter = new Hono();
adminSettingsRouter.use("*", requireAdminAuth);

const settingsUpdateSchema = z.object({
  showroomName: z.string().trim().min(2).optional(),
  whatsappNumber: z.string().trim().min(8).optional(),
  phoneNumber: z.string().trim().optional().nullable(),
  address: z.string().trim().min(5).optional(),
  mapsUrl: z.string().trim().optional().nullable(),
  openingHours: z.string().trim().optional().nullable(),
  defaultInterestRate: z.string().trim().optional(),
  minDownPaymentPercent: z.string().trim().optional(),
  heroTitle: z.string().trim().optional().nullable(),
  heroSubtitle: z.string().trim().optional().nullable(),
});

adminSettingsRouter.get("/", async (c) => {
  const [settings] = await db.select().from(schema.siteSettings).limit(1);
  return c.json({ success: true, data: settings });
});

adminSettingsRouter.patch("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parseResult = settingsUpdateSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data pengaturan situs tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const data = parseResult.data;
  const updateValues = {
    ...data,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .insert(schema.siteSettings)
    .values({
      id: "default",
      ...updateValues,
    })
    .onConflictDoUpdate({
      target: schema.siteSettings.id,
      set: updateValues,
    })
    .returning();

  return c.json({
    success: true,
    message: "Pengaturan situs berhasil disimpan",
    data: updated,
  });
});
