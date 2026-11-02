import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ApiClientError,
  apiClient,
  type AdminCar,
  type CarStatus,
} from "../../lib/api";

export const STATUS_LABELS: Record<CarStatus, string> = {
  draft: "Draft",
  tersedia: "Tersedia",
  booking: "Booking",
  terjual: "Terjual",
  diarsipkan: "Diarsipkan",
};

const STATUS_CLASSES: Record<CarStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  tersedia: "bg-emerald-100 text-emerald-800",
  booking: "bg-amber-100 text-amber-900",
  terjual: "bg-blue-100 text-blue-800",
  diarsipkan: "bg-slate-200 text-slate-600 line-through",
};

const FILTER_STATUSES: Array<CarStatus | ""> = [
  "",
  "draft",
  "tersedia",
  "booking",
  "terjual",
  "diarsipkan",
];

export function formatPrice(value: number | string): string {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export function AdminCarsPage() {
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<CarStatus | "">("");
  const [brandId, setBrandId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    apiClient
      .getCarFilters()
      .then((res) => setBrands(res.data?.brands ?? []))
      .catch(() => setBrands([]));
  }, []);

  const loadCars = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.listAdminCars({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        brandId: brandId || undefined,
      });
      if (currentRequest !== requestId.current) return;
      setCars(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(Math.max(1, res.pagination?.totalPages ?? 1));
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal memuat daftar mobil. Coba lagi.",
      );
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [page, debouncedSearch, status, brandId]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const patchLocal = (id: string, patch: Partial<AdminCar>) =>
    setCars((prev) =>
      prev.map((car) => (car.id === id ? { ...car, ...patch } : car)),
    );

  const handleStatusChange = async (car: AdminCar, next: CarStatus) => {
    setBusyId(car.id);
    setNotice(null);
    try {
      await apiClient.updateAdminCarStatus(car.id, next);
      patchLocal(car.id, { status: next });
      setNotice(`Status "${car.title}" diubah ke ${STATUS_LABELS[next]}.`);
    } catch (err) {
      setNotice(
        err instanceof ApiClientError
          ? err.message
          : "Gagal mengubah status mobil.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleFeaturedToggle = async (car: AdminCar) => {
    setBusyId(car.id);
    setNotice(null);
    try {
      await apiClient.updateAdminCarFeatured(car.id, !car.isFeatured);
      patchLocal(car.id, { isFeatured: !car.isFeatured });
    } catch (err) {
      setNotice(
        err instanceof ApiClientError
          ? err.message
          : "Gagal mengubah status unggulan.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (car: AdminCar) => {
    if (
      !window.confirm(
        `Arsipkan "${car.title}"? Unit tidak lagi tampil di website publik.`,
      )
    ) {
      return;
    }
    setBusyId(car.id);
    setNotice(null);
    try {
      await apiClient.archiveAdminCar(car.id);
      patchLocal(car.id, { status: "diarsipkan" });
      setNotice(`"${car.title}" diarsipkan.`);
    } catch (err) {
      setNotice(
        err instanceof ApiClientError
          ? err.message
          : "Gagal mengarsipkan mobil.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setBrandId("");
    setPage(1);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Daftar Inventori Unit ({total})
          </h1>
          <p className="text-sm text-slate-600">
            Kelola ketersediaan, status booking, harga OTR, dan foto kendaraan.
          </p>
        </div>
        <Link to="/admin/mobil/baru" className="btn btn-primary btn-sm">
          + Tambah Unit Baru
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 mb-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
        <div>
          <label htmlFor="car-search" className="sr-only">
            Cari mobil
          </label>
          <input
            id="car-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, model, atau plat nomor..."
            className="form-input text-sm"
          />
        </div>

        <div>
          <label htmlFor="car-status-filter" className="sr-only">
            Filter status
          </label>
          <select
            id="car-status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CarStatus | "");
              setPage(1);
            }}
            className="form-input text-sm"
          >
            {FILTER_STATUSES.map((value) => (
              <option key={value || "all"} value={value}>
                {value ? STATUS_LABELS[value] : "Semua Status"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="car-brand-filter" className="sr-only">
            Filter merek
          </label>
          <select
            id="car-brand-filter"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPage(1);
            }}
            className="form-input text-sm"
          >
            <option value="">Semua Merek</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="btn btn-outline btn-sm"
        >
          Reset
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg px-3 py-2 mb-3"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadCars}
            className="btn btn-outline btn-sm bg-white"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-3 py-2.5">Unit</th>
                <th className="text-left font-semibold px-3 py-2.5">Tahun</th>
                <th className="text-left font-semibold px-3 py-2.5">
                  Transmisi
                </th>
                <th className="text-left font-semibold px-3 py-2.5">Harga</th>
                <th className="text-left font-semibold px-3 py-2.5">Status</th>
                <th className="text-left font-semibold px-3 py-2.5">
                  Unggulan
                </th>
                <th className="text-right font-semibold px-3 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    Memuat daftar mobil...
                  </td>
                </tr>
              )}

              {!loading && cars.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    Tidak ada unit yang cocok dengan filter ini.
                  </td>
                </tr>
              )}

              {!loading &&
                cars.map((car) => {
                  const photo =
                    car.photos?.find((p) => p.isPrimary)?.url ??
                    car.photos?.[0]?.url;
                  const busy = busyId === car.id;

                  return (
                    <tr
                      key={car.id}
                      className="border-t border-slate-100 align-middle"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {photo ? (
                            <img
                              src={photo}
                              alt=""
                              className="w-14 h-10 object-cover rounded-md bg-slate-100"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-14 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                              —
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[220px]">
                              {car.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {car.brand?.name ?? "-"}
                              {car.licensePlate ? ` · ${car.licensePlate}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">{car.year}</td>
                      <td className="px-3 py-2.5">
                        {car.transmission === "matic" ? "Matic" : "Manual"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {formatPrice(car.price)}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={car.status}
                          disabled={busy}
                          aria-label={`Status ${car.title}`}
                          onChange={(e) =>
                            handleStatusChange(car, e.target.value as CarStatus)
                          }
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer disabled:opacity-60 ${
                            STATUS_CLASSES[car.status]
                          }`}
                        >
                          {(Object.keys(STATUS_LABELS) as CarStatus[]).map(
                            (value) => (
                              <option key={value} value={value}>
                                {STATUS_LABELS[value]}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleFeaturedToggle(car)}
                          disabled={busy}
                          aria-pressed={car.isFeatured}
                          className={`text-xl leading-none cursor-pointer disabled:opacity-60 ${
                            car.isFeatured ? "text-amber-500" : "text-slate-300"
                          }`}
                          title={
                            car.isFeatured
                              ? "Hapus dari unggulan"
                              : "Jadikan unggulan"
                          }
                        >
                          ★
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/mobil/${car.id}`}
                          className="text-blue-800 hover:underline text-xs font-semibold mr-3"
                        >
                          Ubah
                        </Link>
                        {car.status !== "diarsipkan" && (
                          <button
                            type="button"
                            onClick={() => handleArchive(car)}
                            disabled={busy}
                            className="text-red-700 hover:underline text-xs font-semibold cursor-pointer disabled:opacity-60"
                          >
                            Arsipkan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 mt-4 text-sm">
          <span className="text-slate-600">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
