import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { apiClient, type Car } from "../lib/api";

export function CatalogPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getCars();
      if (res.data) setCars(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat katalog mobil",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          Katalog Mobil Bekas
        </h1>
        <p className="text-sm text-slate-600">
          Temukan mobil impian dengan jaminan kualitas terbaik dan garansi
          resmi.
        </p>
      </div>

      {loading && <LoadingSpinner message="Memuat daftar mobil..." />}
      {error && <ErrorState message={error} onRetry={fetchCars} />}

      {!loading && !error && cars.length === 0 && (
        <EmptyState
          title="Tidak Ada Mobil"
          description="Saat ini belum ada mobil yang tersedia di katalog."
        />
      )}

      {!loading && !error && cars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => {
            const primaryPhoto = car.photos?.find((p) => p.isPrimary)?.photoUrl;
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
                    {car.status === "tersedia" ? "Tersedia" : car.status}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 line-clamp-1 mb-1">
                      {car.title}
                    </h3>
                    <div className="flex gap-2 text-xs text-slate-500 mb-3">
                      <span>{car.year}</span>
                      <span>•</span>
                      <span className="capitalize">{car.transmission}</span>
                      <span>•</span>
                      <span>{car.mileage.toLocaleString("id-ID")} km</span>
                    </div>
                    <div className="text-lg font-bold text-blue-800">
                      Rp {Number(car.price).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                    <Link
                      to={`/katalog/${car.slug}`}
                      className="btn btn-outline btn-sm flex-1 text-center"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
