import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CatalogPage } from "../src/pages/CatalogPage";

describe("CatalogPage Component (T-21)", () => {
  it("exports CatalogPage component as a function", () => {
    expect(typeof CatalogPage).toBe("function");
  });

  it("renders structure with expected elements and sections within router", () => {
    const html = renderToString(
      React.createElement(MemoryRouter, null, React.createElement(CatalogPage)),
    );

    // Breadcrumb & Headers
    expect(html).toContain("Beranda");
    expect(html).toContain("Katalog Mobil Bekas Pilihan");
    expect(html).toContain("Filter Stok");

    // Toolbar controls
    expect(html).toContain("Cari model, nama mobil...");
    expect(html).toContain("Urutkan:");
    expect(html).toContain("Terbaru Masuk");
    expect(html).toContain("Harga: Termurah");

    // Filter controls
    expect(html).toContain("Merek Mobil");
    expect(html).toContain("Rentang Harga");
    expect(html).toContain("Tahun Pembuatan");
    expect(html).toContain("Transmisi");
    expect(html).toContain("Bahan Bakar");
    expect(html).toContain("Hanya Unit Tersedia");

    // Loading skeleton placeholder
    expect(html).toContain("animate-pulse");
  });

  it("renders with search params in URL without breaking", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            "/katalog?brand=toyota&minPrice=150000000&maxPrice=250000000&minYear=2020",
          ],
        },
        React.createElement(CatalogPage),
      ),
    );

    expect(html).toContain("Katalog Mobil Bekas Pilihan");
    expect(html).toContain("Reset Semua");
    expect(html).toContain("(4)");
  });
});
