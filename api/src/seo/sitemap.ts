import { eq, notInArray } from "drizzle-orm";
import { db, schema } from "db";

export interface SitemapEntry {
  loc: string;
  lastmod?: string | null;
}

export const STATIC_SITEMAP_PATHS = [
  "/",
  "/katalog",
  "/simulasi-kredit",
  "/tukar-tambah",
  "/testimoni",
  "/artikel",
  "/kontak",
] as const;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
        : "";
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRobots(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}

function isoDay(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export async function collectSitemapEntries(
  origin: string,
): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = STATIC_SITEMAP_PATHS.map((path) => ({
    loc: `${origin}${path}`,
  }));

  const [carRows, articleRows] = await Promise.all([
    db
      .select({
        slug: schema.cars.slug,
        updatedAt: schema.cars.updatedAt,
      })
      .from(schema.cars)
      .where(notInArray(schema.cars.status, ["draft", "diarsipkan"])),
    db
      .select({
        slug: schema.articles.slug,
        updatedAt: schema.articles.updatedAt,
        publishedAt: schema.articles.publishedAt,
      })
      .from(schema.articles)
      .where(eq(schema.articles.status, "terbit")),
  ]);

  for (const car of carRows) {
    entries.push({
      loc: `${origin}/katalog/${car.slug}`,
      lastmod: isoDay(car.updatedAt),
    });
  }

  for (const article of articleRows) {
    entries.push({
      loc: `${origin}/artikel/${article.slug}`,
      lastmod: isoDay(article.publishedAt ?? article.updatedAt),
    });
  }

  return entries;
}
