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
import { adminLeadsRouter, leadsRouter } from "./routes/leads";

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
adminApi.route("/leads", adminLeadsRouter);
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

// Error and 404 Handlers
app.notFound(notFoundHandler);
app.onError(errorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
