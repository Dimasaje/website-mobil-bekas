import { db } from "db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";

export const healthRouter = new Hono();

healthRouter.get("/", async (c) => {
  let dbStatus = "ok";
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = "disconnected";
  }

  return c.json({
    success: true,
    data: {
      status: "ok",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  });
});
