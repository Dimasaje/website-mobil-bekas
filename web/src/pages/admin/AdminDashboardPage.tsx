import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminUser } from "../../components/admin/AdminLayout";
import {
  ApiClientError,
  apiClient,
  type AdminLead,
  type CarStatus,
} from "../../lib/api";

const CAR_STATUS_CARDS: Array<{
  status: CarStatus;
  label: string;
  color: string;
}> = [
  { status: "tersedia", label: "Tersedia", color: "text-emerald-700" },
  { status: "booking", label: "Booking", color: "text-amber-700" },
  { status: "terjual", label: "Terjual", color: "text-blue-800" },
  { status: "draft", label: "Draft", color: "text-slate-600" },
  { status: "diarsipkan", label: "Diarsipkan", color: "text-slate-500" },
];

const LEAD_LABELS: Record<string, string> = {
  tukar_tambah: "Tukar Tambah",
  test_drive: "Test Drive",
  kontak: "Kontak Showroom",
  simulasi: "Simulasi Kredit",
};

export function formatRelative(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminDashboardPage() {
  const { user } = useAdminUser();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCars, setTotalCars] = useState(0);
  const [newLeads, setNewLeads] = useState(0);
  const [latestLeads, setLatestLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiClient.listAdminCars({ limit: 1 }),
      ...CAR_STATUS_CARDS.map((card) =>
        apiClient.listAdminCars({ status: card.status, limit: 1 }),
      ),
      apiClient.listAdminLeads({ status: "baru", limit: 5 }),
    ])
      .then((results) => {
        if (!active) return;

        const [all, ...rest] = results;
        const leadResult = rest[rest.length - 1] as Awaited<
          ReturnType<typeof apiClient.listAdminLeads>
        >;
        const carResults = rest.slice(0, CAR_STATUS_CARDS.length) as Array<
          Awaited<ReturnType<typeof apiClient.listAdminCars>>
        >;

        setTotalCars(all.pagination?.total ?? 0);
        setCounts(
          Object.fromEntries(
            CAR_STATUS_CARDS.map((card, index) => [
              card.status,
              carResults[index]?.pagination?.total ?? 0,
            ]),
          ),
        );
        setNewLeads(leadResult.pagination?.total ?? 0);
        setLatestLeads(leadResult.data ?? []);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Gagal memuat ringkasan dashboard.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Dashboard Admin</h1>
      <p className="text-sm text-slate-600 mb-5">
        Selamat datang kembali, {user.name}. Ringkasan operasional showroom hari
        ini.
      </p>

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2.5 mb-4"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-600 animate-pulse">
          Memuat ringkasan...
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <Link
              to="/admin/leads"
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Lead Baru
              </div>
              <div className="text-2xl font-extrabold text-amber-600">
                {newLeads}
              </div>
              <div className="text-[11px] text-slate-500">
                Belum ditindaklanjuti
              </div>
            </Link>

            {CAR_STATUS_CARDS.map((card) => (
              <Link
                key={card.status}
                to={`/admin/mobil?status=${card.status}`}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {card.label}
                </div>
                <div className={`text-2xl font-extrabold ${card.color}`}>
                  {counts[card.status] ?? 0}
                </div>
                <div className="text-[11px] text-slate-500">unit mobil</div>
              </Link>
            ))}

            <Link
              to="/admin/mobil"
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Total Inventori
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {totalCars}
              </div>
              <div className="text-[11px] text-slate-500">
                termasuk draft &amp; arsip
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <Link to="/admin/mobil/baru" className="btn btn-primary btn-sm">
              + Tambah Mobil Baru
            </Link>
            <Link to="/admin/leads" className="btn btn-outline btn-sm">
              📥 Buka {newLeads} Lead Baru
            </Link>
            <Link
              to="/admin/konten?tab=pengaturan"
              className="btn btn-outline btn-sm"
            >
              ⚙️ Ubah Pengaturan Situs
            </Link>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <h2 className="font-bold text-sm text-slate-900">
                Lead Baru Terbaru
              </h2>
              <Link
                to="/admin/leads"
                className="text-xs font-semibold text-blue-800 hover:underline"
              >
                Lihat semua
              </Link>
            </div>

            {latestLeads.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                Tidak ada lead baru. Semua permintaan sudah ditindaklanjuti.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left font-semibold px-4 py-2">
                        Nama
                      </th>
                      <th className="text-left font-semibold px-4 py-2">
                        Tipe
                      </th>
                      <th className="text-left font-semibold px-4 py-2">
                        Masuk
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/admin/leads?lead=${lead.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-800"
                          >
                            {lead.name}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {lead.phone}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {LEAD_LABELS[lead.type] ?? lead.type}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                          {formatRelative(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
