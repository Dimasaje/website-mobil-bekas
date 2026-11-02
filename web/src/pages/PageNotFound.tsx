import { Link } from "react-router-dom";

export function PageNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <span className="text-6xl mb-4 block">🔍</span>
        <h1 className="text-3xl font-extrabold text-blue-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Mohon maaf, halaman yang Anda tuju mungkin sudah dipindahkan, dihapus,
          atau tautan yang Anda masukkan salah.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-primary btn-sm">
            Kembali ke Beranda
          </Link>
          <Link to="/katalog" className="btn btn-outline btn-sm">
            Lihat Stok Mobil
          </Link>
        </div>
      </div>
    </div>
  );
}
