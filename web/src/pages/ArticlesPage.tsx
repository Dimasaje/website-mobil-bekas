import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { apiClient, type Article } from "../lib/api";

export function ArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get("page") || "1", 10);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getArticles({ page, limit: 9 });
      if (res.data) {
        setArticles(res.data);
      } else {
        setArticles([]);
      }
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat daftar artikel",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-blue-800 transition-colors">
          Beranda
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-900">
          Artikel & Tips Otomotif
        </span>
      </nav>

      {/* Header */}
      <div className="max-w-2xl mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2">
          Artikel & Tips Seputar Mobil Bekas
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Panduan lengkap membeli mobil bekas berkualitas, tips perawatan mesin,
          dan informasi pembiayaan kredit aman.
        </p>
      </div>

      {/* Error State */}
      {error && <ErrorState message={error} onRetry={fetchArticles} />}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col"
            >
              <div className="h-44 bg-slate-200 w-full" />
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/3 pt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <EmptyState
            title="Belum Ada Artikel"
            description="Artikel dan tips otomotif terbaru akan segera kami terbitkan."
          />
        </div>
      )}

      {/* Articles Grid */}
      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => {
            const dateStr = art.publishedAt
              ? new Date(art.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Tips Otomotif";

            const excerpt =
              art.content?.replace(/[#*`]/g, "").slice(0, 130).trim() + "...";

            return (
              <article
                key={art.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Cover Image */}
                <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {art.coverImageUrl ? (
                    <img
                      src={art.coverImageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-4xl text-slate-400">📰</span>
                  )}
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-600 mb-2 font-medium">
                      📅 {dateStr}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 hover:text-blue-800 transition-colors">
                      <Link to={`/artikel/${art.slug}`}>{art.title}</Link>
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                      {excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      to={`/artikel/${art.slug}`}
                      className="text-xs font-bold text-blue-800 hover:underline flex items-center gap-1"
                    >
                      Baca Selengkapnya <span>→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <nav
          className="flex justify-center items-center gap-2 mt-12"
          aria-label="Navigasi Halaman Artikel"
        >
          <button
            type="button"
            onClick={() =>
              setSearchParams({ page: String(Math.max(1, page - 1)) })
            }
            disabled={page <= 1}
            className="btn btn-outline btn-sm px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSearchParams({ page: String(p) })}
                className={`btn btn-sm min-w-9 px-3 font-semibold ${
                  p === page
                    ? "btn-primary shadow-xs"
                    : "btn-outline text-slate-700 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() =>
              setSearchParams({
                page: String(Math.min(pagination.totalPages, page + 1)),
              })
            }
            disabled={page >= pagination.totalPages}
            className="btn btn-outline btn-sm px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  );
}
