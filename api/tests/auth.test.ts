import { beforeAll, describe, expect, it } from "bun:test";
import { runSeed } from "db/src/seed";
import { app } from "../src/index";

describe("Admin Authentication (/api/auth & /api/admin/*)", () => {
  beforeAll(async () => {
    await runSeed();
  });

  const validAdmin = {
    email: "admin@bintangmobil.com",
    password: "Admin123!",
  };

  it("rejects access to /api/admin/* without session", async () => {
    const res = await app.request("/api/admin/dashboard");
    expect(res.status).toBe(401);

    const body = (await res.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects login with wrong password", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: validAdmin.email,
        password: "SalahPassword123",
      }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("successfully logs in with valid credentials and sets httpOnly cookie", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validAdmin),
    });

    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("admin_session=");
    expect(setCookie?.toLowerCase()).toContain("httponly");

    const body = (await res.json()) as {
      success: boolean;
      data: { user: { email: string } };
    };
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(validAdmin.email);
  });

  it("allows access to protected /api/admin/* with valid session cookie", async () => {
    // 1. Login to get cookie
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validAdmin),
    });
    const cookie = loginRes.headers.get("set-cookie") || "";

    // 2. Access /api/admin/auth/me
    const meRes = await app.request("/api/admin/auth/me", {
      headers: { Cookie: cookie },
    });
    expect(meRes.status).toBe(200);
    const meBody = (await meRes.json()) as {
      success: boolean;
      data: { user: { email: string } };
    };
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.email).toBe(validAdmin.email);

    // 3. Access /api/admin/dashboard
    const dashRes = await app.request("/api/admin/dashboard", {
      headers: { Cookie: cookie },
    });
    expect(dashRes.status).toBe(200);
  });

  it("logs out and revokes the session", async () => {
    // 1. Login
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validAdmin),
    });
    const cookie = loginRes.headers.get("set-cookie") || "";

    // 2. Logout
    const logoutRes = await app.request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(logoutRes.status).toBe(200);

    // 3. Access me again with old cookie -> 401
    const meRes = await app.request("/api/admin/auth/me", {
      headers: { Cookie: cookie },
    });
    expect(meRes.status).toBe(401);
  });

  it("enforces rate limiting after 5 consecutive failed login attempts", async () => {
    const testEmail = "ratelimit@bintangmobil.com";
    const fakeHeaders = {
      "Content-Type": "application/json",
      "X-Forwarded-For": "192.168.1.100",
    };

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const res = await app.request("/api/auth/login", {
        method: "POST",
        headers: fakeHeaders,
        body: JSON.stringify({ email: testEmail, password: "wrong" }),
      });
      expect(res.status).toBe(401);
    }

    // 6th attempt should be blocked with 429
    const blockedRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: fakeHeaders,
      body: JSON.stringify({ email: testEmail, password: "wrong" }),
    });
    expect(blockedRes.status).toBe(429);
    const body = (await blockedRes.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.error.code).toBe("TOO_MANY_REQUESTS");
  });

  it("rejects login with invalid payload (bad email format, empty password)", async () => {
    const badEmailRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bukan-email", password: "Admin123!" }),
    });
    expect(badEmailRes.status).toBe(400);

    const emptyPasswordRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@bintangmobil.com", password: "" }),
    });
    expect(emptyPasswordRes.status).toBe(400);

    const body = (await emptyPasswordRes.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
