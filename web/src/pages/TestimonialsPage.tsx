import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { useLayoutSettings } from "../components/layout/Layout";
import { apiClient, type Testimonial } from "../lib/api";
import { buildWhatsAppLink } from "../lib/whatsapp";

export function TestimonialsPage() {
  const { settings: layoutSettings } = useLayoutSettings();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getTestimonials();
      if (res.data) {
        setTestimonials(res.data);
      } else {
        setTestimonials([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat galeri testimoni pelanggan",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const showroomName = layoutSettings?.showroomName || "Bintang Mobil";
  const waNumber = layoutSettings?.whatsappNumber || "6281298765432";

  const waLink = buildWhatsAppLink({
    phoneNumber: waNumber,
    showroomName,
    context: "general",
    params: {
      customMessage: `Halo ${showroomName}, saya melihat galeri serah terima unit di website dan tertarik ingin konsultasi unit mobil bekas.`,
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-blue-800 transition-colors">
          Beranda
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-900">
          Galeri Serah Terima & Testimoni
        </span>
      </nav>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-3">
          Bukti Nyata Kepuasan Pelanggan Kami
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Setiap mobil bekas yang keluar dari showroom {showroomName} adalah
          komitmen kualitas, integritas dokumen asli 100%, serta pelayanan purna
          jual terbaik.
        </p>
      </div>

      {/* Error State */}
      {error && <ErrorState message={error} onRetry={fetchTestimonials} />}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col"
            >
              <div className="h-48 bg-slate-200 w-full" />
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/2 pt-2 border-t border-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && testimonials.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <EmptyState
            title="Belum Ada Testimoni"
            description="Saat ini ulasan serah terima pelanggan sedang dalam proses pembaruan."
          />
        </div>
      )}

      {/* Testimonials Grid */}
      {!loading && !error && testimonials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testi) => {
            const stars = "★".repeat(Math.max(1, Math.min(5, testi.rating)));

            return (
              <article
                key={testi.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Media Foto Serah Terima */}
                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {testi.photoUrl ? (
                    <img
                      src={testi.photoUrl}
                      alt={`Serah terima unit ${testi.carName || "mobil"} kepada ${testi.customerName}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400">
                      <span className="text-4xl block mb-1">🤝</span>
                      <span className="text-xs font-medium">
                        Foto Serah Terima Unit
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 text-sm mb-2 font-bold">
                      <span>{stars}</span>
                      <span className="text-xs text-slate-400 ml-1">
                        ({testi.rating}/5)
                      </span>
                    </div>
                    <blockquote className="text-sm text-slate-700 leading-relaxed italic mb-4">
                      "{testi.quote}"
                    </blockquote>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {testi.customerName}
                      </div>
                      {testi.location && (
                        <div className="text-slate-500">{testi.location}</div>
                      )}
                    </div>
                    {testi.carName && (
                      <span className="font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md">
                        {testi.carName}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom CTA Banner */}
      <div className="mt-16 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-8 md:p-10 text-center shadow-lg">
        <h2 className="text-xl md:text-2xl font-black mb-2">
          Ingin Menjadi Bagian dari Konsumen Puas Kami?
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6">
          Hubungi tim konsultan kami untuk menemukan mobil impian yang
          bergaransi resmi, lulus inspeksi 150+ titik, dan siap pakai.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/katalog" className="btn btn-primary font-bold">
            🔍 Jelajahi Katalog Mobil
          </Link>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa font-bold"
          >
            💬 Konsultasi via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
