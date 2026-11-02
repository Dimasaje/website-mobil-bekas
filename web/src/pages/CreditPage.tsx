import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLayoutSettings } from "../components/layout/Layout";
import { buildWhatsAppLink } from "../lib/whatsapp";

/**
 * Rumus Kredit Mobil Bekas (Metode Bunga Flat Standar Pembiayaan):
 * 1. Pokok Hutang = Harga Mobil - DP
 * 2. Total Bunga = Pokok Hutang * (Bunga Tahunan / 100) * (Tenor Bulan / 12)
 * 3. Total Pinjaman = Pokok Hutang + Total Bunga
 * 4. Cicilan per Bulan = Total Pinjaman / Tenor Bulan
 */
export function calculateCredit({
  price,
  dpAmount,
  tenorMonths,
  annualInterestRate,
}: {
  price: number;
  dpAmount: number;
  tenorMonths: number;
  annualInterestRate: number;
}) {
  const validPrice = Math.max(0, price);
  const validDp = Math.min(validPrice, Math.max(0, dpAmount));
  const principalLoan = Math.max(0, validPrice - validDp);

  if (principalLoan === 0 || tenorMonths <= 0) {
    return {
      principalLoan: 0,
      totalInterest: 0,
      totalLoan: 0,
      monthlyInstallment: 0,
    };
  }

  const tenorYears = tenorMonths / 12;
  const totalInterest = Math.round(
    principalLoan * (annualInterestRate / 100) * tenorYears,
  );
  const totalLoan = principalLoan + totalInterest;
  const monthlyInstallment = Math.round(totalLoan / tenorMonths);

  return {
    principalLoan,
    totalInterest,
    totalLoan,
    monthlyInstallment,
  };
}

export function resolveDefaultDpPercent(
  value?: number | string | null,
  fallback = 20,
): number {
  const pct = Number(value);
  return Number.isFinite(pct) && pct > 0 ? pct : fallback;
}

