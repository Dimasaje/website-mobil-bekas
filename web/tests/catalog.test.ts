import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CatalogPage, getVisiblePagination } from "../src/pages/CatalogPage";

describe("CatalogPage Component (T-21)", () => {
  it("exports CatalogPage component as a function", () => {
    expect(typeof CatalogPage).toBe("function");
  });

  it("calculates windowed pagination properly without mobile horizontal overflow", () => {
    // Total pages <= 5 returns all
    expect(getVisiblePagination(1, 3)).toEqual([1, 2, 3]);
    expect(getVisiblePagination(3, 5)).toEqual([1, 2, 3, 4, 5]);

    // Total 9 pages, current near start
    expect(getVisiblePagination(1, 9)).toEqual([1, 2, 3, 4, "ellipsis", 9]);
    expect(getVisiblePagination(2, 9)).toEqual([1, 2, 3, 4, "ellipsis", 9]);

    // Current near end
    expect(getVisiblePagination(8, 9)).toEqual([1, "ellipsis", 6, 7, 8, 9]);

    // Current in middle
    expect(getVisiblePagination(5, 9)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      9,
    ]);
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
