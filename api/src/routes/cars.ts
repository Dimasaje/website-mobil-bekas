import { db, schema } from "db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

export const carsRouter = new Hono();

const querySchema = z.object({
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minYear: z.coerce.number().optional(),
  maxYear: z.coerce.number().optional(),
  transmission: z.enum(["manual", "matic"]).optional(),
  fuelType: z.enum(["bensin", "diesel", "hybrid", "listrik"]).optional(),
  search: z.string().optional(),
  status: z.enum(["tersedia", "booking", "terjual"]).optional(),
  isFeatured: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "year_desc", "mileage_asc"])
    .default("newest"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

// GET /api/cars/filters - Endpoint opsi filter (merek dan rentang nilai)
carsRouter.get("/filters", async (c) => {
  // Hanya hitung mobil publik (bukan draft atau diarsipkan)
  const publicCarsFilter = notInArray(schema.cars.status, [
    "draft",
    "diarsipkan",
  ]);

  const [stats] = await db
    .select({
      minPrice: sql<number>`COALESCE(MIN(${schema.cars.price}), 0)`,
      maxPrice: sql<number>`COALESCE(MAX(${schema.cars.price}), 0)`,
      minYear: sql<number>`COALESCE(MIN(${schema.cars.year}), 2015)`,
      maxYear: sql<number>`COALESCE(MAX(${schema.cars.year}), 2026)`,
    })
    .from(schema.cars)
    .where(publicCarsFilter);

  const brandList = await db
    .select({
      id: schema.brands.id,
      name: schema.brands.name,
      slug: schema.brands.slug,
      carCount: count(schema.cars.id),
    })
    .from(schema.brands)
    .leftJoin(
      schema.cars,
      and(
        eq(schema.brands.id, schema.cars.brandId),
        notInArray(schema.cars.status, ["draft", "diarsipkan"]),
      ),
    )
    .groupBy(schema.brands.id, schema.brands.name, schema.brands.slug)
    .orderBy(asc(schema.brands.name));

  return c.json({
    success: true,
    data: {
      brands: brandList,
      priceRange: {
        min: Number(stats?.minPrice || 0),
        max: Number(stats?.maxPrice || 0),
      },
      yearRange: {
        min: Number(stats?.minYear || 2015),
        max: Number(stats?.maxYear || 2026),
      },
      transmissions: ["manual", "matic"],
      fuelTypes: ["bensin", "diesel", "hybrid", "listrik"],
    },
  });
});

// GET /api/cars - Daftar mobil publik dengan filter, sort, dan pagination
carsRouter.get("/", async (c) => {
  const query = c.req.query();
  const parseResult = querySchema.safeParse(query);

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

  const {
    brand,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    transmission,
    fuelType,
    search,
    status,
    isFeatured,
    sort,
    page,
    limit,
  } = parseResult.data;

  // Syarat mutlak: status draft dan diarsipkan TIDAK PERNAH tampil di publik
  const conditions = [notInArray(schema.cars.status, ["draft", "diarsipkan"])];

  if (status) {
    conditions.push(eq(schema.cars.status, status));
  }

  if (isFeatured !== undefined) {
    conditions.push(eq(schema.cars.isFeatured, isFeatured));
  }

  if (brand) {
    // Cari brandId dari slug atau nama
    const [foundBrand] = await db
      .select({ id: schema.brands.id })
      .from(schema.brands)
      .where(
        or(
          eq(schema.brands.slug, brand.toLowerCase()),
          ilike(schema.brands.name, brand),
        ),
      )
      .limit(1);

    if (foundBrand) {
      conditions.push(eq(schema.cars.brandId, foundBrand.id));
    } else {
      // Jika merek tidak ditemukan, return kosong
      return c.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
  }

  if (minPrice !== undefined) {
    conditions.push(gte(schema.cars.price, minPrice));
  }

  if (maxPrice !== undefined) {
    conditions.push(lte(schema.cars.price, maxPrice));
  }

  if (minYear !== undefined) {
    conditions.push(gte(schema.cars.year, minYear));
  }

  if (maxYear !== undefined) {
    conditions.push(lte(schema.cars.year, maxYear));
  }

  if (transmission) {
    conditions.push(eq(schema.cars.transmission, transmission));
  }

  if (fuelType) {
    conditions.push(eq(schema.cars.fuelType, fuelType));
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(schema.cars.title, term),
        ilike(schema.cars.model, term),
        ilike(schema.cars.description, term),
        ilike(schema.cars.color, term),
      )!,
    );
  }

  const whereClause = and(...conditions);

  // Hitung total data
  const [totalResult] = await db
    .select({ val: count() })
    .from(schema.cars)
    .where(whereClause);

  const total = Number(totalResult?.val || 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Sorting
  let orderByClause;
  switch (sort) {
    case "price_asc":
      orderByClause = asc(schema.cars.price);
      break;
    case "price_desc":
      orderByClause = desc(schema.cars.price);
      break;
    case "year_desc":
      orderByClause = desc(schema.cars.year);
      break;
    case "mileage_asc":
      orderByClause = asc(schema.cars.mileage);
      break;
    case "newest":
    default:
      orderByClause = desc(schema.cars.createdAt);
      break;
  }

  const carList = await db.query.cars.findMany({
    where: whereClause,
    orderBy: [orderByClause],
    limit,
    offset,
    with: {
      brand: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
      photos: {
        orderBy: [asc(schema.carPhotos.order)],
      },
    },
  });

  const formattedCars = carList.map((car) => {
    const primaryPhoto =
      car.photos.find((p) => p.isPrimary)?.url || car.photos[0]?.url || null;

    return {
      ...car,
      primaryPhoto,
    };
  });

  return c.json({
    success: true,
    data: formattedCars,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

// GET /api/cars/:slug - Detail mobil berdasarkan slug
carsRouter.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const car = await db.query.cars.findMany({
    where: and(
      eq(schema.cars.slug, slug),
      notInArray(schema.cars.status, ["draft", "diarsipkan"]), // Draft dan diarsipkan tidak pernah tampil
    ),
    limit: 1,
    with: {
      brand: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
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

  const selectedCar = car[0];

  // Tambah views_count secara asynchronous di background
  db.update(schema.cars)
    .set({ viewsCount: sql`${schema.cars.viewsCount} + 1` })
    .where(eq(schema.cars.id, selectedCar.id))
    .execute()
    .catch(() => {});

  const primaryPhoto =
    selectedCar.photos.find((p) => p.isPrimary)?.url ||
    selectedCar.photos[0]?.url ||
    null;

  return c.json({
    success: true,
    data: {
      ...selectedCar,
      primaryPhoto,
    },
  });
});
