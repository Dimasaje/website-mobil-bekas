import { and, eq, notInArray } from "drizzle-orm";
import { db, schema } from "db";
import { env } from "../env";

export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  siteName: string;
  ogType: "website" | "article" | "product";
  ogImage: string | null;
  noindex: boolean;
  notFound: boolean;
  jsonLd: Record<string, unknown> | null;
}

type Settings = typeof schema.siteSettings.$inferSelect;

const FALLBACK_SITE_NAME = "Bintang Mobil";

function truncate(value: string, max = 160): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function normalizePathname(raw: string): string {
  const path = raw.split("?")[0].split("#")[0] || "/";
  const trimmed = path.replace(/\/{2,}/g, "/");
  return trimmed.length > 1 ? trimmed.replace(/\/$/, "") : "/";
}

function absolute(path: string, origin: string): string {
  return path.startsWith("http") ? path : `${origin}${path}`;
}

function rupiah(value: number): string {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function availability(status: string): string {
  if (status === "booking") return "https://schema.org/PreOrder";
  if (status === "terjual") return "https://schema.org/SoldOut";
  return "https://schema.org/InStock";
}

async function getSettings(): Promise<Settings | null> {
  try {
    const [settings] = await db.select().from(schema.siteSettings).limit(1);
    return settings ?? null;
  } catch {
    // Halaman tetap tampil walau DB sedang bermasalah.
    return null;
  }
}

function staticCopy(
  path: string,
  siteName: string,
): { title: string; description: string } | null {
  switch (path) {
    case "/katalog":
      return {
        title: `Katalog Mobil Bekas | ${siteName}`,
        description: `Jelajahi stok mobil bekas siap pakai di ${siteName}. Filter berdasarkan merek, harga, tahun, dan transmisi, lalu hubungi sales lewat WhatsApp.`,
      };
    case "/simulasi-kredit":
      return {
        title: `Simulasi Kredit Mobil Bekas | ${siteName}`,
        description: `Hitung estimasi DP dan angsuran bulanan mobil bekas di ${siteName}. Hasil simulasi bersifat estimasi, bukan penawaran resmi.`,
      };
    case "/tukar-tambah":
      return {
        title: `Tukar Tambah & Jual Mobil Bekas | ${siteName}`,
        description: `Tukar tambah mobil lama Anda, jual mobil bekas, atau jadwalkan test drive di ${siteName}. Isi formulir, sales kami menghubungi lewat WhatsApp.`,
      };
    case "/testimoni":
      return {
        title: `Testimoni Pelanggan | ${siteName}`,
        description: `Cerita pelanggan yang membeli mobil bekas di ${siteName}: pengalaman serah terima, kondisi unit, dan pelayanan sales.`,
      };
    case "/artikel":
      return {
        title: `Artikel & Tips Mobil Bekas | ${siteName}`,
        description: `Tips membeli, merawat, dan menilai harga mobil bekas dari ${siteName}. Panduan singkat untuk pembeli pertama.`,
      };
    case "/kontak":
      return {
        title: `Kontak & Lokasi Showroom | ${siteName}`,
        description: `Hubungi ${siteName}: alamat showroom, jam operasional, nomor WhatsApp sales, telepon kantor, dan peta lokasi.`,
      };
    default:
      return null;
  }
}

async function carMeta(
  slug: string,
  siteName: string,
  origin: string,
): Promise<PageMeta | null> {
  const rows = await db.query.cars.findMany({
    where: and(
      eq(schema.cars.slug, slug),
      notInArray(schema.cars.status, ["draft", "diarsipkan"]),
    ),
    limit: 1,
    with: {
      brand: { columns: { name: true } },
      photos: { columns: { url: true, isPrimary: true, order: true } },
    },
  });

  const car = rows[0];
  if (!car) return null;

  const photo =
    car.photos.find((p) => p.isPrimary)?.url ?? car.photos[0]?.url ?? null;
  const canonicalPath = `/katalog/${car.slug}`;
  const title = `${car.title} | ${siteName}`;
  const description = truncate(
    car.description ??
      `${car.brand?.name ?? ""} ${car.model} ${car.year}, ${rupiah(car.price)}, ${car.mileage.toLocaleString("id-ID")} km, transmisi ${car.transmission}. Unit dicek dan siap pakai di ${siteName}.`,
  );

  return {
    title,
    description,
    canonicalPath,
    siteName,
    ogType: "product",
    ogImage: photo ? absolute(photo, origin) : null,
    noindex: false,
    notFound: false,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Vehicle",
      name: car.title,
      brand: { "@type": "Brand", name: car.brand?.name ?? car.model },
      model: car.model,
      vehicleModelDate: String(car.year),
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: car.mileage,
        unitCode: "KMT",
      },
      offers: {
        "@type": "Offer",
        price: Number(car.price),
        priceCurrency: "IDR",
        availability: availability(car.status),
        url: absolute(canonicalPath, origin),
      },
    },
  };
}

