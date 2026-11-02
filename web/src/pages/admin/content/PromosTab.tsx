import { useCallback, useEffect, useState } from "react";
import { ApiClientError, apiClient, type AdminPromo } from "../../../lib/api";

interface PromoForm {
  title: string;
  description: string;
  bannerUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const EMPTY_FORM: PromoForm = {
  title: "",
  description: "",
  bannerUrl: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export function PromosTab() {
  const [promos, setPromos] = useState<AdminPromo[]>([]);
  const [form, setForm] = useState<PromoForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listAdminPromos();
      setPromos(res.data ?? []);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal memuat daftar promo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof PromoForm>(key: K, value: PromoForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (promo: AdminPromo) => {
    setEditingId(promo.id);
    setForm({
      title: promo.title,
      description: promo.description ?? "",
      bannerUrl: promo.bannerUrl ?? "",
      startDate: promo.startDate ? promo.startDate.slice(0, 10) : "",
      endDate: promo.endDate ? promo.endDate.slice(0, 10) : "",
      isActive: promo.isActive,
    });
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      bannerUrl: form.bannerUrl.trim() || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await apiClient.updateAdminPromo(editingId, payload);
        setNotice("Promo berhasil diperbarui.");
      } else {
        await apiClient.createAdminPromo(payload);
        setNotice("Promo berhasil dibuat.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Gagal menyimpan promo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: AdminPromo) => {
    try {
      await apiClient.updateAdminPromo(promo.id, {
        isActive: !promo.isActive,
      });
      setPromos((prev) =>
        prev.map((p) =>
          p.id === promo.id ? { ...p, isActive: !p.isActive } : p,
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal mengubah status promo.",
      );
    }
  };

  const handleDelete = async (promo: AdminPromo) => {
    if (!window.confirm(`Hapus promo "${promo.title}"?`)) return;
    try {
      await apiClient.deleteAdminPromo(promo.id);
      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
      if (editingId === promo.id) resetForm();
      setNotice("Promo dihapus.");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Gagal menghapus promo.",
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
        {loading && <p className="text-sm text-slate-600">Memuat promo...</p>}

        {!loading && promos.length === 0 && (
          <p className="text-sm text-slate-500">
            Belum ada promo. Tambahkan promo pertama lewat formulir di samping.
          </p>
        )}

        <ul className="divide-y divide-slate-100">
          {promos.map((promo) => (
            <li key={promo.id} className="py-3 flex items-start gap-3">
              {promo.bannerUrl ? (
                <img
                  src={promo.bannerUrl}
                  alt=""
                  className="w-20 h-14 object-cover rounded-md bg-slate-100"
                  loading="lazy"
                />
              ) : (
                <div className="w-20 h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  —
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-900 truncate">
                  {promo.title}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {promo.startDate
                    ? promo.startDate.slice(0, 10)
                    : "tanpa tanggal"}{" "}
                  – {promo.endDate ? promo.endDate.slice(0, 10) : "seterusnya"}
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(promo)}
                  className={`mt-1 inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 cursor-pointer ${
                    promo.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {promo.isActive ? "Aktif" : "Nonaktif"}
                </button>
              </div>
              <div className="flex flex-col gap-1 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(promo)}
                  className="text-blue-800 hover:underline cursor-pointer"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(promo)}
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
          {editingId ? "Ubah Promo" : "Tambah Promo"}
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
            htmlFor="promo-title"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Judul Promo
          </label>
          <input
            id="promo-title"
            required
            minLength={3}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="promo-desc"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Deskripsi
          </label>
          <textarea
            id="promo-desc"
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="promo-banner"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            URL Banner
          </label>
          <input
            id="promo-banner"
            value={form.bannerUrl}
            onChange={(e) => update("bannerUrl", e.target.value)}
            placeholder="https://..."
            className="form-input text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="promo-start"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Mulai
            </label>
            <input
              id="promo-start"
              type="date"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="form-input text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="promo-end"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Selesai
            </label>
            <input
              id="promo-end"
              type="date"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className="form-input text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="accent-blue-800"
          />
          Tampilkan promo di website
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
                : "Tambah Promo"}
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
