import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useLayoutSettings } from "../components/layout/Layout";
import {
  apiClient,
  type Article,
  type Car,
  type CarFilters,
  type Promo,
  type SiteSettings,
  type Testimonial,
} from "../lib/api";
import { buildWhatsAppLink } from "../lib/whatsapp";

export function buildQuickSearchQuery(params: {
  brand?: string;
  priceRange?: string;
  yearRange?: string;
}): string {
  const q = new URLSearchParams();

  if (params.brand) {
    q.append("brand", params.brand);
  }

  if (params.priceRange === "under150") {
    q.append("maxPrice", "150000000");
  } else if (params.priceRange === "150-250") {
    q.append("minPrice", "150000000");
    q.append("maxPrice", "250000000");
  } else if (params.priceRange === "250-400") {
    q.append("minPrice", "250000000");
    q.append("maxPrice", "400000000");
  } else if (params.priceRange === "above400") {
    q.append("minPrice", "400000000");
  }

  if (params.yearRange === "gte2022") {
    q.append("minYear", "2022");
  } else if (params.yearRange === "2019-2021") {
    q.append("minYear", "2019");
    q.append("maxYear", "2021");
  } else if (params.yearRange === "2016-2018") {
    q.append("minYear", "2016");
    q.append("maxYear", "2018");
  } else if (params.yearRange === "under2016") {
    q.append("maxYear", "2015");
  }

  return q.toString();
}

