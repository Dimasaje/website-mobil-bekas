import { db } from "db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";
import { healthRouter } from "./routes/health";

export const app = new Hono();

// Security middlewares
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Routes
const api = new Hono();
api.route("/health", healthRouter);
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

app.route("/api", api);

// Error and 404 Handlers
app.notFound(notFoundHandler);
app.onError(errorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
