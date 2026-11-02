import { db, schema } from "db";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";

export const authRouter = new Hono();

// In-memory failed attempts counter for basic rate limiting
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getAttemptKey(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// POST /api/auth/login
authRouter.post("/login", async (c) => {
  const ip =
    c.req.header("x-forwarded-for") ||
    c.req.header("cf-connecting-ip") ||
    "127.0.0.1";
  const body = await c.req.json().catch(() => ({}));
  const parseResult = loginSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data login tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const { email, password } = parseResult.data;
  const key = getAttemptKey(email, ip);
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (attempt && attempt.lockedUntil > now) {
    const remainingSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
    return c.json(
      {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: `Terlalu banyak percobaan gagal. Silakan coba lagi dalam ${remainingSeconds} detik.`,
        },
      },
      429,
    );
  }

  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    recordFailedAttempt(key);
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email atau password salah",
        },
      },
      401,
    );
  }

  const isPasswordValid = await Bun.password.verify(
    password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    recordFailedAttempt(key);
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email atau password salah",
        },
      },
      401,
    );
  }

  // Clear attempts on success
  loginAttempts.delete(key);

  // Create session (7 days)
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(schema.sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  const isProd = process.env.NODE_ENV === "production";
  setCookie(c, "admin_session", sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const current = loginAttempts.get(key);
  const isExpired =
    current && current.lockedUntil > 0 && current.lockedUntil <= now;
  const count = (isExpired ? 0 : current?.count || 0) + 1;

  if (count >= 5) {
    // Lock for 15 minutes
    loginAttempts.set(key, { count, lockedUntil: now + 15 * 60 * 1000 });
  } else {
    loginAttempts.set(key, { count, lockedUntil: 0 });
  }
}

// POST /api/auth/logout
authRouter.post("/logout", async (c) => {
  const sessionId =
    getCookie(c, "admin_session") ||
    c.req.header("Authorization")?.replace("Bearer ", "");

  if (sessionId) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
  }

  deleteCookie(c, "admin_session", { path: "/" });

  return c.json({
    success: true,
    message: "Berhasil logout",
  });
});

// GET /api/auth/me (atau melalui /api/admin/auth/me)
authRouter.get("/me", requireAdminAuth, (c) => {
  const admin = c.get("admin");
  return c.json({
    success: true,
    data: {
      user: admin,
    },
  });
});
