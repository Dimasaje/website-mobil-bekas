import { Link } from "react-router-dom";

export interface FooterProps {
  showroomName?: string;
  whatsappNumber?: string;
  phoneNumber?: string;
  address?: string;
  openingHours?: string;
}

export function Footer({
  showroomName = "Bintang Mobil Bekas",
  whatsappNumber = "6281298765432",
  phoneNumber = "021-87654321",
  address = "Jl. Raya Otista No. 123, Bidara Cina, Jatinegara, Jakarta Timur",
  openingHours = "Senin - Minggu: 08:30 - 18:00 WIB",
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-32 md:pb-8 mt-16 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Kolom 1: Profil Showroom */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <span>🚗</span>
              <span>{showroomName}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Showroom mobil bekas terpercaya. Jaminan unit prima, lolos
              inspeksi ketat, bebas tabrak & banjir, serta legalitas dokumen
              100% aman.
            </p>
          </div>

          {/* Kolom 2: Menu Cepat */}
          <div>
            <h2 className="text-white font-semibold text-base mb-3">
              Navigasi Utama
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/katalog"
                  className="hover:text-white transition-colors"
                >
                  Katalog Mobil Lengkap
                </Link>
              </li>
              <li>
                <Link
                  to="/simulasi-kredit"
                  className="hover:text-white transition-colors"
                >
                  Simulasi Kredit & DP
                </Link>
              </li>
              <li>
                <Link
                  to="/tukar-tambah"
                  className="hover:text-white transition-colors"
                >
                  Formulir Tukar Tambah
                </Link>
              </li>
              <li>
                <Link
                  to="/testimoni"
                  className="hover:text-white transition-colors"
                >
                  Testimoni Pelanggan
                </Link>
              </li>
              <li>
                <Link
                  to="/artikel"
                  className="hover:text-white transition-colors"
                >
                  Artikel & Tips Otomotif
                </Link>
              </li>
              <li>
                <Link
                  to="/kontak"
                  className="hover:text-white transition-colors"
                >
                  Kontak & Lokasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak & Jam Buka */}
          <div>
            <h2 className="text-white font-semibold text-base mb-3">
              Kontak Showroom
            </h2>
            <div className="space-y-2 text-sm text-slate-400">
              <p>📍 {address}</p>
              <p>🕒 {openingHours}</p>
              <p>📞 Telepon: {phoneNumber}</p>
              <p>
                💬 WhatsApp:{" "}
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:underline"
                >
                  +{whatsappNumber}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-400">
          © {currentYear} {showroomName}. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </div>
    </footer>
  );
}
