import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { useLayoutSettings } from "../components/layout/Layout";
import { apiClient, carPhotoUrl, type Car, type CarFilters } from "../lib/api";
import { CARD_IMAGE_SIZES, imageSources } from "../lib/images";
import { buildWhatsAppLink } from "../lib/whatsapp";

// Helper pagination windowing
export function getVisiblePagination(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, "ellipsis", total);
  } else if (current >= total - 2) {
    pages.push(1, "ellipsis", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(
      1,
      "ellipsis",
      current - 1,
      current,
      current + 1,
      "ellipsis",
      total,
    );
  }

  return pages;
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings: layoutSettings } = useLayoutSettings();

  const [cars, setCars] = useState<Car[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });

  const [filterMetadata, setFilterMetadata] = useState<CarFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Read search params
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minYear = searchParams.get("minYear") || "";
  const maxYear = searchParams.get("maxYear") || "";
  const transmission = searchParams.get("transmission") || "";
  const fuelType = searchParams.get("fuelType") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "newest";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Local search text for debouncing/submitting
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  // Load filter metadata once
  useEffect(() => {
    let mounted = true;
    apiClient
      .getCarFilters()
      .then((res) => {
        if (mounted && res.data) {
          setFilterMetadata(res.data);
        }
      })
      .catch(() => {
        // Silently fallback if filter meta fails
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Update query params helper
  const updateParams = (
    newParams: Record<string, string | number | null | undefined>,
  ) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === "") {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });

    // Reset page to 1 unless page itself is explicitly updated
    if (!("page" in newParams)) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    if (sort && sort !== "newest") next.set("sort", sort);
    setSearchParams(next);
  };

  const fetchCars = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, string | number | undefined> = {
        page,
        limit: 9,
      };

      if (brand) queryParams.brand = brand;
      if (minPrice) queryParams.minPrice = Number(minPrice);
      if (maxPrice) queryParams.maxPrice = Number(maxPrice);
      if (minYear) queryParams.minYear = Number(minYear);
      if (maxYear) queryParams.maxYear = Number(maxYear);
      if (transmission) queryParams.transmission = transmission;
      if (fuelType) queryParams.fuelType = fuelType;
      if (status) queryParams.status = status;
      if (sort) queryParams.sort = sort;
      if (search) queryParams.search = search;

      const res = await apiClient.getCars(queryParams);

      if (res.data) {
        setCars(res.data);
      } else {
        setCars([]);
      }

      if (res.pagination) {
        setPagination(res.pagination);
      } else {
        setPagination({
          page,
          limit: 9,
          total: res.data?.length || 0,
          totalPages: 1,
        });
      }
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
  }, [searchParams.toString()]);

  // Count active filters (excluding sort and page)
  const activeFilterCount = [
    brand,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    transmission,
    fuelType,
    status,
    search,
  ].filter(Boolean).length;

  const showroomName = layoutSettings?.showroomName || "Bintang Mobil";
  const waNumber = layoutSettings?.whatsappNumber || "6281298765432";

  // Pre-determined price brackets
  const currentPriceRangeValue = () => {
    if (minPrice === "" && maxPrice === "150000000") return "under150";
    if (minPrice === "150000000" && maxPrice === "250000000") return "150-250";
    if (minPrice === "250000000" && maxPrice === "400000000") return "250-400";
    if (minPrice === "400000000" && maxPrice === "") return "above400";
    return "";
  };

  const handlePriceRangeChange = (val: string) => {
    if (val === "under150") {
      updateParams({ minPrice: null, maxPrice: "150000000" });
    } else if (val === "150-250") {
      updateParams({ minPrice: "150000000", maxPrice: "250000000" });
    } else if (val === "250-400") {
      updateParams({ minPrice: "250000000", maxPrice: "400000000" });
    } else if (val === "above400") {
      updateParams({ minPrice: "400000000", maxPrice: null });
    } else {
      updateParams({ minPrice: null, maxPrice: null });
    }
  };

  // Reusable Filter Form Content
  const renderFilterControls = (isMobile = false) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <span className="font-bold text-slate-900 text-sm">Filter Stok</span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
          >
            Reset Semua
          </button>
        )}
      </div>

      {/* Merek Mobil */}
      <div>
        <label
          htmlFor={isMobile ? "m-brand" : "d-brand"}
          className="block text-xs font-bold text-slate-700 mb-2"
        >
          Merek Mobil
        </label>
        <select
          id={isMobile ? "m-brand" : "d-brand"}
          value={brand}
          onChange={(e) => updateParams({ brand: e.target.value })}
          className="form-select text-sm h-10 w-full"
        >
          <option value="">Semua Merek</option>
          {filterMetadata?.brands?.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name} {b.carCount !== undefined ? `(${b.carCount})` : ""}
            </option>
          ))}
          {!filterMetadata?.brands && (
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

      {/* Rentang Harga */}
      <div>
        <label
          htmlFor={isMobile ? "m-price" : "d-price"}
          className="block text-xs font-bold text-slate-700 mb-2"
        >
          Rentang Harga
        </label>
        <select
          id={isMobile ? "m-price" : "d-price"}
          value={currentPriceRangeValue()}
          onChange={(e) => handlePriceRangeChange(e.target.value)}
          className="form-select text-sm h-10 w-full"
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
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Tahun Pembuatan
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min (2015)"
            value={minYear}
            onChange={(e) => updateParams({ minYear: e.target.value })}
            className="form-input text-xs h-10 flex-1"
            min={filterMetadata?.yearRange?.min || 2010}
            max={filterMetadata?.yearRange?.max || 2026}
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Maks (2026)"
            value={maxYear}
            onChange={(e) => updateParams({ maxYear: e.target.value })}
            className="form-input text-xs h-10 flex-1"
            min={filterMetadata?.yearRange?.min || 2010}
            max={filterMetadata?.yearRange?.max || 2026}
          />
        </div>
      </div>

      {/* Transmisi */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Transmisi
        </label>
        <div className="space-y-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={isMobile ? "m-trans" : "d-trans"}
              checked={transmission === ""}
              onChange={() => updateParams({ transmission: null })}
              className="accent-blue-800"
            />
            <span>Semua Transmisi</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={isMobile ? "m-trans" : "d-trans"}
              checked={transmission === "matic"}
              onChange={() => updateParams({ transmission: "matic" })}
              className="accent-blue-800"
            />
            <span>Otomatis / Matic</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={isMobile ? "m-trans" : "d-trans"}
              checked={transmission === "manual"}
              onChange={() => updateParams({ transmission: "manual" })}
              className="accent-blue-800"
            />
            <span>Manual</span>
          </label>
        </div>
      </div>

      {/* Bahan Bakar */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Bahan Bakar
        </label>
        <div className="space-y-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={isMobile ? "m-fuel" : "d-fuel"}
              checked={fuelType === ""}
              onChange={() => updateParams({ fuelType: null })}
              className="accent-blue-800"
            />
            <span>Semua Bahan Bakar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={isMobile ? "m-fuel" : "d-fuel"}
              checked={fuelType === "bensin"}
              onChange={() => updateParams({ fuelType: "bensin" })}
              className="accent-blue-800"
            />
            <span>Bensin</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={isMobile ? "m-fuel" : "d-fuel"}
              checked={fuelType === "diesel"}
              onChange={() => updateParams({ fuelType: "diesel" })}
              className="accent-blue-800"
            />
            <span>Diesel</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={isMobile ? "m-fuel" : "d-fuel"}
              checked={fuelType === "hybrid"}
              onChange={() => updateParams({ fuelType: "hybrid" })}
              className="accent-blue-800"
            />
            <span>Hybrid</span>
          </label>
        </div>
      </div>

      {/* Status Stok */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Status Stok
        </label>
        <div className="space-y-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={status === "tersedia"}
              onChange={(e) =>
                updateParams({ status: e.target.checked ? "tersedia" : null })
              }
              className="accent-blue-800 rounded"
            />
            <span>Hanya Unit Tersedia</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-blue-800 transition-colors">
          Beranda
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-900">
          Katalog Mobil Bekas
        </span>
      </nav>

      {/* Header & Summary */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">
          Katalog Mobil Bekas Pilihan
        </h1>
        <p className="text-sm text-slate-600">
          Menampilkan{" "}
          <strong className="text-slate-900">{pagination.total} unit</strong>{" "}
          mobil bekas siap pakai bergaransi resmi.
        </p>
      </div>

      {/* Toolbar: Search & Sort */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ search: searchInput });
          }}
          className="relative w-full md:w-96"
        >
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari model, nama mobil..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="form-input pl-10 pr-20 text-sm h-11 w-full"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null });
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-800 hover:underline px-2 py-1"
          >
            Cari
          </button>
        </form>

        {/* Toolbar Actions: Mobile Filter Toggle & Sort Select */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden btn btn-outline btn-sm font-semibold flex items-center gap-1.5 flex-1 md:flex-initial justify-center"
          >
            ⚙️ Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </button>

          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <label
              htmlFor="sort-select"
              className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline"
            >
              Urutkan:
            </label>
            <select
              id="sort-select"
              aria-label="Urutkan daftar mobil"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="form-select text-sm h-11 min-w-[170px]"
            >
              <option value="newest">Terbaru Masuk</option>
              <option value="price_asc">Harga: Termurah</option>
              <option value="price_desc">Harga: Termahal</option>
              <option value="year_desc">Tahun: Terbaru</option>
              <option value="mileage_asc">Kilometer: Terendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Filter Sidebar (Desktop) + Car Grid & Pagination */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden lg:block bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
          {renderFilterControls(false)}
        </aside>

        {/* Mobile Filter Drawer / Modal */}
        {isMobileFilterOpen && (
          <div
            className="fixed inset-0 z-[300] flex justify-end bg-black/60 backdrop-blur-xs lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filter Kendaraan"
          >
            <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Filter Kendaraan
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-800 text-lg cursor-pointer"
                  aria-label="Tutup filter"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 pb-6">
                {renderFilterControls(true)}
              </div>

              {/* Drawer Sticky Footer with safe bottom padding */}
              <div className="p-4 pb-8 sm:pb-5 border-t border-slate-200 bg-white flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="btn btn-primary w-full text-sm font-bold h-11"
                >
                  Terapkan Filter ({activeFilterCount})
                </button>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-outline w-full text-xs font-semibold h-9"
                  >
                    Reset Semua Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grid Mobil Area */}
        <main className="lg:col-span-3">
          {/* Error State */}
          {error && <ErrorState message={error} onRetry={fetchCars} />}

          {/* Loading Skeleton */}
          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col"
                >
                  <div className="h-48 bg-slate-200 w-full" />
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-6 bg-slate-200 rounded w-2/3" />
                    </div>
                    <div className="h-9 bg-slate-200 rounded w-full pt-4 border-t border-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && cars.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <EmptyState
                title="Mobil Tidak Ditemukan"
                description={
                  activeFilterCount > 0
                    ? "Tidak ada unit yang sesuai dengan kriteria filter Anda. Coba ubah atau reset filter."
                    : "Saat ini stok mobil belum tersedia di katalog."
                }
                actionText={
                  activeFilterCount > 0 ? "Reset Semua Filter" : undefined
                }
                onAction={
                  activeFilterCount > 0 ? handleResetFilters : undefined
                }
              />
            </div>
          )}

          {/* Car Grid Cards */}
          {!loading && !error && cars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => {
                const primaryPhoto = carPhotoUrl(car);

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
                      ? "Booking"
                      : "Terjual";

                const isSold = car.status === "terjual";

                return (
                  <article
                    key={car.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Media Thumbnail */}
                    <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {primaryPhoto ? (
                        <img
                          {...imageSources(primaryPhoto)}
                          sizes={CARD_IMAGE_SIZES}
                          alt={car.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-slate-600 text-sm">
                          🚗 Foto belum tersedia
                        </span>
                      )}
                      <span
                        className={`absolute top-3 left-3 badge ${statusBadgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="font-bold text-base text-slate-900 line-clamp-1 mb-2 hover:text-blue-800 transition-colors">
                          <Link to={`/katalog/${car.slug}`}>{car.title}</Link>
                        </h2>

                        <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 mb-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {car.year}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded capitalize">
                            {car.transmission}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {car.mileage.toLocaleString("id-ID")} km
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded capitalize">
                            {car.color}
                          </span>
                        </div>

                        <div className="car-pricing mb-2">
                          <div
                            className={`text-xl font-extrabold ${
                              isSold
                                ? "text-slate-400 line-through"
                                : "text-blue-800"
                            }`}
                          >
                            Rp {Number(car.price).toLocaleString("id-ID")}
                          </div>
                          {car.dpAmount && !isSold && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              DP mulai Rp{" "}
                              {Number(car.dpAmount).toLocaleString("id-ID")}
                            </div>
                          )}
                          {isSold && (
                            <div className="text-xs text-slate-400 mt-0.5 italic">
                              Unit sudah laku terjual
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                        <Link
                          to={`/katalog/${car.slug}`}
                          className="btn btn-outline btn-sm flex-1 text-center font-semibold"
                        >
                          Detail
                        </Link>
                        {!isSold ? (
                          <a
                            href={buildWhatsAppLink({
                              phoneNumber: waNumber,
                              showroomName,
                              context: "car",
                              params: { carTitle: car.title, price: car.price },
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-wa btn-sm font-semibold"
                          >
                            💬 Chat WA
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="btn btn-outline btn-sm opacity-50 cursor-not-allowed text-xs"
                          >
                            Terjual
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination Navigation */}
          {!loading && !error && pagination.totalPages > 1 && (
            <nav
              className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-10 max-w-full px-2"
              aria-label="Navigasi Halaman Katalog"
            >
              <button
                type="button"
                onClick={() =>
                  updateParams({ page: Math.max(1, pagination.page - 1) })
                }
                disabled={pagination.page <= 1}
                className="btn btn-outline btn-sm px-2.5 sm:px-3 text-xs sm:text-sm min-w-8 h-9 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>

              {getVisiblePagination(pagination.page, pagination.totalPages).map(
                (item, idx) => {
                  if (item === "ellipsis") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-slate-400 text-xs sm:text-sm select-none"
                      >
                        …
                      </span>
                    );
                  }

                  const pageNum = item;
                  const isActive = pageNum === pagination.page;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => updateParams({ page: pageNum })}
                      className={`btn btn-sm min-w-8 sm:min-w-9 h-9 px-2 sm:px-3 text-xs sm:text-sm font-semibold ${
                        isActive
                          ? "btn-primary shadow-xs"
                          : "btn-outline text-slate-700 hover:bg-slate-100"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}

              <button
                type="button"
                onClick={() =>
                  updateParams({
                    page: Math.min(pagination.totalPages, pagination.page + 1),
                  })
                }
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-outline btn-sm px-2.5 sm:px-3 text-xs sm:text-sm min-w-8 h-9 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