export function CreditPage() {
  const [searchParams] = useSearchParams();
  const { settings: layoutSettings } = useLayoutSettings();

  // Read URL query params (if opened from car detail)
  const initialCarName = searchParams.get("car") || "";
  const initialPriceParam = Number(searchParams.get("price")) || 180000000;

  // Defaults from site settings
  const defaultRate = layoutSettings?.defaultInterestRate
    ? Number(layoutSettings.defaultInterestRate)
    : 8.5;

  const defaultDpPercent = resolveDefaultDpPercent(
    layoutSettings?.minDownPaymentPercent,
  );

  // Form states
  const [carName, setCarName] = useState(initialCarName);
  const [price, setPrice] = useState(initialPriceParam);
  const [dpPercent, setDpPercent] = useState(defaultDpPercent);
  const [dpAmount, setDpAmount] = useState(
    Math.round((initialPriceParam * defaultDpPercent) / 100),
  );
  const [dpTouched, setDpTouched] = useState(false);
  const [tenorMonths, setTenorMonths] = useState(48); // 4 years default
  const [interestRate, setInterestRate] = useState(defaultRate);

  // Sync settings once loaded if no query params provided
  useEffect(() => {
    if (layoutSettings?.defaultInterestRate) {
      setInterestRate(Number(layoutSettings.defaultInterestRate));
    }
  }, [layoutSettings?.defaultInterestRate]);

  // Sync default DP from site settings after settings load,
  // unless the user already picked a DP manually.
  useEffect(() => {
    if (dpTouched || !layoutSettings?.minDownPaymentPercent) return;
    const pct = resolveDefaultDpPercent(layoutSettings.minDownPaymentPercent);
    setDpPercent(pct);
    setDpAmount(Math.round((price * pct) / 100));
  }, [layoutSettings?.minDownPaymentPercent, dpTouched, price]);

  // When price changes, recalculate DP based on percent
  const handlePriceChange = (newPrice: number) => {
    const p = Math.max(0, newPrice);
    setPrice(p);
    setDpAmount(Math.round((p * dpPercent) / 100));
  };

  // When DP Amount manually changed
  const handleDpAmountChange = (newDp: number) => {
    setDpTouched(true);
    const validDp = Math.max(0, newDp);
    setDpAmount(validDp);
    if (price > 0) {
      const pct = Math.round((validDp / price) * 100);
      setDpPercent(pct);
    }
  };

  // When DP Percent preset clicked
  const handleDpPercentSelect = (pct: number) => {
    setDpTouched(true);
    setDpPercent(pct);
    setDpAmount(Math.round((price * pct) / 100));
  };

  // Calculation output
  const calculation = calculateCredit({
    price,
    dpAmount,
    tenorMonths,
    annualInterestRate: interestRate,
  });

  const showroomName = layoutSettings?.showroomName || "Bintang Mobil";
  const waNumber = layoutSettings?.whatsappNumber || "6281298765432";

  // Build WhatsApp Link
  const waMessage = `Halo ${showroomName}, saya sudah menghitung simulasi kredit${
    carName ? ` untuk ${carName}` : ""
  }:
- Harga Kendaraan: Rp ${price.toLocaleString("id-ID")}
- Uang Muka (DP ${dpPercent}%): Rp ${dpAmount.toLocaleString("id-ID")}
- Pokok Pinjaman: Rp ${calculation.principalLoan.toLocaleString("id-ID")}
- Pilihan Tenor: ${tenorMonths} Bulan (${tenorMonths / 12} Tahun)
- Estimasi Cicilan: Rp ${calculation.monthlyInstallment.toLocaleString("id-ID")}/bulan

Bisa dibantu informasi syarat berkas dan proses survei leasing-nya? Terima kasih.`;

  const waLink = buildWhatsAppLink({
    phoneNumber: waNumber,
    showroomName,
    context: "general",
    params: {
      customMessage: waMessage,
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-blue-800 transition-colors">
          Beranda
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-900">
          Kalkulator Simulasi Kredit
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          Kalkulator Simulasi Kredit Mobil Bekas
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Rencanakan pembiayaan kendaraan impian Anda dengan cicilan ringan,
          uang muka fleksibel, dan estimasi bunga transparan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Form Input Kalkulator (7 Kolom) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Parameter Pembiayaan
            </h2>
            <p className="text-xs text-slate-500">
              Sesuaikan harga, nominal DP, dan tenor sesuai kemampuan Anda.
            </p>
          </div>

          {/* Unit Mobil (Opsional) */}
          {carName && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit Kendaraan Pilihan
              </label>
              <input
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                className="form-input text-sm h-11 bg-slate-50 font-semibold"
                placeholder="Nama atau tipe mobil..."
              />
            </div>
          )}

          {/* 1. Harga Mobil (OTR) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="input-price"
                className="text-xs font-bold text-slate-700"
              >
                Harga Mobil (Rp)
              </label>
              <span className="text-xs font-semibold text-blue-800">
                Rp {price.toLocaleString("id-ID")}
              </span>
            </div>
            <input
              id="input-price"
              type="number"
              value={price || ""}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="form-input text-sm h-11"
              step="5000000"
              min="20000000"
            />
            {/* Quick Price Buttons */}
            <div className="flex gap-2 mt-2 flex-wrap text-xs">
              {[120000000, 180000000, 250000000, 350000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePriceChange(val)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Rp {(val / 1000000).toFixed(0)} Jt
                </button>
              ))}
            </div>
          </div>

          {/* 2. Uang Muka (DP) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="input-dp"
                className="text-xs font-bold text-slate-700"
              >
                Uang Muka / DP ({dpPercent}%)
              </label>
              <span className="text-xs font-semibold text-blue-800">
                Rp {dpAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <input
              id="input-dp"
              type="number"
              value={dpAmount || ""}
              onChange={(e) => handleDpAmountChange(Number(e.target.value))}
              className="form-input text-sm h-11"
              step="1000000"
              min="0"
              max={price}
            />
            {/* DP Preset Pills */}
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {[15, 20, 25, 30, 40, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleDpPercentSelect(pct)}
                  className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    dpPercent === pct
                      ? "bg-blue-800 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* 3. Pilihan Jangka Waktu (Tenor) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Jangka Waktu Pembiayaan (Tenor)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { months: 12, label: "1 Tahun", sub: "12 Bln" },
                { months: 24, label: "2 Tahun", sub: "24 Bln" },
                { months: 36, label: "3 Tahun", sub: "36 Bln" },
                { months: 48, label: "4 Tahun", sub: "48 Bln" },
                { months: 60, label: "5 Tahun", sub: "60 Bln" },
              ].map((t) => {
                const isActive = tenorMonths === t.months;
                return (
                  <button
                    key={t.months}
                    type="button"
                    onClick={() => setTenorMonths(t.months)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? "border-blue-800 bg-blue-800 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="font-bold text-sm">{t.label}</div>
                    <div
                      className={`text-[11px] ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {t.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Suku Bunga Tahunan */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="input-interest"
                className="text-xs font-bold text-slate-700"
              >
                Estimasi Suku Bunga per Tahun (%)
              </label>
              <span className="text-xs text-slate-500">
                Standar Leasing: {defaultRate}%
              </span>
            </div>
            <input
              id="input-interest"
              type="number"
              step="0.1"
              min="1"
              max="25"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="form-input text-sm h-11"
            />
          </div>
        </div>

        {/* Kolom Kanan: Hasil Estimasi Cicilan (5 Kolom) */}
        <aside className="lg:col-span-5 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 shadow-xl sticky top-24 space-y-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider mb-4">
              ⚠️ HASIL ESTIMASI SEMENTARA
            </span>
            <div className="text-xs text-slate-300 font-medium">
              Estimasi Cicilan per Bulan:
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1 mb-2 tracking-tight">
              Rp {calculation.monthlyInstallment.toLocaleString("id-ID")}
            </div>
            <div className="text-xs text-slate-400">
              Tenor {tenorMonths} bulan ({tenorMonths / 12} tahun) dengan suku
              bunga {interestRate}%/tahun
            </div>
          </div>

          {/* Rincian Finansial */}
          <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Harga OTR Kendaraan:</span>
              <strong className="text-white font-bold">
                Rp {price.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Uang Muka (DP {dpPercent}%):</span>
              <strong className="text-white font-bold">
                Rp {dpAmount.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Pokok Pinjaman:</span>
              <strong className="text-white font-bold">
                Rp {calculation.principalLoan.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Estimasi Total Bunga:</span>
              <strong className="text-white font-bold">
                Rp {calculation.totalInterest.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Total Pelunasan Kredit:</span>
              <strong className="text-white font-bold">
                Rp {calculation.totalLoan.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>

          {/* Disclaimer Box */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-[11px] text-slate-300 leading-relaxed">
            * <strong>DISCLAIMER:</strong> Perhitungan di atas merupakan
            estimasi indikatif simulasi kredit flat rate. Biaya administrasi,
            asuransi (All-Risk / TLO), provisi, dan persetujuan plafon kredit
            final ditentukan oleh pihak leasing/bank saat proses verifikasi data
            pemohon.
          </div>

          {/* CTA WhatsApp Action */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa btn-lg w-full font-bold shadow-md justify-center text-sm"
          >
            💬 Kirim Hasil Simulasi ke WhatsApp Sales
          </a>
        </aside>
      </div>
    </div>
  );
}
