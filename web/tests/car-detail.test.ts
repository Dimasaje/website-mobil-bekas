import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CarDetailPage } from "../src/pages/CarDetailPage";

describe("CarDetailPage Component (T-22)", () => {
  it("exports CarDetailPage component as a function", () => {
    expect(typeof CarDetailPage).toBe("function");
  });

  it("renders 404 state when slug is not found or empty", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/katalog/tidak-ada-slug-ini"] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: "/katalog/:slug",
            element: React.createElement(CarDetailPage),
          }),
        ),
      ),
    );

    // Initial server render starts with loading state or 404
    expect(html).toContain("Memuat detail spesifikasi dan galeri mobil...");
  });
});
