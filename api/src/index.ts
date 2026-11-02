import { join } from "node:path";
import { db } from "db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import { requireAdminAuth } from "./middlewares/auth";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";
import { authRouter } from "./routes/auth";
import { carsRouter } from "./routes/cars";
import { healthRouter } from "./routes/health";
import { adminCarsRouter } from "./routes/admin-cars";
import {
  adminArticlesRouter,
  adminPromosRouter,
  adminSettingsRouter,
  adminTestimonialsRouter,
} from "./routes/admin-content";
import {
  publicArticlesRouter,
  publicPromosRouter,
  publicSettingsRouter,
  publicTestimonialsRouter,
} from "./routes/content";
import { adminLeadsRouter, leadsRouter } from "./routes/leads";
import { defaultStorage } from "./services/storage";

export const app = new Hono();

// Security middlewares
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// Public API Router
const api = new Hono();
api.route("/health", healthRouter);
api.route("/auth", authRouter);
api.route("/cars", carsRouter);
api.route("/leads", leadsRouter);
api.route("/promos", publicPromosRouter);
api.route("/testimonials", publicTestimonialsRouter);
api.route("/articles", publicArticlesRouter);
api.route("/settings", publicSettingsRouter);

api.get("/db-check", async (c) => {
  try {
    const result = await db.execute(sql`SELECT 1 as connected`);
    return c.json({
      status: "ok",
      database: "connected",
      connected: result.length > 0,
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        database: "disconnected",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Admin Protected API Router: /api/admin/*
const adminApi = new Hono();
adminApi.use("*", requireAdminAuth);
adminApi.route("/auth", authRouter);
adminApi.route("/cars", adminCarsRouter);
adminApi.route("/leads", adminLeadsRouter);
adminApi.route("/promos", adminPromosRouter);
adminApi.route("/testimonials", adminTestimonialsRouter);
adminApi.route("/articles", adminArticlesRouter);
adminApi.route("/settings", adminSettingsRouter);
adminApi.get("/dashboard", (c) => {
  const admin = c.get("admin");
  return c.json({
    success: true,
    data: {
      message: "Selamat datang di dashboard admin",
      user: admin,
    },
  });
});

api.route("/admin", adminApi);
app.route("/api", api);

// Static uploads serving with cache headers
app.get("/uploads/*", async (c) => {
  const relPath = c.req.path.replace(/^\/uploads\//, "");
  const fullPath = join(defaultStorage.getBaseDir(), relPath);
  const file = Bun.file(fullPath);
  if (!(await file.exists())) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Berkas tidak ditemukan",
        },
      },
      404,
    );
  }
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  c.header("Content-Type", file.type || "image/webp");
  return c.body(file.stream());
});

// Error and 404 Handlers
app.notFound(notFoundHandler);
app.onError(errorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
