import { Hono } from "hono";
import { db } from "db";
import { sql } from "drizzle-orm";

export const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/db-check", async (c) => {
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

const port = Number(process.env.PORT) || 3001;

export default {
  port,
  fetch: app.fetch,
};
