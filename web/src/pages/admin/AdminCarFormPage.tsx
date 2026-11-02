import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ApiClientError,
  apiClient,
  type AdminCarPhoto,
  type AdminCarInput,
  type CarStatus,
} from "../../lib/api";

const STATUS_OPTIONS: CarStatus[] = [
  "draft",
  "tersedia",
  "booking",
  "terjual",
  "diarsipkan",
];

export interface FormState {
  brandId: string;
  title: string;
  slug: string;
  model: string;
  year: string;
  price: string;
  transmission: "manual" | "matic";
  mileage: string;
  fuelType: "bensin" | "diesel" | "hybrid" | "listrik";
  engineCapacity: string;
  color: string;
  licensePlate: string;
  stnkValidUntil: string;
  description: string;
  features: string;
  status: CarStatus;
  isFeatured: boolean;
}

const EMPTY_FORM: FormState = {
  brandId: "",
  title: "",
  slug: "",
  model: "",
  year: String(new Date().getFullYear()),
  price: "",
  transmission: "manual",
  mileage: "",
  fuelType: "bensin",
  engineCapacity: "",
  color: "",
  licensePlate: "",
  stnkValidUntil: "",
  description: "",
  features: "",
  status: "tersedia",
  isFeatured: false,
};

export function parseFeatures(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((f) => f.trim())
    .filter(Boolean);
}

export function buildCarPayload(form: FormState): AdminCarInput {
  const optional = (value: string) => (value.trim() ? value.trim() : null);
  const optionalNumber = (value: string) =>
    value.trim() ? Number(value) : null;

  return {
    brandId: form.brandId,
    title: form.title.trim(),
    slug: optional(form.slug) ?? undefined,
    model: form.model.trim(),
    year: Number(form.year),
    price: Number(form.price),
    transmission: form.transmission,
    mileage: Number(form.mileage),
    fuelType: form.fuelType,
    engineCapacity: optionalNumber(form.engineCapacity),
    color: optional(form.color),
    licensePlate: optional(form.licensePlate),
    stnkValidUntil: optional(form.stnkValidUntil),
    description: optional(form.description),
    features: parseFeatures(form.features),
    status: form.status,
    isFeatured: form.isFeatured,
  };
}

export function movePhoto(
  photos: AdminCarPhoto[],
  index: number,
  direction: -1 | 1,
): AdminCarPhoto[] {
  const target = index + direction;
  if (target < 0 || target >= photos.length) return photos;
  const next = [...photos];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((photo, i) => ({ ...photo, order: i }));
}

