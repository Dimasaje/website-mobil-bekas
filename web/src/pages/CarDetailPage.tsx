import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { apiClient, type Car } from "../lib/api";
import { buildWhatsAppLink } from "../lib/whatsapp";

export function CarDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getCarBySlug(slug);
      if (res.data) setCar(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat detail mobil",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  if (loading) return <LoadingSpinner message="Memuat detail mobil..." />;
  if (error || !car) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <ErrorState
          title="Mobil Tidak Ditemukan"
          message={
            error ||
            "Unit mobil yang Anda cari tidak ditemukan atau telah diarsipkan."
          }
          onRetry={fetchDetail}
        />
        <div className="text-center mt-4">
          <Link to="/katalog" className="btn btn-primary btn-sm">
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  const primaryPhoto = car.photos?.find((p) => p.isPrimary)?.photoUrl;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/katalog"
        className="text-sm text-blue-800 hover:underline mb-4 inline-block"
      >
        ← Kembali ke Katalog
      </Link>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 shadow-sm">
        <div className="h-80 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-6">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={car.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-400">🚗 Foto belum tersedia</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{car.title}</h1>
        <div className="text-2xl font-extrabold text-blue-800 mb-4">
          Rp {Number(car.price).toLocaleString("id-ID")}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-sm mb-6">
          <div>
            <div className="text-slate-500 text-xs">Tahun</div>
            <div className="font-semibold">{car.year}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Transmisi</div>
            <div className="font-semibold capitalize">{car.transmission}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Kilometer</div>
            <div className="font-semibold">
              {car.mileage.toLocaleString("id-ID")} km
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Bahan Bakar</div>
            <div className="font-semibold capitalize">{car.fuelType}</div>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line mb-6">
          {car.description ||
            "Hubungi kami via WhatsApp untuk spesifikasi lengkap dan test drive."}
        </p>
        <div className="flex gap-4">
          <a
            href={buildWhatsAppLink({
              context: "car",
              params: { carTitle: car.title, price: car.price },
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa flex-1"
          >
            💬 Hubungi Sales via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