export function HomePage() {
  const navigate = useNavigate();
  const { settings: layoutSettings } = useLayoutSettings();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filtersData, setFiltersData] = useState<CarFilters | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick search form state
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedYearRange, setSelectedYearRange] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        settingsRes,
        carsRes,
        promosRes,
        testiRes,
        articlesRes,
        filtersRes,
      ] = await Promise.allSettled([
        apiClient.getSettings(),
        apiClient.getCars({ limit: 6, isFeatured: true }),
        apiClient.getPromos(),
        apiClient.getTestimonials(),
        apiClient.getArticles({ limit: 3 }),
        apiClient.getCarFilters(),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
        setSettings(settingsRes.value.data);
      }
      if (carsRes.status === "fulfilled" && carsRes.value.data) {
        setFeaturedCars(carsRes.value.data);
      }
      if (promosRes.status === "fulfilled" && promosRes.value.data) {
        setPromos(promosRes.value.data);
      }
      if (testiRes.status === "fulfilled" && testiRes.value.data) {
        setTestimonials(testiRes.value.data);
      }
      if (articlesRes.status === "fulfilled" && articlesRes.value.data) {
        setArticles(articlesRes.value.data);
      }
      if (filtersRes.status === "fulfilled" && filtersRes.value.data) {
        setFiltersData(filtersRes.value.data);
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
  const showroomName = activeSettings?.showroomName || "Bintang Mobil";
  const waNumber = activeSettings?.whatsappNumber || "6281298765432";
  const heroTitle =
    activeSettings?.heroTitle ||
    "Beli Mobil Bekas Aman, Transparan & Bergaransi";
  const heroSubtitle =
    activeSettings?.heroSubtitle ||
    "Pilihan unit mobil siap pakai dengan inspeksi ketat 150+ titik. Transaksi cepat, kredit dibantu sampai approved, dan nego santai via WhatsApp.";

  // Quick search submit
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = buildQuickSearchQuery({
      brand: selectedBrand,
      priceRange: selectedPriceRange,
      yearRange: selectedYearRange,
    });
    navigate(`/katalog${query ? `?${query}` : ""}`);
  };

  const activePromo = promos.find((p) => p.isActive) || promos[0];

  return (
    <div className="space-y-16">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block bg-blue-800/80 border border-blue-400/30 text-blue-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            🛡️ Garansi Bebas Banjir & Bebas Tabrak
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
            {heroTitle}
          </h1>
          <p className="text-base md:text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={buildWhatsAppLink({
                phoneNumber: waNumber,
                showroomName,
                context: "general",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa"
            >
              💬 Konsultasi Cepat via WhatsApp
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

      {/* 2. Quick Search Bar */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              🔍 Temukan Mobil Pilihan Anda
            </h2>
            <p className="text-xs text-slate-500">
              Filter instan berdasarkan merek, anggaran, dan tahun pembuatan.
            </p>
          </div>

          <form
            onSubmit={handleQuickSearch}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            {/* Merek */}
            <div>
              <label
                htmlFor="quick-brand"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Merek Mobil
              </label>
              <select
                id="quick-brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="form-select text-sm h-11"
              >
                <option value="">Semua Merek</option>
                {filtersData?.brands?.map((brand) => (
                  <option key={brand.id} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
                {!filtersData?.brands && (
                  <>
                    <option value="toyota">Toyota</option>
                    <option value="honda">Honda</option>
                    <option value="daihatsu">Daihatsu</option>
                    <option value="mitsubishi">Mitsubishi</option>
                    <option value="suzuki">Suzuki</option>
                  </>
                )}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label
                htmlFor="quick-price"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Rentang Anggaran
              </label>
              <select
                id="quick-price"
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="form-select text-sm h-11"
              >
                <option value="">Semua Harga</option>
                <option value="under150">&lt; Rp 150 Juta</option>
                <option value="150-250">Rp 150 - 250 Juta</option>
                <option value="250-400">Rp 250 - 400 Juta</option>
                <option value="above400">&gt; Rp 400 Juta</option>
              </select>
            </div>

            {/* Tahun Pembuatan */}
            <div>
              <label
                htmlFor="quick-year"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tahun Pembuatan
              </label>
              <select
                id="quick-year"
                value={selectedYearRange}
                onChange={(e) => setSelectedYearRange(e.target.value)}
                className="form-select text-sm h-11"
              >
                <option value="">Semua Tahun</option>
                <option value="gte2022">&gt;= 2022 (Terbaru)</option>
                <option value="2019-2021">2019 - 2021</option>
                <option value="2016-2018">2016 - 2018</option>
                <option value="under2016">&lt; 2016</option>
              </select>
            </div>

            {/* Tombol Submit */}
            <div>
              <button
                type="submit"
                className="btn btn-accent w-full h-11 justify-center text-sm font-bold"
              >
                🔍 Cari Mobil
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. Keunggulan Layanan (Why Choose Us) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
            Mengapa Beli di {showroomName}?
          </h2>
          <p className="text-sm text-slate-600">
            Kenyamanan, kejujuran kondisi, dan kepastian legalitas adalah
            prioritas kami.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-4xl mb-3">🛡️</span>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Garansi Mesin 1 Tahun
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jaminan perbaikan resmi untuk mesin dan transmisi setiap unit
              pilihan.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-4xl mb-3">📋</span>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Lolos 150+ Titik Inspeksi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sertifikat pengecekan ketat memastikan mobil bebas tabrakan berat
              & banjir.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-4xl mb-3">📄</span>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Dokumen 100% Asli
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              BPKB, STNK, dan Faktur terverifikasi Samsat. Siap bantu balik nama
              kilat.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-4xl mb-3">💳</span>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Kredit DP Ringan & Bunga Murah
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Didukung leasing terpercaya dengan persetujuan cepat dan cicilan
              fleksibel.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Mobil Unggulan (Featured Stock) */}
      <section className="bg-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">
                Pilihan Unit Unggulan
              </h2>
              <p className="text-sm text-slate-600">
                Koleksi mobil terlaris dengan kilometer rendah dan kondisi
                istimewa.
              </p>
            </div>
            <Link
              to="/katalog"
              className="btn btn-outline btn-sm bg-white font-semibold"
            >
              Lihat Semua Stok →
            </Link>
          </div>

          {loading && <LoadingSpinner message="Memuat unit unggulan..." />}
          {error && <ErrorState message={error} onRetry={fetchData} />}

          {!loading && !error && featuredCars.length === 0 && (
            <EmptyState
              title="Unit Unggulan Segera Hadir"
              description="Stok sedang disiapkan tim inspeksi kami. Hubungi WA kami untuk ketersediaan unit."
            />
          )}

          {!loading && !error && featuredCars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.map((car) => {
                const primaryPhoto = car.photos?.find(
                  (p) => p.isPrimary,
                )?.photoUrl;
                const statusBadgeClass =
                  car.status === "tersedia"
                    ? "badge-available"
                    : car.status === "booking"
                      ? "badge-booking"
                      : "badge-sold";
                const statusLabel =
                  car.status === "tersedia"
                    ? "Tersedia"
                    : car.status === "booking"
                      ? "Sedang Booking"
                      : "Terjual";

                return (
                  <article
                    key={car.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-48 bg-slate-200 relative overflow-hidden flex items-center justify-center">
                      {primaryPhoto ? (
                        <img
                          src={primaryPhoto}
                          alt={car.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-slate-400 text-sm">
                          🚗 Foto belum tersedia
                        </span>
                      )}
                      <span
                        className={`absolute top-3 left-3 badge ${statusBadgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 line-clamp-1 mb-2">
                          {car.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-4">
                          <span>{car.year}</span>
                          <span>•</span>
                          <span className="capitalize">{car.transmission}</span>
                          <span>•</span>
                          <span>{car.mileage.toLocaleString("id-ID")} km</span>
                          <span>•</span>
                          <span className="capitalize">{car.color}</span>
                        </div>
                        <div className="text-xl font-extrabold text-blue-800 mb-1">
                          Rp {Number(car.price).toLocaleString("id-ID")}
                        </div>
                        {car.dpAmount && (
                          <div className="text-xs text-slate-500">
                            DP mulai Rp{" "}
                            {Number(car.dpAmount).toLocaleString("id-ID")}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                        <Link
                          to={`/katalog/${car.slug}`}
                          className="btn btn-outline btn-sm flex-1 text-center"
                        >
                          Detail
                        </Link>
                        <a
                          href={buildWhatsAppLink({
                            phoneNumber: waNumber,
                            showroomName,
                            context: "car",
                            params: { carTitle: car.title, price: car.price },
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-wa btn-sm"
                        >
                          💬 Tanya WA
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. Banner Promo Aktif */}
      {activePromo && (
        <section className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-r from-orange-700 to-amber-600 text-white rounded-2xl p-6 md:p-10 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                🎁 Promo Spesial Bulan Ini
              </span>
              <h3 className="text-2xl md:text-3xl font-black">
                {activePromo.title}
              </h3>
              <p className="text-sm md:text-base text-orange-100 leading-relaxed">
                {activePromo.description ||
                  "Nikmati kemudahan pembelian mobil bekas dengan promo menarik, bonus langsung, dan fasilitas spesial dari showroom kami."}
              </p>
            </div>
            <a
              href={buildWhatsAppLink({
                phoneNumber: waNumber,
                showroomName,
                context: "general",
                params: {
                  customMessage: `Halo ${showroomName}, saya ingin klaim promo: ${activePromo.title}`,
                },
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg bg-white text-orange-800 hover:bg-orange-50 font-bold whitespace-nowrap shadow-md"
            >
              Klaim Promo via WhatsApp →
            </a>
          </div>
        </section>
      )}

      {/* 6. Ringkasan Testimoni & Galeri */}
      {testimonials.length > 0 && (
        <section className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
              Testimoni & Serah Terima Unit
            </h2>
            <p className="text-sm text-slate-600">
              Ratusan pembeli puas telah membuktikan kualitas mobil dan
              kemudahan proses di {showroomName}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                      {item.customerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {item.customerName}
                      </h4>
                      {item.location && (
                        <p className="text-xs text-slate-500">
                          {item.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-amber-500 text-sm mb-3">
                    {"★".repeat(item.rating || 5)}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed mb-4">
                    "{item.quote}"
                  </p>
                </div>
                {item.carName && (
                  <div className="text-xs font-semibold text-blue-800 pt-3 border-t border-slate-100">
                    Unit: {item.carName}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/testimoni" className="btn btn-outline btn-sm">
              Lihat Semua Testimoni & Galeri →
            </Link>
          </div>
        </section>
      )}

      {/* 7. Artikel & Tips Pembelian Terbaru */}
      {articles.length > 0 && (
        <section className="bg-slate-100 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">
                  Tips & Informasi Otomotif
                </h2>
                <p className="text-sm text-slate-600">
                  Panduan cerdas membeli dan merawat mobil bekas dari pakar
                  inspeksi kami.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between p-5"
                >
                  <div>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2 block">
                      Artikel
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {article.content}
                    </p>
                  </div>
                  <a
                    href={buildWhatsAppLink({
                      phoneNumber: waNumber,
                      showroomName,
                      context: "general",
                      params: {
                        customMessage: `Halo ${showroomName}, saya ingin konsultasi terkait artikel "${article.title}"`,
                      },
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-800 hover:underline pt-2 border-t border-slate-100 flex items-center gap-1"
                  >
                    Konsultasi Terkait Artikel →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
