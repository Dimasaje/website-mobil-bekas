import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../src/components/admin/AdminLayout";
import { AdminLoginPage } from "../src/pages/admin/AdminLoginPage";
import { AdminSectionPlaceholder } from "../src/pages/admin/AdminSectionPlaceholder";

describe("Admin shell (T-28)", () => {
  it("renders login form with required fields", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/admin/login"] },
        React.createElement(AdminLoginPage),
      ),
    );

    expect(html).toContain("Portal Pengelolaan Admin");
    expect(html).toContain("Email Administrator");
    expect(html).toContain("Kata Sandi (Password)");
    expect(html).toContain("Masuk ke Dashboard");
    expect(html).toContain('id="admin-email"');
    expect(html).toContain('id="admin-password"');
    expect(html).toContain("Kembali ke website publik");
    // Tidak ada notifikasi sesi berakhir pada login normal
    expect(html).not.toContain("Sesi Anda telah berakhir");
  });

  it("shows expired-session notice when redirected with expired=1", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/admin/login?expired=1&redirect=%2Fadmin"] },
        React.createElement(AdminLoginPage),
      ),
    );

    expect(html).toContain("Sesi Anda telah berakhir");
  });

  it("renders session check state while verifying admin session", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/admin"] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: "/admin",
            element: React.createElement(AdminLayout),
          }),
        ),
      ),
    );

    expect(html).toContain("Memeriksa sesi admin...");
  });

  it("renders section placeholder for upcoming admin modules", () => {
    const html = renderToString(
      React.createElement(AdminSectionPlaceholder, {
        title: "Kelola Stok Mobil",
        description: "Daftar unit dan status stok.",
      }),
    );

    expect(html).toContain("Kelola Stok Mobil");
    expect(html).toContain("Modul ini sedang disiapkan");
  });
});
