import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  AdminLeadsPage,
  flattenLeadData,
  formatLeadDate,
  toWaNumber,
} from "../src/pages/admin/AdminLeadsPage";

describe("Admin kelola lead (T-31)", () => {
  it("normalizes Indonesian phone numbers to WhatsApp format", () => {
    expect(toWaNumber("081234567890")).toBe("6281234567890");
    expect(toWaNumber("+62 812-3456-7890")).toBe("6281234567890");
    expect(toWaNumber("6281234567890")).toBe("6281234567890");
  });

  it("flattens nested trade-in lead data into labelled rows", () => {
    const rows = flattenLeadData({
      subType: "tukar_tambah",
      oldCar: {
        brand: "Honda",
        model: "Brio",
        year: 2018,
        mileage: null,
      },
      preferredDate: "2026-11-10",
    });

    expect(rows).toEqual([
      { label: "Jenis pengajuan", value: "tukar_tambah" },
      { label: "Mobil lama — Merek", value: "Honda" },
      { label: "Mobil lama — Model", value: "Brio" },
      { label: "Mobil lama — Tahun", value: "2018" },
      { label: "Tanggal test drive", value: "2026-11-10" },
    ]);
  });

  it("returns no rows for empty lead data", () => {
    expect(flattenLeadData(null)).toEqual([]);
    expect(flattenLeadData({})).toEqual([]);
    expect(flattenLeadData({ notes: "", empty: null })).toEqual([]);
  });

  it("formats lead timestamps for Indonesian readers", () => {
    const formatted = formatLeadDate("2026-11-02T04:20:00.000Z");
    expect(formatted).toContain("2026");
    expect(formatted).not.toBe("2026-11-02T04:20:00.000Z");
  });

  it("keeps unparsable dates untouched", () => {
    expect(formatLeadDate("bukan-tanggal")).toBe("bukan-tanggal");
  });

  it("renders the lead list shell with filters and empty detail hint", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/admin/leads"] },
        React.createElement(AdminLeadsPage),
      ),
    );

    expect(html).toContain("Daftar Lead Masuk");
    expect(html).toContain("Semua Tipe Minat");
    expect(html).toContain("Semua Status");
    expect(html).toContain("Memuat daftar lead...");
    expect(html).toContain("Pilih salah satu lead di tabel");
  });
});
