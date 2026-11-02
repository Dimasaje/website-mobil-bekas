import { Link } from "react-router-dom";
import { useAdminUser } from "../../components/admin/AdminLayout";

export function AdminDashboardPage() {
  const { user } = useAdminUser();

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Dashboard Admin</h1>
      <p className="text-sm text-slate-600 mb-6">
        Selamat datang kembali, {user.name}. Kelola stok mobil, lead, dan konten
        showroom dari sini.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/admin/mobil"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2" aria-hidden="true">
            🚗
          </div>
          <div className="font-bold text-sm">Kelola Stok Mobil</div>
          <p className="text-xs text-slate-500 mt-1">
            Tambah, ubah, dan atur status unit.
          </p>
        </Link>

        <Link
          to="/admin/leads"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2" aria-hidden="true">
            📥
          </div>
          <div className="font-bold text-sm">Leads & Prospek</div>
          <p className="text-xs text-slate-500 mt-1">
            Tindak lanjuti pengajuan tukar tambah, test drive, dan kontak.
          </p>
        </Link>

        <Link
          to="/admin/konten"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2" aria-hidden="true">
            ⚙️
          </div>
          <div className="font-bold text-sm">Konten & Pengaturan</div>
          <p className="text-xs text-slate-500 mt-1">
            Artikel, promo, testimoni, dan nomor WhatsApp showroom.
          </p>
        </Link>
      </div>

      <p className="text-xs text-slate-500 mt-6">
        Ringkasan statistik operasional akan tampil di sini pada tiket lanjutan.
      </p>
    </div>
  );
}
