import { describe, expect, it } from "bun:test";
import { app } from "../src/index";
import {
  escapeHtml,
  injectMeta,
  normalizePathname,
  renderMetaTags,
  resolvePageMeta,
  type PageMeta,
} from "../src/seo/meta";
import {
  escapeXml,
  renderRobots,
  renderSitemap,
  STATIC_SITEMAP_PATHS,
} from "../src/seo/sitemap";

const ORIGIN = "https://bintangmobil.example";

function meta(overrides: Partial<PageMeta> = {}): PageMeta {
  return {
    title: 'Toyota Innova "Zenix" & Family',
    description: "Unit <siap> pakai, harga Rp 380.000.000.",
    canonicalPath: "/katalog/toyota-innova-zenix",
    siteName: "Bintang Mobil",
    ogType: "product",
    ogImage: "https://cdn.example/foto.jpg",
    noindex: false,
    notFound: false,
    jsonLd: null,
    ...overrides,
  };
}

describe("SEO dasar (T-34)", () => {
  it("normalizes pathnames for canonical URLs", () => {
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("/katalog/")).toBe("/katalog");
    expect(normalizePathname("/katalog?page=2")).toBe("/katalog");
    expect(normalizePathname("//katalog//x//")).toBe("/katalog/x");
    expect(normalizePathname("")).toBe("/");
  });

  it("renders title, description, canonical and Open Graph tags", () => {
    const tags = renderMetaTags(meta(), ORIGIN);

    expect(tags).toContain(
      "<title>Toyota Innova &quot;Zenix&quot; &amp; Family</title>",
    );
    expect(tags).toContain(
      '<meta name="description" content="Unit &lt;siap&gt; pakai',
    );
    expect(tags).toContain(
      '<link rel="canonical" href="https://bintangmobil.example/katalog/toyota-innova-zenix" />',
    );
    expect(tags).toContain('<meta property="og:type" content="product" />');
    expect(tags).toContain(
      '<meta property="og:site_name" content="Bintang Mobil" />',
    );
    expect(tags).toContain(
      '<meta property="og:image" content="https://cdn.example/foto.jpg" />',
    );
    expect(tags).toContain(
      '<meta name="twitter:card" content="summary_large_image" />',
    );
    expect(tags).not.toContain("noindex");
  });

  it("adds robots noindex and skips og:image when absent", () => {
    const tags = renderMetaTags(meta({ noindex: true, ogImage: null }), ORIGIN);

    expect(tags).toContain(
      '<meta name="robots" content="noindex, nofollow" />',
    );
    expect(tags).toContain('<meta name="twitter:card" content="summary" />');
    expect(tags).not.toContain("og:image");
  });

  it("serializes JSON-LD without breaking out of the script tag", () => {
    const tags = renderMetaTags(
      meta({
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Vehicle",
          name: "</script><script>alert(1)</script>",
        },
      }),
      ORIGIN,
    );

    expect(tags).toContain('<script type="application/ld+json">');
    expect(tags).not.toContain("</script><script>alert(1)");
    expect(tags).toContain("\\u003c/script");
  });

  it("injects meta at the marker and drops the template title", () => {
    const html =
      "<html><head><title>Lama</title><!--seo--></head><body>x</body></html>";
    const out = injectMeta(html, "<title>Baru</title>");

    expect(out).toContain("<title>Baru</title>");
    expect(out).not.toContain("Lama");
    expect(out.indexOf("Baru")).toBeLessThan(out.indexOf("</head>"));
  });

  it("falls back to inserting before </head> when no marker exists", () => {
    const out = injectMeta("<html><head></head></html>", "<title>Baru</title>");

    expect(out).toContain("<title>Baru</title>");
    expect(out.indexOf("Baru")).toBeLessThan(out.indexOf("</head>"));
  });

  it("escapes HTML and XML entities", () => {
    expect(escapeHtml('<a href="x">a & b</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;a &amp; b&lt;/a&gt;",
    );
    expect(escapeXml("a & b <c>")).toBe("a &amp; b &lt;c&gt;");
  });

  it("renders a sitemap with loc and lastmod", () => {
    const xml = renderSitemap([
      { loc: `${ORIGIN}/` },
      { loc: `${ORIGIN}/katalog?x=1&y=2`, lastmod: "2026-11-02" },
    ]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(xml).toContain(`<loc>${ORIGIN}/</loc>`);
    expect(xml).toContain(
      "<loc>https://bintangmobil.example/katalog?x=1&amp;y=2</loc>",
    );
    expect(xml).toContain("<lastmod>2026-11-02</lastmod>");
  });

  it("lists every public page in the static sitemap paths", () => {
    expect([...STATIC_SITEMAP_PATHS]).toEqual([
      "/",
      "/katalog",
      "/simulasi-kredit",
      "/tukar-tambah",
      "/testimoni",
      "/artikel",
      "/kontak",
    ]);
  });

  it("renders robots.txt that blocks admin and API", () => {
    const robots = renderRobots(ORIGIN);

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it("serves robots.txt from the app", async () => {
    const res = await app.request("/robots.txt");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("Disallow: /admin");
  });

  it("never serves HTML for unknown API routes", async () => {
    const res = await app.request("/api/tidak-ada");
    const body = await res.text();

    expect(res.status).toBe(404);
    expect(body).toContain("NOT_FOUND");
  });

  it("resolves unknown pages as not found with noindex", async () => {
    const meta = await resolvePageMeta("/halaman-asing", ORIGIN);

    expect(meta.notFound).toBe(true);
    expect(meta.noindex).toBe(true);
    expect(meta.title).toContain("Halaman Tidak Ditemukan");
  });

  it("marks admin pages noindex but not as not found", async () => {
    const meta = await resolvePageMeta("/admin/mobil", ORIGIN);

    expect(meta.noindex).toBe(true);
    expect(meta.notFound).toBe(false);
  });

  it("uses catalog copy with canonical path for public pages", async () => {
    const meta = await resolvePageMeta("/katalog/", ORIGIN);

    expect(meta.canonicalPath).toBe("/katalog");
    expect(meta.title).toContain("Katalog Mobil Bekas");
    expect(meta.ogType).toBe("website");
    expect(meta.notFound).toBe(false);
  });
});
