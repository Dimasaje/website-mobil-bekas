import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useLayoutSettings } from "../components/layout/Layout";
import { apiClient, type Article } from "../lib/api";
import { buildWhatsAppLink } from "../lib/whatsapp";

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { settings: layoutSettings } = useLayoutSettings();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    apiClient
      .getArticleBySlug(slug)
      .then((res) => {
        if (res.data) {
          setArticle(res.data);
        } else {
          setArticle(null);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat artikel");
        setArticle(null);
      })
      .finally(() => {
        setLoading(false);
      });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  const showroomName = layoutSettings?.showroomName || "Bintang Mobil";
  const waNumber = layoutSettings?.whatsappNumber || "6281298765432";

  const waLink = buildWhatsAppLink({
    phoneNumber: waNumber,
    showroomName,
    context: "general",
    params: {
      customMessage: `Halo ${showroomName}, saya baru saja membaca artikel "${article?.title || ""}" dan ingin tanya lebih lanjut seputar unit mobil bekas.`,
    },
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingSpinner message="Memuat isi artikel..." />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="text-5xl mb-4">📰❌</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Artikel Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Artikel yang Anda cari tidak tersedia atau tautan sudah usang.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/artikel" className="btn btn-primary font-bold">
              ← Kembali ke Daftar Artikel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tips Otomotif";

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-blue-800 transition-colors">
          Beranda
        </Link>
        <span>›</span>
        <Link to="/artikel" className="hover:text-blue-800 transition-colors">
          Artikel
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-900 line-clamp-1 max-w-xs sm:max-w-md">
          {article.title}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <div className="text-xs text-slate-500 mb-2 font-medium">
          📅 Diterbitkan pada {dateStr} oleh Tim Redaksi {showroomName}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
          {article.title}
        </h1>
      </header>

      {/* Cover Image */}
      {article.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden mb-8 shadow-sm border border-slate-200 max-h-[420px] bg-slate-100 flex items-center justify-center">
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Body Content */}
      <div className="prose prose-slate max-w-none text-slate-800 text-base leading-relaxed space-y-4 whitespace-pre-line border-b border-slate-200 pb-10 mb-8">
        {article.content}
      </div>

      {/* Footer Navigation & CTA */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Butuh Rekomendasi Mobil Bekas?
          </h3>
          <p className="text-xs text-slate-600">
            Konsultasikan kebutuhan anggaran dan jenis mobil Anda bersama tim
            kami.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            to="/artikel"
            className="btn btn-outline btn-sm font-semibold flex-1 sm:flex-initial text-center"
          >
            ← Artikel Lain
          </Link>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa btn-sm font-semibold flex-1 sm:flex-initial text-center"
          >
            💬 Tanya Sales
          </a>
        </div>
      </div>
    </article>
  );
}
