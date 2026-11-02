import { db, schema } from "db";
import { and, eq, gt } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";

declare module "hono" {
  interface ContextVariableMap {
    admin: {
      id: string;
      name: string;
      email: string;
    };
  }
}

export const requireAdminAuth: MiddlewareHandler = async (c, next) => {
  const cookieToken = getCookie(c, "admin_session");
  const authHeader = c.req.header("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const sessionId = cookieToken || bearerToken;

  if (!sessionId) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Sesi tidak ditemukan atau belum login",
        },
      },
      401,
    );
  }

  const [session] = await db
    .select({
      sessionId: schema.sessions.id,
      expiresAt: schema.sessions.expiresAt,
      userId: schema.adminUsers.id,
      userName: schema.adminUsers.name,
      userEmail: schema.adminUsers.email,
    })
    .from(schema.sessions)
    .innerJoin(
      schema.adminUsers,
      eq(schema.sessions.userId, schema.adminUsers.id),
    )
    .where(
      and(
        eq(schema.sessions.id, sessionId),
        gt(schema.sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Sesi tidak valid atau telah kedaluwarsa",
        },
      },
      401,
    );
  }

  c.set("admin", {
    id: session.userId,
    name: session.userName,
    email: session.userEmail,
  });

  await next();
};
