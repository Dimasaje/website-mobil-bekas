import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "../src/pages/HomePage";

describe("HomePage Component (T-20)", () => {
  it("exports HomePage component as a function", () => {
    expect(typeof HomePage).toBe("function");
  });

  it("renders structure with expected elements and sections within router", () => {
    const html = renderToString(
      React.createElement(MemoryRouter, null, React.createElement(HomePage)),
    );

    expect(html).toContain("Garansi Bebas Banjir");
    expect(html).toContain("Temukan Mobil Pilihan Anda");
    expect(html).toContain("Mengapa Beli di");
    expect(html).toContain("Pilihan Unit Unggulan");
    expect(html).toContain("Jelajahi Stok Mobil");
  });
});
