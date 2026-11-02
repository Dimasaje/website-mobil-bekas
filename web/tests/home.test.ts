import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { buildQuickSearchQuery, HomePage } from "../src/pages/HomePage";

describe("HomePage Component (T-20 & Bug #43)", () => {
  it("exports HomePage component as a function", () => {
    expect(typeof HomePage).toBe("function");
  });

  it("buildQuickSearchQuery formats query params matching API contract", () => {
    const query = buildQuickSearchQuery({
      brand: "toyota",
      priceRange: "150-250",
      yearRange: "gte2022",
    });

    const params = new URLSearchParams(query);
    expect(params.get("brand")).toBe("toyota");
    expect(params.get("brandId")).toBeNull();
    expect(params.get("bodyType")).toBeNull();
    expect(params.get("minPrice")).toBe("150000000");
    expect(params.get("maxPrice")).toBe("250000000");
    expect(params.get("minYear")).toBe("2022");
    expect(params.get("maxYear")).toBeNull();
  });

  it("buildQuickSearchQuery handles various price and year ranges", () => {
    const query1 = buildQuickSearchQuery({
      priceRange: "under150",
      yearRange: "under2016",
    });
    const params1 = new URLSearchParams(query1);
    expect(params1.get("maxPrice")).toBe("150000000");
    expect(params1.get("minPrice")).toBeNull();
    expect(params1.get("maxYear")).toBe("2015");
    expect(params1.get("minYear")).toBeNull();

    const query2 = buildQuickSearchQuery({
      priceRange: "above400",
      yearRange: "2019-2021",
    });
    const params2 = new URLSearchParams(query2);
    expect(params2.get("minPrice")).toBe("400000000");
    expect(params2.get("maxPrice")).toBeNull();
    expect(params2.get("minYear")).toBe("2019");
    expect(params2.get("maxYear")).toBe("2021");
  });

  it("renders structure with expected elements and sections within router", () => {
    const html = renderToString(
      React.createElement(MemoryRouter, null, React.createElement(HomePage)),
    );

    expect(html).toContain("Garansi Bebas Banjir");
    expect(html).toContain("Temukan Mobil Pilihan Anda");
    expect(html).toContain("Tahun Pembuatan");
    expect(html).toContain("Mengapa Beli di");
    expect(html).toContain("Pilihan Unit Unggulan");
    expect(html).toContain("Jelajahi Stok Mobil");
  });
});