export function AdminCarFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [photos, setPhotos] = useState<AdminCarPhoto[]>([]);
  const [savedId, setSavedId] = useState<string | null>(id ?? null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getCarFilters()
      .then((res) => setBrands(res.data?.brands ?? []))
      .catch(() => setBrands([]));
  }, []);

  const loadCar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAdminCar(id);
      const car = res.data;
      if (!car) throw new Error("Data mobil tidak ditemukan");

      setForm({
        brandId: car.brandId,
        title: car.title,
        slug: car.slug,
        model: car.model,
        year: String(car.year),
        price: String(car.price),
        transmission: car.transmission,
        mileage: String(car.mileage),
        fuelType: car.fuelType,
        engineCapacity: car.engineCapacity ? String(car.engineCapacity) : "",
        color: car.color ?? "",
        licensePlate: car.licensePlate ?? "",
        stnkValidUntil: car.stnkValidUntil
          ? car.stnkValidUntil.slice(0, 10)
          : "",
        description: car.description ?? "",
        features: (car.features ?? []).join(", "),
        status: car.status,
        isFeatured: car.isFeatured,
      });
      setPhotos(car.photos ?? []);
      setSavedId(car.id);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Gagal memuat data mobil.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCar();
  }, [loadCar]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const payload = buildCarPayload(form);

      if (savedId) {
        await apiClient.updateAdminCar(savedId, payload);
        setNotice("Perubahan unit berhasil disimpan.");
      } else {
        const res = await apiClient.createAdminCar(payload);
        const newId = res.data?.id;
        if (!newId) throw new Error("Server tidak mengembalikan ID mobil baru");
        setSavedId(newId);
        setNotice("Unit baru berhasil dibuat. Silakan tambahkan foto.");
        navigate(`/admin/mobil/${newId}`, { replace: true });
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Gagal menyimpan unit.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!savedId || !files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await apiClient.uploadCarPhotos(savedId, Array.from(files));
      const res = await apiClient.getAdminCar(savedId);
      setPhotos(res.data?.photos ?? []);
      setNotice("Foto berhasil diunggah.");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Gagal mengunggah foto.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    if (!savedId) return;
    const next = movePhoto(photos, index, direction);
    if (next === photos) return;

    setPhotos(next);
    setPhotoBusy(true);
    try {
      await apiClient.reorderCarPhotos(
        savedId,
        next.map((p) => ({ id: p.id, order: p.order })),
      );
    } catch (err) {
      setPhotos(photos);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal mengubah urutan foto.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!savedId) return;
    setPhotoBusy(true);
    try {
      await apiClient.setPrimaryCarPhoto(savedId, photoId);
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, isPrimary: p.id === photoId })),
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal menetapkan foto utama.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!savedId || !window.confirm("Hapus foto ini?")) return;
    setPhotoBusy(true);
    try {
      await apiClient.deleteCarPhoto(savedId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Gagal menghapus foto.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-600 animate-pulse">
        Memuat data mobil...
      </p>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <Link
          to="/admin/mobil"
          className="text-sm text-blue-800 hover:underline"
        >
          ← Kembali ke Daftar Stok
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold mt-2">
          {isEdit ? "Ubah Unit Mobil" : "Tambah Unit Mobil"}
        </h1>
      </div>

      {notice && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-lg px-3 py-2.5 mb-4"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2.5 mb-4"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <h2 className="font-bold text-sm text-slate-900 mb-3">
            1. Spesifikasi Dasar Kendaraan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="brandId"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Merek <span className="text-red-600">*</span>
              </label>
              <select
                id="brandId"
                required
                value={form.brandId}
                onChange={(e) => update("brandId", e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Pilih merek</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Model <span className="text-red-600">*</span>
              </label>
              <input
                id="model"
                required
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder="Innova Zenix"
                className="form-input text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="title"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Judul Unit <span className="text-red-600">*</span>
              </label>
              <input
                id="title"
                required
                minLength={3}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Toyota Innova Zenix 2.0 G CVT 2023"
                className="form-input text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="year"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tahun <span className="text-red-600">*</span>
              </label>
              <input
                id="year"
                type="number"
                required
                min={1990}
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                className="form-input text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="mileage"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Jarak Tempuh (km) <span className="text-red-600">*</span>
              </label>
              <input
                id="mileage"
                type="number"
                required
                min={0}
                value={form.mileage}
                onChange={(e) => update("mileage", e.target.value)}
                className="form-input text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="transmission"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Transmisi <span className="text-red-600">*</span>
              </label>
              <select
                id="transmission"
                value={form.transmission}
                onChange={(e) =>
                  update(
                    "transmission",
                    e.target.value as FormState["transmission"],
                  )
                }
                className="form-input text-sm"
              >
                <option value="manual">Manual</option>
                <option value="matic">Matic</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fuelType"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Bahan Bakar
              </label>
              <select
                id="fuelType"
                value={form.fuelType}
                onChange={(e) =>
                  update("fuelType", e.target.value as FormState["fuelType"])
                }
                className="form-input text-sm"
              >
                <option value="bensin">Bensin</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="listrik">Listrik</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="engineCapacity"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Kapasitas Mesin (cc)
              </label>
              <input
                id="engineCapacity"
                type="number"
                min={1}
                value={form.engineCapacity}
                onChange={(e) => update("engineCapacity", e.target.value)}
                placeholder="2000"
                className="form-input text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="color"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Warna
              </label>
              <input
                id="color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                placeholder="Putih Pearl"
                className="form-input text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="licensePlate"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Plat Nomor
              </label>
              <input
                id="licensePlate"
                value={form.licensePlate}
                onChange={(e) => update("licensePlate", e.target.value)}
                placeholder="B 1234 XYZ"
                className="form-input text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="stnkValidUntil"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                STNK Berlaku Sampai
              </label>
              <input
                id="stnkValidUntil"
                type="date"
                value={form.stnkValidUntil}
                onChange={(e) => update("stnkValidUntil", e.target.value)}
                className="form-input text-sm"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <h2 className="font-bold text-sm text-slate-900 mb-3">
            2. Harga &amp; Status Publikasi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="price"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Harga Cash OTR (Rp) <span className="text-red-600">*</span>
              </label>
              <input
                id="price"
                type="number"
                required
                min={1}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="180000000"
                className="form-input text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Status Unit
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => update("status", e.target.value as CarStatus)}
                className="form-input text-sm"
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => update("isFeatured", e.target.checked)}
                  className="accent-blue-800"
                />
                Tandai sebagai unit unggulan (tampil di beranda)
              </label>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <h2 className="font-bold text-sm text-slate-900 mb-3">
            3. Foto Kendaraan
          </h2>

          {!savedId && (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
              Simpan unit terlebih dahulu untuk mengunggah foto.
            </p>
          )}

          {savedId && (
            <>
              <label
                htmlFor="photo-upload"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Unggah Foto (bisa pilih beberapa)
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
                className="block w-full text-sm text-slate-700 border border-slate-300 rounded-lg px-3 py-2 bg-white file:mr-3 file:rounded-md file:border-0 file:bg-blue-800 file:text-white file:text-xs file:px-3 file:py-1.5 cursor-pointer disabled:opacity-60"
              />
              {uploading && (
                <p className="text-xs text-slate-600 mt-2">
                  Mengunggah foto...
                </p>
              )}

              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {photos.map((photo, index) => (
                  <li
                    key={photo.id}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                  >
                    <img
                      src={photo.url}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-2 space-y-1.5">
                      {photo.isPrimary ? (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5">
                          Foto Utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={photoBusy}
                          onClick={() => handleSetPrimary(photo.id)}
                          className="text-[11px] font-semibold text-blue-800 hover:underline disabled:opacity-60"
                        >
                          Jadikan utama
                        </button>
                      )}
                      <div className="flex items-center gap-2 text-[11px] font-semibold">
                        <button
                          type="button"
                          disabled={photoBusy || index === 0}
                          onClick={() => handleReorder(index, -1)}
                          aria-label={`Naikkan foto ${index + 1}`}
                          className="text-slate-700 hover:text-blue-800 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={photoBusy || index === photos.length - 1}
                          onClick={() => handleReorder(index, 1)}
                          aria-label={`Turunkan foto ${index + 1}`}
                          className="text-slate-700 hover:text-blue-800 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={photoBusy}
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="ml-auto text-red-700 hover:underline disabled:opacity-60"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {photos.length === 0 && !uploading && (
                <p className="text-xs text-slate-500 mt-3">
                  Belum ada foto. Unit tanpa foto kurang menarik bagi pembeli.
                </p>
              )}
            </>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <h2 className="font-bold text-sm text-slate-900 mb-3">
            4. Deskripsi &amp; Fitur
          </h2>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Deskripsi
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Kondisi mesin, riwayat servis, kelengkapan dokumen..."
                className="form-input text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="features"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Fitur (pisahkan dengan koma)
              </label>
              <input
                id="features"
                value={form.features}
                onChange={(e) => update("features", e.target.value)}
                placeholder="AC, Power Window, Kamera Mundur, Cruise Control"
                className="form-input text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary font-bold disabled:opacity-60"
          >
            {saving
              ? "Menyimpan..."
              : isEdit
                ? "Simpan Perubahan"
                : "Simpan Unit"}
          </button>
          <Link to="/admin/mobil" className="btn btn-outline">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
