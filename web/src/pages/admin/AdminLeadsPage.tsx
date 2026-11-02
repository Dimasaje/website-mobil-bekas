import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ApiClientError,
  apiClient,
  type AdminLead,
  type LeadStatus,
  type LeadType,
} from "../../lib/api";

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  tukar_tambah: "Tukar Tambah",
  test_drive: "Test Drive",
  kontak: "Kontak Showroom",
  simulasi: "Simulasi Kredit",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  baru: "Baru",
  dihubungi: "Dihubungi",
  selesai: "Selesai",
};

const STATUS_CLASSES: Record<LeadStatus, string> = {
  baru: "bg-amber-100 text-amber-900",
  dihubungi: "bg-blue-100 text-blue-800",
  selesai: "bg-emerald-100 text-emerald-800",
};

const DATA_LABELS: Record<string, string> = {
  subType: "Jenis pengajuan",
  oldCar: "Mobil lama",
  targetCar: "Mobil dituju",
  preferredDate: "Tanggal test drive",
  preferredTime: "Waktu test drive",
  carTitle: "Unit",
  brand: "Merek",
  model: "Model",
  year: "Tahun",
  transmission: "Transmisi",
  mileage: "Jarak tempuh",
  expectedPrice: "Harapan harga",
};

export function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function humanize(key: string): string {
  return DATA_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}

export function flattenLeadData(
  data: Record<string, unknown> | null | undefined,
): Array<{ label: string; value: string }> {
  if (!data) return [];

  const rows: Array<{ label: string; value: string }> = [];

  for (const [key, raw] of Object.entries(data)) {
    if (raw === null || raw === "" || raw === undefined) continue;

    if (typeof raw === "object" && !Array.isArray(raw)) {
      for (const [childKey, childValue] of Object.entries(
        raw as Record<string, unknown>,
      )) {
        if (
          childValue === null ||
          childValue === "" ||
          childValue === undefined
        )
          continue;
        rows.push({
          label: `${humanize(key)} — ${humanize(childKey)}`,
          value: String(childValue),
        });
      }
      continue;
    }

    rows.push({ label: humanize(key), value: String(raw) });
  }

  return rows;
}

export function formatLeadDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminLeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("lead");

  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [detail, setDetail] = useState<AdminLead | null>(null);
  const [type, setType] = useState<LeadType | "">("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draftStatus, setDraftStatus] = useState<LeadStatus>("baru");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.listAdminLeads({
        page,
        limit: 20,
        type: type || undefined,
        status: status || undefined,
      });
      setLeads(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(Math.max(1, res.pagination?.totalPages ?? 1));
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal memuat daftar lead. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, type, status]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;
    apiClient
      .getAdminLead(selectedId)
      .then((res) => {
        if (!active || !res.data) return;
        setDetail(res.data);
        setDraftStatus(res.data.status);
        setDraftNotes(res.data.notes ?? "");
        setNotice(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Gagal memuat detail lead.",
        );
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.updateAdminLead(detail.id, {
        status: draftStatus,
        notes: draftNotes.trim() ? draftNotes.trim() : null,
      });
      if (res.data) setDetail({ ...detail, ...res.data });
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === detail.id ? { ...lead, status: draftStatus } : lead,
        ),
      );
      setNotice("Perubahan lead tersimpan.");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Gagal menyimpan lead.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectLead = (id: string) => {
    setSearchParams({ lead: id }, { replace: true });
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold">
          Daftar Lead Masuk ({total})
        </h1>
        <p className="text-sm text-slate-600">
          Semua formulir dan klik konversi yang dikirimkan calon pembeli lewat
          website.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadLeads}
            className="btn btn-outline btn-sm bg-white"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <div>
              <label htmlFor="lead-type" className="sr-only">
                Filter tipe minat
              </label>
              <select
                id="lead-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as LeadType | "");
                  setPage(1);
                }}
                className="form-input text-sm"
              >
                <option value="">Semua Tipe Minat</option>
                {(Object.keys(LEAD_TYPE_LABELS) as LeadType[]).map((value) => (
                  <option key={value} value={value}>
                    {LEAD_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-status" className="sr-only">
                Filter status
              </label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as LeadStatus | "");
                  setPage(1);
                }}
                className="form-input text-sm"
              >
                <option value="">Semua Status</option>
                {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {LEAD_STATUS_LABELS[value]}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-3 py-2.5">
                    Tanggal
                  </th>
                  <th className="text-left font-semibold px-3 py-2.5">Nama</th>
                  <th className="text-left font-semibold px-3 py-2.5">Tipe</th>
                  <th className="text-left font-semibold px-3 py-2.5">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      Memuat daftar lead...
                    </td>
                  </tr>
                )}

                {!loading && leads.length === 0 && !error && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      Belum ada lead untuk filter ini.
                    </td>
                  </tr>
                )}

                {!loading &&
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => selectLead(lead.id)}
                      className={`border-t border-slate-100 cursor-pointer align-top ${
                        lead.id === selectedId
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-slate-600">
                        {formatLeadDate(lead.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900">
                          {lead.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lead.phone}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {LEAD_TYPE_LABELS[lead.type] ?? lead.type}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                            STATUS_CLASSES[lead.status]
                          }`}
                        >
                          {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 mt-3 text-sm">
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

        <aside className="bg-white border border-slate-200 rounded-xl p-4 lg:sticky lg:top-4">
          {!detail && (
            <p className="text-sm text-slate-500">
              Pilih salah satu lead di tabel untuk melihat detail dan
              menindaklanjutinya.
            </p>
          )}

          {detail && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  {detail.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Masuk: {formatLeadDate(detail.createdAt)} ·{" "}
                  {LEAD_TYPE_LABELS[detail.type] ?? detail.type}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={`https://wa.me/${toWaNumber(detail.phone)}?text=${encodeURIComponent(
                    `Halo ${detail.name}, saya dari showroom terkait permintaan Anda (${LEAD_TYPE_LABELS[detail.type] ?? detail.type}).`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-wa"
                >
                  💬 Hubungi via WhatsApp
                </a>
                <a href={`tel:${detail.phone}`} className="btn btn-outline">
                  📞 Panggil Telepon Langsung
                </a>
              </div>

              {detail.car && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Unit Kendaraan Dituju
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm">
                    <div className="font-semibold text-slate-900">
                      {detail.car.title}
                    </div>
                    <div className="text-xs text-slate-600">
                      Rp {Number(detail.car.price).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              )}

              {flattenLeadData(detail.data).length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Rincian Permintaan
                  </div>
                  <dl className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                    {flattenLeadData(detail.data).map((row) => (
                      <div key={row.label} className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">
                          {row.label}:
                        </dt>
                        <dd className="text-slate-900 break-words">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div>
                <label
                  htmlFor="lead-detail-status"
                  className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1"
                >
                  Ubah Status Penanganan
                </label>
                <select
                  id="lead-detail-status"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as LeadStatus)}
                  className="form-input text-sm"
                >
                  {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map(
                    (value) => (
                      <option key={value} value={value}>
                        {LEAD_STATUS_LABELS[value]}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="lead-notes"
                  className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1"
                >
                  Catatan Sales / Admin
                </label>
                <textarea
                  id="lead-notes"
                  rows={3}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Tulis perkembangan follow-up konsumen di sini..."
                  className="form-input text-sm"
                />
              </div>

              {notice && (
                <p
                  role="status"
                  className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5"
                >
                  {notice}
                </p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary w-full font-bold disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan Lead"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
