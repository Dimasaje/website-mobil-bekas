import { db, schema } from "db";
import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";

export const contentRouter = new Hono();

// GET /api/promos - Promo aktif
export const publicPromosRouter = new Hono();
publicPromosRouter.get("/", async (c) => {
  const promoList = await db
    .select()
    .from(schema.promos)
    .where(eq(schema.promos.isActive, true))
    .orderBy(desc(schema.promos.createdAt));

  return c.json({
    success: true,
    data: promoList,
  });
});

// GET /api/testimonials - Testimoni yang ditampilkan
export const publicTestimonialsRouter = new Hono();
publicTestimonialsRouter.get("/", async (c) => {
  const testimonialList = await db
    .select()
    .from(schema.testimonials)
    .where(eq(schema.testimonials.isDisplayed, true))
    .orderBy(desc(schema.testimonials.createdAt));

  return c.json({
    success: true,
    data: testimonialList,
  });
});

// GET /api/articles - Artikel terbit dengan pagination
export const publicArticlesRouter = new Hono();
publicArticlesRouter.get("/", async (c) => {
  const query = c.req.query();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const offset = (page - 1) * limit;

  const [totalRes] = await db
    .select({ val: count() })
    .from(schema.articles)
    .where(eq(schema.articles.status, "terbit"));

  const total = Number(totalRes?.val || 0);
  const totalPages = Math.ceil(total / limit);

  const articleList = await db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.status, "terbit"))
    .orderBy(desc(schema.articles.publishedAt), desc(schema.articles.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: articleList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

// GET /api/articles/:slug - Detail artikel terbit
publicArticlesRouter.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [article] = await db
    .select()
    .from(schema.articles)
    .where(
      and(eq(schema.articles.slug, slug), eq(schema.articles.status, "terbit")),
    )
    .limit(1);

  if (!article) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Artikel tidak ditemukan atau belum diterbitkan",
        },
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: article,
  });
});

// GET /api/settings - Pengaturan situs publik
export const publicSettingsRouter = new Hono();
publicSettingsRouter.get("/", async (c) => {
  const [settings] = await db
    .select({
      showroomName: schema.siteSettings.showroomName,
      whatsappNumber: schema.siteSettings.whatsappNumber,
      phoneNumber: schema.siteSettings.phoneNumber,
      address: schema.siteSettings.address,
      mapsUrl: schema.siteSettings.mapsUrl,
      openingHours: schema.siteSettings.openingHours,
      defaultInterestRate: schema.siteSettings.defaultInterestRate,
      minDownPaymentPercent: schema.siteSettings.minDownPaymentPercent,
      heroTitle: schema.siteSettings.heroTitle,
      heroSubtitle: schema.siteSettings.heroSubtitle,
    })
    .from(schema.siteSettings)
    .limit(1);

  return c.json({
    success: true,
    data: settings || {
      showroomName: "Bintang Mobil",
      whatsappNumber: "6281298765432",
      phoneNumber: "021-87654321",
      address: "Jl. Raya Otista No. 123, Jakarta Timur",
      mapsUrl: "https://maps.google.com/?q=Jakarta+Timur",
      openingHours: "Senin - Minggu: 08:30 - 18:00 WIB",
      defaultInterestRate: "8.50",
      minDownPaymentPercent: "20.00",
      heroTitle: "Temukan Mobil Bekas Impian Anda",
      heroSubtitle:
        "Pilihan terlengkap, kondisi prima terjamin, bebas banjir dan tabrak.",
    },
  });
});
