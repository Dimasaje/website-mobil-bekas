import { extname, join, normalize } from "node:path";
import type { Context } from "hono";
import { env } from "../env";
import { injectMeta, renderMetaTags, resolvePageMeta } from "../seo/meta";

const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

let indexCache: { mtimeMs: number; html: string } | null = null;

export function siteOrigin(): string {
  return env.SITE_URL.replace(/\/+$/, "");
}

export async function loadIndexHtml(): Promise<string | null> {
  const file = Bun.file(join(env.WEB_DIST_DIR, "index.html"));
  if (!(await file.exists())) return null;

  if (!indexCache || indexCache.mtimeMs !== file.lastModified) {
    indexCache = { mtimeMs: file.lastModified, html: await file.text() };
  }
  return indexCache.html;
}

// Sajikan aset build (hash di nama file) dengan cache immutable.
export async function serveDistFile(c: Context) {
  const base = normalize(env.WEB_DIST_DIR);
  const full = normalize(join(base, c.req.path));

  if (!full.startsWith(base)) return null;

  const file = Bun.file(full);
  if (!(await file.exists())) return null;

  const ext = extname(full).toLowerCase();
  c.header(
    "Content-Type",
    CONTENT_TYPES[ext] ?? file.type ?? "application/octet-stream",
  );
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  return c.body(file.stream());
}

// Sajikan SPA dengan meta tag khusus halaman disisipkan ke HTML awal.
export async function serveSpa(c: Context) {
  const html = await loadIndexHtml();
  if (!html) return null;

  const origin = siteOrigin();
  const meta = await resolvePageMeta(c.req.path, origin);

  c.status(meta.notFound ? 404 : 200);
  c.header("Content-Type", "text/html; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  return c.body(injectMeta(html, renderMetaTags(meta, origin)));
}