async function articleMeta(
  slug: string,
  siteName: string,
  origin: string,
): Promise<PageMeta | null> {
  const [article] = await db
    .select()
    .from(schema.articles)
    .where(
      and(eq(schema.articles.slug, slug), eq(schema.articles.status, "terbit")),
    )
    .limit(1);

  if (!article) return null;

  const canonicalPath = `/artikel/${article.slug}`;

  return {
    title: `${article.title} | ${siteName}`,
    description: truncate(article.content),
    canonicalPath,
    siteName,
    ogType: "article",
    ogImage: article.coverImageUrl
      ? absolute(article.coverImageUrl, origin)
      : null,
    noindex: false,
    notFound: false,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      datePublished: article.publishedAt?.toISOString() ?? undefined,
      dateModified: article.updatedAt.toISOString(),
      image: article.coverImageUrl
        ? [absolute(article.coverImageUrl, origin)]
        : undefined,
      mainEntityOfPage: absolute(canonicalPath, origin),
      publisher: { "@type": "Organization", name: siteName },
    },
  };
}

export async function resolvePageMeta(
  rawPath: string,
  origin: string,
): Promise<PageMeta> {
  const path = normalizePathname(rawPath);
  const settings = await getSettings();
  const siteName =
    settings?.showroomName || env.SHOWROOM_NAME || FALLBACK_SITE_NAME;

  const base = {
    canonicalPath: path,
    siteName,
    ogImage: null,
    ogType: "website",
    noindex: false,
    notFound: false,
    jsonLd: null,
  } satisfies Omit<PageMeta, "title" | "description">;

  if (path.startsWith("/admin")) {
    return {
      ...base,
      title: `Admin | ${siteName}`,
      description: "Area pengelolaan showroom. Tidak diindeks mesin pencari.",
      noindex: true,
    };
  }

  if (path === "/") {
    const heroTitle = settings?.heroTitle || "Mobil Bekas Berkualitas";
    return {
      ...base,
      title: `${heroTitle} | ${siteName}`,
      description: truncate(
        settings?.heroSubtitle ||
          `${siteName} menjual mobil bekas pilihan dengan kondisi prima, harga transparan, dan proses tukar tambah yang mudah.`,
      ),
    };
  }

  const carMatch = path.match(/^\/katalog\/([^/]+)$/);
  if (carMatch) {
    const meta = await carMeta(
      decodeURIComponent(carMatch[1]),
      siteName,
      origin,
    ).catch(() => null);
    if (meta) return meta;
  }

  const articleMatch = path.match(/^\/artikel\/([^/]+)$/);
  if (articleMatch) {
    const meta = await articleMeta(
      decodeURIComponent(articleMatch[1]),
      siteName,
      origin,
    ).catch(() => null);
    if (meta) return meta;
  }

  const copy = staticCopy(path, siteName);
  if (copy) {
    return {
      ...base,
      title: copy.title,
      description: copy.description,
    };
  }

  return {
    ...base,
    title: `Halaman Tidak Ditemukan | ${siteName}`,
    description: "Halaman yang Anda cari tidak tersedia di situs ini.",
    noindex: true,
    notFound: true,
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderMetaTags(meta: PageMeta, origin: string): string {
  const canonical = absolute(meta.canonicalPath, origin);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
  ];

  if (meta.ogImage) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`,
    );
  }

  tags.push(
    `<meta name="twitter:card" content="${meta.ogImage ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  );

  if (meta.noindex) {
    tags.push(`<meta name="robots" content="noindex, nofollow" />`);
  }

  if (meta.jsonLd) {
    const json = JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c");
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }

  return tags.join("\n    ");
}

// Ganti <title> bawaan template lalu sisipkan meta di marker <!--seo-->
// (atau sebelum </head> bila marker tidak ada).
export function injectMeta(html: string, tags: string): string {
  const withoutTitle = html.replace(/<title>[\s\S]*?<\/title>\s*/i, "");

  if (withoutTitle.includes("<!--seo-->")) {
    return withoutTitle.replace("<!--seo-->", tags);
  }

  return withoutTitle.replace(/<\/head>/i, `  ${tags}\n  </head>`);
}
