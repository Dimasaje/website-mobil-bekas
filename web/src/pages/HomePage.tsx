import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useLayoutSettings } from "../components/layout/Layout";
import { apiClient, type Car, type SiteSettings } from "../lib/api";
import { buildWhatsAppLink } from "../lib/whatsapp";

export function HomePage() {
  const { settings: layoutSettings } = useLayoutSettings();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, carsRes] = await Promise.allSettled([
        apiClient.getSettings(),
        apiClient.getCars({ limit: 6, isFeatured: true }),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
        setSettings(settingsRes.value.data);
      }
      if (carsRes.status === "fulfilled" && carsRes.value.data) {
        setCars(carsRes.value.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data beranda",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeSettings = settings || layoutSettings;
  const heroTitle =
    activeSettings?.heroTitle || "Temukan Mobil Bekas Impian Anda";
  const heroSubtitle =
    activeSettings?.heroSubtitle ||
    "Pilihan terlengkap, kondisi prima terjamin, bebas banjir dan tabrak.";
  const waNumber = activeSettings?.whatsappNumber || "6281298765432";

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-blue-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-blue-800 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Garansi Bebas Banjir & Tabrak
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            {heroTitle}
          </h1>
          <p className="text-base md:text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={buildWhatsAppLink({
                phoneNumber: waNumber,
                showroomName: activeSettings?.showroomName,
                context: "general",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa"
            >
              💬 Konsultasi via WhatsApp
            </a>
            <Link
              to="/katalog"
              className="btn btn-outline border-white text-white hover:bg-white/10"
            >
              Jelajahi Stok Mobil
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Unit Pilihan Terbaru
            </h2>
            <p className="text-sm text-slate-600">
              Mobil bekas siap pakai dengan inspeksi ketat dan riwayat servis
              terverifikasi.
            </p>
          </div>
          <Link
            to="/katalog"
            className="text-sm font-semibold text-blue-800 hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>

        {loading && <LoadingSpinner message="Memuat stok mobil..." />}

        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!loading && !error && cars.length === 0 && (
          <EmptyState
            title="Belum Ada Mobil Ditampilkan"
            description="Stok unit pilihan akan segera diperbarui. Hubungi kami via WhatsApp untuk daftar stok terbaru."
          />
        )}

        {!loading && !error && cars.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => {
              const primaryPhoto = car.photos?.find(
                (p) => p.isPrimary,
              )?.photoUrl;
              return (
                <article
                  key={car.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {primaryPhoto ? (
                      <img
                        src={primaryPhoto}
                        alt={car.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-slate-400 text-sm">
                        🚗 Foto belum tersedia
                      </div>
                    )}
                    <span className="absolute top-3 left-3 badge badge-available">
                      {car.status === "tersedia"
                        ? "Tersedia"
                        : car.status === "booking"
                          ? "Booking"
                          : "Terjual"}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 line-clamp-1 mb-1">
                        {car.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                        <span>{car.year}</span>
                        <span>•</span>
                        <span className="capitalize">{car.transmission}</span>
                        <span>•</span>
                        <span>{car.mileage.toLocaleString("id-ID")} km</span>
                      </div>
                      <div className="text-lg font-bold text-blue-800 mb-1">
                        Rp {Number(car.price).toLocaleString("id-ID")}
                      </div>
                      {car.dpAmount && (
                        <div className="text-xs text-slate-500">
                          DP Rp {Number(car.dpAmount).toLocaleString("id-ID")}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <Link
                        to={`/katalog/${car.slug}`}
                        className="btn btn-outline btn-sm flex-1 text-center"
                      >
                        Detail
                      </Link>
                      <a
                        href={buildWhatsAppLink({
                          phoneNumber: waNumber,
                          showroomName: activeSettings?.showroomName,
                          context: "car",
                          params: { carTitle: car.title, price: car.price },
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-wa btn-sm"
                      >
                        Tanya WA
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
