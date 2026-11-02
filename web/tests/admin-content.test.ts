import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  AdminContentPage,
  CONTENT_TABS,
  resolveTab,
} from "../src/pages/admin/AdminContentPage";
import { ArticlesTab } from "../src/pages/admin/content/ArticlesTab";
import { PromosTab } from "../src/pages/admin/content/PromosTab";
import { SettingsTab } from "../src/pages/admin/content/SettingsTab";
import { TestimonialsTab } from "../src/pages/admin/content/TestimonialsTab";

function render(path: string) {
  return renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(AdminContentPage),
    ),
  );
}

describe("Admin konten & pengaturan (T-30)", () => {
  it("resolves tab from query with a safe default", () => {
    expect(resolveTab("promo")).toBe("promo");
    expect(resolveTab("artikel")).toBe("artikel");
    expect(resolveTab("testimoni")).toBe("testimoni");
    expect(resolveTab(null)).toBe("pengaturan");
    expect(resolveTab("tidak-ada")).toBe("pengaturan");
  });

  it("renders every tab button", () => {
    const html = render("/admin/konten").replaceAll("&amp;", "&");

    for (const tab of CONTENT_TABS) {
      expect(html).toContain(tab.label);
    }
    expect(html).toContain("Pengaturan Showroom & Konten");
  });

  it("renders the settings tab by default", () => {
    const html = render("/admin/konten");

    expect(html).toContain("Memuat pengaturan...");
  });

  it("renders the promo tab when requested", () => {
    const html = render("/admin/konten?tab=promo");

    expect(html).toContain("Memuat promo...");
    expect(html).toContain("Tambah Promo");
  });

  it("renders the testimonial tab when requested", () => {
    const html = render("/admin/konten?tab=testimoni");

    expect(html).toContain("Memuat testimoni...");
    expect(html).toContain("Tambah Testimoni");
  });

  it("renders the article tab when requested", () => {
    const html = render("/admin/konten?tab=artikel");

    expect(html).toContain("Memuat artikel...");
    expect(html).toContain("Tulis Artikel");
  });

  it("renders settings form fields once loaded", () => {
    const html = renderToString(React.createElement(SettingsTab));

    expect(html).toContain("Memuat pengaturan...");
  });

  it("renders testimonial form with rating and photo fields", () => {
    const html = renderToString(React.createElement(TestimonialsTab));

    expect(html).toContain('id="testi-rating"');
    expect(html).toContain('id="testi-photo"');
    expect(html).toContain('id="testi-quote"');
  });

  it("renders promo form with date and active toggle", () => {
    const html = renderToString(React.createElement(PromosTab));

    expect(html).toContain('id="promo-start"');
    expect(html).toContain('id="promo-end"');
    expect(html).toContain("Tampilkan promo di website");
  });

  it("renders article editor with status select", () => {
    const html = renderToString(React.createElement(ArticlesTab));

    expect(html).toContain('id="article-content"');
    expect(html).toContain('id="article-status"');
    expect(html).toContain("Draft");
    expect(html).toContain("Terbit");
  });
});
