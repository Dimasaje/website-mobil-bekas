import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ArticleDetailPage } from "../src/pages/ArticleDetailPage";
import { ArticlesPage } from "../src/pages/ArticlesPage";
import { ContactPage } from "../src/pages/ContactPage";
import { TestimonialsPage } from "../src/pages/TestimonialsPage";

describe("Content Pages (T-25)", () => {
  describe("TestimonialsPage", () => {
    it("renders TestimonialsPage structure and headers", () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(TestimonialsPage),
        ),
      );

      expect(html).toContain("Galeri Serah Terima &amp; Testimoni");
      expect(html).toContain("Bukti Nyata Kepuasan Pelanggan Kami");
      expect(html).toContain("Jelajahi Katalog Mobil");
      expect(html).toContain("Konsultasi via WhatsApp");
    });
  });

  describe("ArticlesPage & ArticleDetailPage", () => {
    it("renders ArticlesPage structure and headers", () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ArticlesPage),
        ),
      );

      expect(html).toContain("Artikel &amp; Tips Otomotif");
      expect(html).toContain("Artikel &amp; Tips Seputar Mobil Bekas");
    });

    it("renders ArticleDetailPage loading or not found state", () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/artikel/tips-cek-mobil-bekas"] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: "/artikel/:slug",
              element: React.createElement(ArticleDetailPage),
            }),
          ),
        ),
      );

      expect(html).toContain("Memuat isi artikel...");
    });
  });

  describe("ContactPage", () => {
    it("renders ContactPage with showroom info, map link, and quick contact form", () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ContactPage),
        ),
      );

      expect(html).toContain("Kontak &amp; Lokasi Showroom");
      expect(html).toContain("Hubungi Kami &amp; Lokasi Showroom");
      expect(html).toContain("Alamat Lengkap");
      expect(html).toContain("Jam Operasional");
      expect(html).toContain("Telepon Kantor");
      expect(html).toContain("Konsultasi WhatsApp");
      expect(html).toContain("Buka Petunjuk Arah di Google Maps");

      // Form Elements
      expect(html).toContain("Tinggalkan Pesan");
      expect(html).toContain("Nama Lengkap *");
      expect(html).toContain("Nomor WhatsApp Aktif *");
      expect(html).toContain("Pesan / Mobil yang Ditanyakan *");
      expect(html).toContain("Kirim Pesan");
      expect(html).toContain("Langsung Chat via WhatsApp Sales");
      expect(html).toContain('name="website"'); // Honeypot
    });
  });
});
