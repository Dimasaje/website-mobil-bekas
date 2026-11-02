import { useCallback, useEffect, useState } from "react";
import {
  ApiClientError,
  apiClient,
  type AdminTestimonial,
} from "../../../lib/api";

interface TestimonialForm {
  customerName: string;
  location: string;
  carName: string;
  photoUrl: string;
  quote: string;
  rating: number;
  isDisplayed: boolean;
}

const EMPTY_FORM: TestimonialForm = {
  customerName: "",
  location: "",
  carName: "",
  photoUrl: "",
  quote: "",
  rating: 5,
  isDisplayed: true,
};

export function TestimonialsTab() {
  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [form, setForm] = useState<TestimonialForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listAdminTestimonials();
      setItems(res.data ?? []);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal memuat daftar testimoni.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof TestimonialForm>(
    key: K,
    value: TestimonialForm[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (item: AdminTestimonial) => {
    setEditingId(item.id);
    setForm({
      customerName: item.customerName,
      location: item.location ?? "",
      carName: item.carName ?? "",
      photoUrl: item.photoUrl ?? "",
      quote: item.quote,
      rating: item.rating,
      isDisplayed: item.isDisplayed,
    });
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      customerName: form.customerName.trim(),
      location: form.location.trim() || null,
      carName: form.carName.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
      quote: form.quote.trim(),
      rating: form.rating,
      isDisplayed: form.isDisplayed,
    };

    try {
      if (editingId) {
        await apiClient.updateAdminTestimonial(editingId, payload);
        setNotice("Testimoni berhasil diperbarui.");
      } else {
        await apiClient.createAdminTestimonial(payload);
        setNotice("Testimoni berhasil dibuat.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal menyimpan testimoni.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleDisplayed = async (item: AdminTestimonial) => {
    try {
      await apiClient.updateAdminTestimonial(item.id, {
        isDisplayed: !item.isDisplayed,
      });
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, isDisplayed: !row.isDisplayed } : row,
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal mengubah status tampil testimoni.",
      );
    }
  };

  const handleDelete = async (item: AdminTestimonial) => {
    if (!window.confirm(`Hapus testimoni dari "${item.customerName}"?`)) return;
    try {
      await apiClient.deleteAdminTestimonial(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      if (editingId === item.id) resetForm();
      setNotice("Testimoni dihapus.");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal menghapus testimoni.",
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
        {loading && (
          <p className="text-sm text-slate-600">Memuat testimoni...</p>
        )}

        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-500">
            Belum ada testimoni. Tambahkan testimoni pelanggan pertama.
          </p>
        )}

        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="py-3 flex items-start gap-3">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover bg-slate-100"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                  {item.customerName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-900">
                  {item.customerName}
                  <span
                    className="ml-2 text-amber-500 text-xs"
                    aria-hidden="true"
                  >
                    {"★".repeat(item.rating)}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {[item.carName, item.location].filter(Boolean).join(" · ") ||
                    "—"}
                </div>
                <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                  {item.quote}
                </p>
                <button
                  type="button"
                  onClick={() => toggleDisplayed(item)}
                  className={`mt-1 inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 cursor-pointer ${
                    item.isDisplayed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.isDisplayed ? "Tampil" : "Disembunyikan"}
                </button>
              </div>
              <div className="flex flex-col gap-1 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-blue-800 hover:underline cursor-pointer"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="text-red-700 hover:underline cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
      >
        <h2 className="font-bold text-sm text-slate-900">
          {editingId ? "Ubah Testimoni" : "Tambah Testimoni"}
        </h2>

        {notice && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5"
          >
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="testi-name"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Nama Pelanggan
          </label>
          <input
            id="testi-name"
            required
            minLength={2}
            value={form.customerName}
            onChange={(e) => update("customerName", e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="testi-car"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Mobil Dibeli
            </label>
            <input
              id="testi-car"
              value={form.carName}
              onChange={(e) => update("carName", e.target.value)}
              placeholder="Avanza 2020"
              className="form-input text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="testi-location"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Domisili
            </label>
            <input
              id="testi-location"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Jakarta Timur"
              className="form-input text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="testi-photo"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            URL Foto Pelanggan
          </label>
          <input
            id="testi-photo"
            value={form.photoUrl}
            onChange={(e) => update("photoUrl", e.target.value)}
            placeholder="https://..."
            className="form-input text-sm"
          />
          {form.photoUrl.trim() && (
            <img
              src={form.photoUrl}
              alt="Pratinjau foto pelanggan"
              className="mt-2 w-16 h-16 rounded-full object-cover bg-slate-100"
            />
          )}
        </div>

        <div>
          <label
            htmlFor="testi-quote"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Isi Testimoni
          </label>
          <textarea
            id="testi-quote"
            required
            minLength={5}
            rows={3}
            value={form.quote}
            onChange={(e) => update("quote", e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="testi-rating"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Rating
          </label>
          <select
            id="testi-rating"
            value={form.rating}
            onChange={(e) => update("rating", Number(e.target.value))}
            className="form-input text-sm"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)} ({value})
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isDisplayed}
            onChange={(e) => update("isDisplayed", e.target.checked)}
            className="accent-blue-800"
          />
          Tampilkan di website
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-sm font-bold disabled:opacity-60"
          >
            {saving
              ? "Menyimpan..."
              : editingId
                ? "Simpan Perubahan"
                : "Tambah Testimoni"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-outline btn-sm"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
