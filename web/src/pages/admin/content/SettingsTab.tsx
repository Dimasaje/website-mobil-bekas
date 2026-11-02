import { useEffect, useState } from "react";
import {
  ApiClientError,
  apiClient,
  type AdminSiteSettings,
} from "../../../lib/api";

const EMPTY: AdminSiteSettings = {
  id: "default",
  showroomName: "",
  whatsappNumber: "",
  phoneNumber: "",
  address: "",
  mapsUrl: "",
  openingHours: "",
  heroTitle: "",
  heroSubtitle: "",
  defaultInterestRate: "8.50",
  minDownPaymentPercent: "20.00",
  updatedAt: "",
};

export function SettingsTab() {
  const [form, setForm] = useState<AdminSiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getAdminSettings()
      .then((res) => {
        if (res.data) setForm({ ...EMPTY, ...res.data });
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Gagal memuat pengaturan situs.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof AdminSiteSettings>(
    key: K,
    value: AdminSiteSettings[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const res = await apiClient.updateAdminSettings({
        showroomName: form.showroomName.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        phoneNumber: form.phoneNumber?.trim() || null,
        address: form.address.trim(),
        mapsUrl: form.mapsUrl?.trim() || null,
        openingHours: form.openingHours?.trim() || null,
        heroTitle: form.heroTitle?.trim() || null,
        heroSubtitle: form.heroSubtitle?.trim() || null,
        defaultInterestRate: form.defaultInterestRate.trim(),
        minDownPaymentPercent: form.minDownPaymentPercent.trim(),
      });
      if (res.data) setForm({ ...EMPTY, ...res.data });
      setNotice("Pengaturan situs berhasil disimpan.");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal menyimpan pengaturan situs.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-600 animate-pulse">
        Memuat pengaturan...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {notice && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-lg px-3 py-2.5"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2.5"
        >
          {error}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <h2 className="font-bold text-sm text-slate-900 mb-3">
          1. Kontak Utama &amp; WhatsApp Sales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="showroomName"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nama Showroom / Dealer
            </label>
            <input
              id="showroomName"
              required
              minLength={2}
              value={form.showroomName}
              onChange={(e) => update("showroomName", e.target.value)}
              className="form-input text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="whatsappNumber"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nomor WhatsApp Utama
            </label>
            <input
              id="whatsappNumber"
              required
              minLength={8}
              value={form.whatsappNumber}
              onChange={(e) => update("whatsappNumber", e.target.value)}
              className="form-input text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Format internasional tanpa tanda + (contoh: 6281298765432)
            </p>
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nomor Telepon Kantor
            </label>
            <input
              id="phoneNumber"
              value={form.phoneNumber ?? ""}
              onChange={(e) => update("phoneNumber", e.target.value)}
              placeholder="(021) 8590-1234"
              className="form-input text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="openingHours"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Jam Operasional
            </label>
            <input
              id="openingHours"
              value={form.openingHours ?? ""}
              onChange={(e) => update("openingHours", e.target.value)}
              placeholder="Senin - Minggu: 08:30 - 18:00"
              className="form-input text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="address"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Alamat Lengkap Showroom
            </label>
            <input
              id="address"
              required
              minLength={5}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="form-input text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="mapsUrl"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Tautan Google Maps
            </label>
            <input
              id="mapsUrl"
              value={form.mapsUrl ?? ""}
              onChange={(e) => update("mapsUrl", e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="form-input text-sm"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <h2 className="font-bold text-sm text-slate-900 mb-3">
          2. Teks Hero Beranda
        </h2>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="heroTitle"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Judul Hero
            </label>
            <input
              id="heroTitle"
              value={form.heroTitle ?? ""}
              onChange={(e) => update("heroTitle", e.target.value)}
              className="form-input text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="heroSubtitle"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Subjudul Hero
            </label>
            <textarea
              id="heroSubtitle"
              rows={2}
              value={form.heroSubtitle ?? ""}
              onChange={(e) => update("heroSubtitle", e.target.value)}
              className="form-input text-sm"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <h2 className="font-bold text-sm text-slate-900 mb-3">
          3. Parameter Standar Kalkulator Kredit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="minDownPaymentPercent"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              DP Minimum Default (%)
            </label>
            <input
              id="minDownPaymentPercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              required
              value={form.minDownPaymentPercent}
              onChange={(e) => update("minDownPaymentPercent", e.target.value)}
              className="form-input text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="defaultInterestRate"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Suku Bunga Per Tahun (%)
            </label>
            <input
              id="defaultInterestRate"
              type="number"
              min={0}
              step="0.01"
              required
              value={form.defaultInterestRate}
              onChange={(e) => update("defaultInterestRate", e.target.value)}
              className="form-input text-sm"
            />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="btn btn-primary font-bold disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : "Simpan Perubahan Pengaturan"}
      </button>
    </form>
  );
}
