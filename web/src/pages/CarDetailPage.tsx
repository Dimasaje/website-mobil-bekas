import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useLayoutSettings } from "../components/layout/Layout";
import { apiClient, type Car } from "../lib/api";
import {
  CARD_IMAGE_SIZES,
  DETAIL_IMAGE_SIZES,
  imageSources,
  imageVariant,
} from "../lib/images";
import { buildWhatsAppLink } from "../lib/whatsapp";

export function CarDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { settings: layoutSettings } = useLayoutSettings();

  const [car, setCar] = useState<Car | null>(null);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const fetchCarDetail = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.getCarBySlug(slug);
      if (res.data) {
        setCar(res.data);
        setActivePhotoIndex(0);

        // Fetch similar cars (same brand or featured cars)
        try {
          const brandSlug = res.data.brand?.slug || res.data.brandName;
          const similarRes = await apiClient.getCars({
            brand: brandSlug,
            limit: 4,
          });
          if (similarRes.data) {
            setSimilarCars(
              similarRes.data
                .filter((item) => item.id !== res.data?.id)
                .slice(0, 3),
            );
          }
        } catch {
          // Ignore similar cars fetch failure
        }
      } else {
        setCar(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat detail mobil",
      );
      setCar(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarDetail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Keyboard navigation for zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomOpen) return;
      if (e.key === "Escape") setIsZoomOpen(false);
      if (e.key === "ArrowLeft") handlePrevPhoto();
      if (e.key === "ArrowRight") handleNextPhoto();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, car, activePhotoIndex]);

  // Lock body scroll while zoom modal is open
  useEffect(() => {
    document.body.style.overflow = isZoomOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isZoomOpen]);

  const showroomName = layoutSettings?.showroomName || "Bintang Mobil";
  const waNumber = layoutSettings?.whatsappNumber || "6281298765432";

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingSpinner message="Memuat detail spesifikasi dan galeri mobil..." />
      </div>
    );
  }

  // 404 / Error State
  if (error || !car) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="text-6xl mb-4">🚗💨</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            404 - Mobil Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Unit mobil yang Anda cari tidak tersedia, sudah laku terjual, atau
            tautan yang Anda tuju salah.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/katalog" className="btn btn-primary font-bold">
              🔍 Jelajahi Stok Mobil Lainnya
            </Link>
            <Link to="/" className="btn btn-outline">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Photos list
  const photos: Array<{ url: string; id?: string }> =
    car.photos && car.photos.length > 0
      ? car.photos
          .map((p) => ({
            url: p.url || p.photoUrl || "",
            id: p.id,
          }))
          .filter((p) => Boolean(p.url))
      : car.primaryPhoto
        ? [{ url: car.primaryPhoto }]
        : [];

  const currentPhoto = photos[activePhotoIndex] || {
    url: car.primaryPhoto || "",
  };

  const handlePrevPhoto = () => {
    if (photos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (photos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNextPhoto(); // Geser ke kiri -> next
    } else if (diff < -50) {
      handlePrevPhoto(); // Geser ke kanan -> prev
    }
    setTouchStartX(null);
  };

  // Current URL for WhatsApp Context
  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://bintangmobil.com/katalog/${car.slug}`;

  const waCarMessage = `Halo ${showroomName}, saya tertarik dengan unit ${car.title} (Rp ${Number(car.price).toLocaleString("id-ID")}). Link: ${currentUrl}. Apakah unit masih tersedia untuk dijadwalkan cek fisik/test drive?`;

  const waLink = buildWhatsAppLink({
    phoneNumber: waNumber,
    showroomName,
    context: "general",
    params: {
      customMessage: waCarMessage,
    },
  });

  const isSold = car.status === "terjual";
  const isBooking = car.status === "booking";

  const statusBadgeClass = isSold
    ? "badge-sold"
    : isBooking
      ? "badge-booking"
      : "badge-available";

  const statusLabel = isSold
    ? "Terjual"
    : isBooking
      ? "Sedang Dibooking"
      : "Tersedia (Ready di Showroom)";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-28 md:pb-12">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-blue-800 transition-colors">
          Beranda
        </Link>
        <span>›</span>
        <Link to="/katalog" className="hover:text-blue-800 transition-colors">
          Katalog
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-900 line-clamp-1 max-w-xs md:max-w-md">
          {car.title}
        </span>
      </nav>

      {/* Main Detail Grid Layout: Kolom Kiri Galeri & Konten + Kolom Kanan Sticky CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Kolom Kiri (2 Kolom di Desktop): Galeri, Spesifikasi, Inspeksi, Deskripsi */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Galeri Foto */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-4">
            {/* Foto Utama */}
            <div
              className="relative h-72 sm:h-96 md:h-[420px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center select-none group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {currentPhoto.url ? (
                <img
                  {...imageSources(currentPhoto.url)}
                  sizes={DETAIL_IMAGE_SIZES}
                  alt={`${car.title} foto ${activePhotoIndex + 1}`}
                  className="w-full h-full object-contain cursor-zoom-in"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onClick={() => setIsZoomOpen(true)}
                />
              ) : (
                <div className="text-slate-400 text-center p-6">
                  <span className="text-4xl block mb-2">🚗</span>
                  <p className="text-sm">Foto belum tersedia untuk unit ini</p>
                </div>
              )}

              {/* Status Badge Overlay */}
              <span
                className={`absolute top-4 left-4 badge ${statusBadgeClass} shadow-md`}
              >
                ● {statusLabel}
              </span>

              {/* Zoom Trigger Button */}
              {currentPhoto.url && (
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                  aria-label="Perbesar foto"
                >
                  🔍 Perbesar
                </button>
              )}

              {/* Navigation Arrows for Main Photo */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-900 shadow-md flex items-center justify-center font-bold text-lg cursor-pointer transition-all hover:scale-105"
                    aria-label="Foto sebelumnya"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-900 shadow-md flex items-center justify-center font-bold text-lg cursor-pointer transition-all hover:scale-105"
                    aria-label="Foto berikutnya"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Photo Counter */}
              {photos.length > 1 && (
                <span className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-xs font-semibold">
                  {activePhotoIndex + 1} / {photos.length}
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto pb-2 scrollbar-thin">
                {photos.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-20 h-14 sm:w-24 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIndex === idx
                        ? "border-blue-700 ring-2 ring-blue-700/20 scale-102"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imageVariant(item.url, "thumb")}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Spesifikasi Unit Lengkap */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span>📋</span> Spesifikasi Lengkap Kendaraan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Merek Mobil</span>
                <span className="font-bold text-slate-900">
                  {car.brand?.name || car.brandName || "Umum"}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Model / Tipe</span>
                <span className="font-bold text-slate-900">{car.model}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">
                  Tahun Pembuatan
                </span>
                <span className="font-bold text-slate-900">{car.year}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Transmisi</span>
                <span className="font-bold text-slate-900 capitalize">
                  {car.transmission}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">
                  Jarak Tempuh (Odo)
                </span>
                <span className="font-bold text-slate-900">
                  {car.mileage.toLocaleString("id-ID")} km
                </span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Bahan Bakar</span>
                <span className="font-bold text-slate-900 capitalize">
                  {car.fuelType}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Warna Bodi</span>
                <span className="font-bold text-slate-900 capitalize">
                  {car.color}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">
                  Status Dokumen
                </span>
                <span className="font-bold text-emerald-700">
                  BPKB & STNK Siap Valid
                </span>
              </div>
            </div>
          </section>

          {/* 3. Sertifikasi & Inspeksi 150+ Titik */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <span>🛡️</span> Lolos Sertifikasi Inspeksi 150+ Titik
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Setiap mobil telah melalui standar inspeksi ketat independen oleh
              mekanik profesional {showroomName}:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>Garansi 100% Bebas Banjir</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>Garansi Bebas Tabrakan Berat / Tulang Utuh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>Mesin Halus, Kering, Tanpa Rembes Oli</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>Transmisi Responsif & Perpindahan Halus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>AC Dingin & Kelistrikan Berfungsi Normal</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>Kaki-kaki Senyap & Suspensi Stabil</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>Odometer Asli Bukan Putaran</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <span>BPKB, STNK & Faktur Asli Terverifikasi</span>
              </li>
            </ul>
          </section>

          {/* 4. Deskripsi & Kondisi Nyata */}
          {car.description && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <span>📝</span> Catatan Penjual & Kondisi Nyata
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {car.description}
              </div>
            </section>
          )}
        </div>

        {/* Kolom Kanan (1 Kolom): Card Harga & Sticky CTA Closing WhatsApp */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md sticky top-24 space-y-6">
            <div>
              <span
                className={`badge ${statusBadgeClass} mb-2 inline-block text-xs`}
              >
                {statusLabel}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                {car.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tahun {car.year} • {car.transmission} •{" "}
                {car.mileage.toLocaleString("id-ID")} km
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-blue-900 mb-1">
                Harga Tunai / Cash (Nego)
              </div>
              <div
                className={`text-2xl md:text-3xl font-black ${
                  isSold ? "text-slate-400 line-through" : "text-blue-800"
                }`}
              >
                Rp {Number(car.price).toLocaleString("id-ID")}
              </div>

              {car.dpAmount && !isSold && (
                <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-slate-700 space-y-1">
                  <div>
                    DP Mulai:{" "}
                    <strong className="text-slate-900 font-bold">
                      Rp {Number(car.dpAmount).toLocaleString("id-ID")}
                    </strong>
                  </div>
                  {car.monthlyInstallment && (
                    <div>
                      Angsuran:{" "}
                      <strong className="text-slate-900 font-bold">
                        Rp{" "}
                        {Number(car.monthlyInstallment).toLocaleString("id-ID")}
                        /bln
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3">
              {!isSold ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-wa btn-lg w-full font-bold shadow-md justify-center text-base"
                >
                  💬 Nego & Tanya Unit via WA
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn btn-outline btn-lg w-full opacity-60 cursor-not-allowed justify-center text-sm font-bold"
                >
                  Unit Ini Sudah Terjual
                </button>
              )}

              <Link
                to={`/simulasi-kredit?price=${car.price}&car=${encodeURIComponent(
                  car.title,
                )}`}
                className="btn btn-outline w-full justify-center text-xs font-bold"
              >
                Hitung Simulasi Cicilan Sendiri
              </Link>

              <Link
                to={`/tukar-tambah?target=${encodeURIComponent(car.title)}&carId=${car.id}`}
                className="btn btn-outline w-full justify-center text-xs font-bold"
              >
                Ajukan Tukar Tambah Mobil Lama
              </Link>
            </div>

            {/* Trust badge note */}
            <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 leading-normal">
              🔒 Jaminan buyback / garansi uang kembali bila ditemukan indikasi
              bekas banjir atau tabrakan besar.
            </div>
          </div>
        </aside>
      </div>

      {/* 5. Rekomendasi Mobil Serupa */}
      {similarCars.length > 0 && (
        <section className="mt-16 pt-10 border-t border-slate-200">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Pilihan Mobil Serupa
              </h2>
              <p className="text-xs text-slate-500">
                Unit sejenis yang mungkin cocok dengan preferensi Anda.
              </p>
            </div>
            <Link
              to="/katalog"
              className="text-xs font-bold text-blue-800 hover:underline"
            >
              Lihat Semua Stok →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarCars.map((simCar) => {
              const photo =
                simCar.primaryPhoto ||
                simCar.photos?.find((p) => p.isPrimary)?.url ||
                simCar.photos?.[0]?.url;

              return (
                <article
                  key={simCar.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {photo ? (
                      <img
                        {...imageSources(photo)}
                        sizes={CARD_IMAGE_SIZES}
                        alt={simCar.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="text-slate-600 text-sm">
                        🚗 Foto belum tersedia
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                        <Link
                          to={`/katalog/${simCar.slug}`}
                          className="hover:text-blue-800"
                        >
                          {simCar.title}
                        </Link>
                      </h3>
                      <div className="text-xs text-slate-600 mb-2">
                        {simCar.year} • {simCar.transmission} •{" "}
                        {simCar.mileage.toLocaleString("id-ID")} km
                      </div>
                      <div className="text-base font-extrabold text-blue-800">
                        Rp {Number(simCar.price).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <Link
                        to={`/katalog/${simCar.slug}`}
                        className="btn btn-outline btn-sm w-full text-center text-xs font-semibold"
                      >
                        Lihat Detail Unit
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Modal Lightbox Foto (Perbesar Foto) */}
      {isZoomOpen && currentPhoto.url && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 text-2xl w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Tutup perbesaran foto"
          >
            ✕
          </button>

          {/* Navigation Prev & Next inside Zoom */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 text-3xl w-12 h-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Foto sebelumnya"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 text-3xl w-12 h-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Foto berikutnya"
              >
                ›
              </button>
            </>
          )}

          {/* Large Image View */}
          <div
            className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageVariant(currentPhoto.url, "large")}
              alt={`${car.title} foto ${activePhotoIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {photos.length > 1 && (
              <span className="text-white/80 text-xs mt-3 bg-black/40 px-3 py-1 rounded-full">
                Foto {activePhotoIndex + 1} dari {photos.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 7. Mobile Sticky Bottom Bar (Hanya tampil di ponsel) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30 shadow-lg lg:hidden flex items-center justify-between gap-3">
        <div>
          <div
            className={`text-base font-extrabold ${
              isSold ? "text-slate-400 line-through" : "text-blue-800"
            }`}
          >
            Rp {Number(car.price).toLocaleString("id-ID")}
          </div>
          <div className="text-[11px] text-slate-500">
            {isSold
              ? "Unit Sudah Terjual"
              : car.dpAmount
                ? `DP Rp ${Number(car.dpAmount).toLocaleString("id-ID")}`
                : "Siap Pakai & Bergaransi"}
          </div>
        </div>

        {!isSold ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa btn-sm font-bold text-xs px-4"
          >
            💬 Chat WA
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn btn-outline btn-sm text-xs opacity-50 cursor-not-allowed"
          >
            Terjual
          </button>
        )}
      </div>
    </div>
  );
}
