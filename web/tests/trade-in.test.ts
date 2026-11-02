import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { TradeInPage } from "../src/pages/TradeInPage";

describe("TradeInPage Component (T-24)", () => {
  it("exports TradeInPage component as a function", () => {
    expect(typeof TradeInPage).toBe("function");
  });

  it("renders form elements and mode switchers", () => {
    const html = renderToString(
      React.createElement(MemoryRouter, null, React.createElement(TradeInPage)),
    );

    // Breadcrumb & Headings
    expect(html).toContain("Formulir Tukar Tambah &amp; Test Drive");
    expect(html).toContain("Tukar Tambah Mobil Lama dengan Harga Fair");

    // Mode Switcher Tabs
    expect(html).toContain("Tukar Tambah Mobil");
    expect(html).toContain("Jual Mobil Anda");
    expect(html).toContain("Janji Test Drive");

    // Form inputs (Trade in defaults)
    expect(html).toContain("Merek Mobil *");
    expect(html).toContain("Model &amp; Varian *");
    expect(html).toContain("Tahun Pembuatan *");
    expect(html).toContain("Transmisi");
    expect(html).toContain("Pilih Mobil dari Katalog");
    expect(html).toContain("Nama Lengkap *");
    expect(html).toContain("Nomor WhatsApp Aktif *");

    // Honeypot field exists
    expect(html).toContain('name="website"');

    // Submit button
    expect(html).toContain("Kirim Permintaan Taksiran Sekarang");
  });

  it("renders with test drive mode query param", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/tukar-tambah?mode=test_drive&target=Honda+Brio"] },
        React.createElement(TradeInPage),
      ),
    );

    expect(html).toContain("Jadwalkan Test Drive Mobil Pilihan Anda");
    expect(html).toContain("Tanggal Rencana Uji Jalan *");
    expect(html).toContain("Honda Brio");
    expect(html).toContain("Jadwalkan Test Drive Sekarang");
  });

  it("renders with sell mode query param", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/tukar-tambah?mode=jual"] },
        React.createElement(TradeInPage),
      ),
    );

    expect(html).toContain("Jual Mobil Anda dengan Cepat &amp; Aman");
  });
});
