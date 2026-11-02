import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// 0. Health check
export const healthCheck = pgTable("health_check", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("ok"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

// 1. Brands
export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("brands_slug_idx").on(table.slug)],
);

// 2. Cars
export const cars = pgTable(
  "cars",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    price: bigint("price", { mode: "number" }).notNull(),
    transmission: text("transmission").notNull(), // 'manual' | 'matic'
    mileage: integer("mileage").notNull(),
    fuelType: text("fuel_type").notNull().default("bensin"), // 'bensin' | 'diesel' | 'hybrid' | 'listrik'
    engineCapacity: integer("engine_capacity"),
    color: text("color"),
    licensePlate: text("license_plate"),
    stnkValidUntil: timestamp("stnk_valid_until"),
    description: text("description"),
    features: jsonb("features").$type<string[]>().default([]),
    status: text("status").notNull().default("tersedia"), // 'draft' | 'tersedia' | 'booking' | 'terjual'
    isFeatured: boolean("is_featured").notNull().default(false),
    viewsCount: integer("views_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cars_slug_idx").on(table.slug),
    index("cars_brand_id_idx").on(table.brandId),
    index("cars_status_idx").on(table.status),
    index("cars_is_featured_idx").on(table.isFeatured),
    index("cars_price_idx").on(table.price),
    index("cars_year_idx").on(table.year),
  ],
);

// 3. Car Photos
export const carPhotos = pgTable(
  "car_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    carId: uuid("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    order: integer("order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("car_photos_car_id_idx").on(table.carId),
    index("car_photos_order_idx").on(table.order),
  ],
);

// 4. Promos
export const promos = pgTable(
  "promos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    bannerUrl: text("banner_url"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("promos_slug_idx").on(table.slug),
    index("promos_is_active_idx").on(table.isActive),
  ],
);

// 5. Testimonials
export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerName: text("customer_name").notNull(),
    location: text("location"),
    carName: text("car_name"),
    photoUrl: text("photo_url"),
    quote: text("quote").notNull(),
    rating: integer("rating").notNull().default(5),
    isDisplayed: boolean("is_displayed").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("testimonials_is_displayed_idx").on(table.isDisplayed)],
);

// 6. Articles
export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    coverImageUrl: text("cover_image_url"),
    status: text("status").notNull().default("draft"), // 'draft' | 'terbit'
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("articles_slug_idx").on(table.slug),
    index("articles_status_idx").on(table.status),
  ],
);

// 7. Leads
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    carId: uuid("car_id").references(() => cars.id, { onDelete: "set null" }),
    type: text("type").notNull(), // 'tukar_tambah' | 'test_drive' | 'kontak' | 'simulasi'
    status: text("status").notNull().default("baru"), // 'baru' | 'dihubungi' | 'selesai'
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes"),
    data: jsonb("data").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("leads_type_idx").on(table.type),
    index("leads_status_idx").on(table.status),
    index("leads_created_at_idx").on(table.createdAt),
  ],
);

// 8. Site Settings
export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("default"),
  showroomName: text("showroom_name").notNull().default("Bintang Mobil"),
  whatsappNumber: text("whatsapp_number").notNull().default("6281298765432"),
  phoneNumber: text("phone_number"),
  address: text("address")
    .notNull()
    .default("Jl. Raya Otista No. 123, Jakarta Timur"),
  mapsUrl: text("maps_url"),
  openingHours: text("opening_hours").default("Senin - Minggu: 08:30 - 18:00"),
  heroTitle: text("hero_title").default("Temukan Mobil Bekas Impian Anda"),
  heroSubtitle: text("hero_subtitle").default(
    "Pilihan terlengkap, kondisi prima terjamin, bebas banjir dan tabrak.",
  ),
  defaultInterestRate: numeric("default_interest_rate", {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default("8.50"),
  minDownPaymentPercent: numeric("min_down_payment_percent", {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default("20.00"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Admin Users
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("admin_users_email_idx").on(table.email)],
);

// 10. Sessions
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

// Relations
export const brandsRelations = relations(brands, ({ many }) => ({
  cars: many(cars),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  brand: one(brands, {
    fields: [cars.brandId],
    references: [brands.id],
  }),
  photos: many(carPhotos),
  leads: many(leads),
}));

export const carPhotosRelations = relations(carPhotos, ({ one }) => ({
  car: one(cars, {
    fields: [carPhotos.carId],
    references: [cars.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  car: one(cars, {
    fields: [leads.carId],
    references: [cars.id],
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(adminUsers, {
    fields: [sessions.userId],
    references: [adminUsers.id],
  }),
}));
