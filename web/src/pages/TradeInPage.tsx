import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLayoutSettings } from "../components/layout/Layout";
import { apiClient, type Car } from "../lib/api";
import { buildWhatsAppLink } from "../lib/whatsapp";

// Regex nomor telepon Indonesia: 08..., 628..., +628... dengan panjang 9-15 digit
const INDO_PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;

export type FormMode = "tukar_tambah" | "jual" | "test_drive";

export interface ModeResetState {
  selectedCarId: string;
  targetCarName: string;
  preferredDate: string;
  preferredTime: string;
}

// State yang harus dikosongkan saat pindah tab mode. Unit target hanya
// dipertahankan bila datang dari query param dan tab awal mode itu aktif lagi.
export function resetModeState(
  next: FormMode,
  initialMode: FormMode,
  initialCarId: string,
  initialTargetName: string,
): ModeResetState {
  const keepInitialTarget = next === initialMode;

  return {
    selectedCarId: keepInitialTarget ? initialCarId : "",
    targetCarName: keepInitialTarget ? initialTargetName : "",
    preferredDate: "",
    preferredTime: "",
  };
}

// Target dari query param hanya dipasang sekali, dan hanya selama mode awal
// masih aktif. Tanpa ini, reset dari changeMode langsung ditimpa lagi oleh
// hasil muat katalog sehingga muncul unit "hantu" (label terisi, carId kosong).
export function shouldApplyInitialTarget(
  alreadyApplied: boolean,
  mode: FormMode,
  initialMode: FormMode,
): boolean {
  return !alreadyApplied && mode === initialMode;
}

export function TradeInPage() {
  const [searchParams] = useSearchParams();
  const { settings: layoutSettings } = useLayoutSettings();

  // URL Query Params auto-fill
  const initialMode =
    (searchParams.get("mode") as FormMode) ||
    (searchParams.get("target") ? "tukar_tambah" : "tukar_tambah");
  const initialTargetName = searchParams.get("target") || "";
  const initialCarId = searchParams.get("carId") || "";

  const [mode, setMode] = useState<FormMode>(initialMode);
  const [catalogCars, setCatalogCars] = useState<Car[]>([]);

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Data Mobil Lama (Tukar Tambah & Jual)
  const [oldBrand, setOldBrand] = useState("");
  const [oldModel, setOldModel] = useState("");
  const [oldYear, setOldYear] = useState("");
  const [oldTransmission, setOldTransmission] = useState("manual");
  const [oldMileage, setOldMileage] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");

  // Target Mobil Baru
  const [selectedCarId, setSelectedCarId] = useState(initialCarId);
  const [targetCarName, setTargetCarName] = useState(initialTargetName);

  // Data Khusus Test Drive
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  // UI States
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load cars for selection. Katalog dimuat sekali; target dari query param
  // dipasang lewat guard agar reset mode tidak ditimpa.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const initialTargetApplied = useRef(false);

  useEffect(() => {
    let mounted = true;
    apiClient
      .getCars({ limit: 50, status: "tersedia" })
      .then((res) => {
        if (!mounted || !res.data) return;

        setCatalogCars(res.data);

        if (!initialCarId || initialTargetName) return;
        if (
          !shouldApplyInitialTarget(
            initialTargetApplied.current,
            modeRef.current,
            initialMode,
          )
        ) {
          return;
        }

        initialTargetApplied.current = true;
        const found = res.data.find((c) => c.id === initialCarId);
        if (found) setTargetCarName(found.title);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Nama lengkap wajib diisi minimal 2 karakter";
    }

    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!cleanPhone) {
      errors.phone = "Nomor WhatsApp aktif wajib diisi";
    } else if (!INDO_PHONE_REGEX.test(cleanPhone)) {
      errors.phone =
        "Nomor tidak valid. Gunakan format HP Indonesia (misal: 08123456789 atau 628123456789)";
    }

    if (mode === "tukar_tambah" || mode === "jual") {
      if (!oldBrand.trim()) errors.oldBrand = "Merek mobil lama wajib diisi";
      if (!oldModel.trim())
        errors.oldModel = "Model atau tipe varian wajib diisi";
      if (!oldYear.trim()) {
        errors.oldYear = "Tahun mobil wajib diisi";
      } else {
        const y = Number(oldYear);
        if (isNaN(y) || y < 1990 || y > new Date().getFullYear() + 1) {
          errors.oldYear = "Tahun pembuatan tidak valid";
        }
      }
    }

    if (mode === "test_drive") {
      if (!selectedCarId && !targetCarName.trim()) {
        errors.targetCar = "Pilih unit mobil yang ingin Anda test drive";
      }
      if (!preferredDate) {
        errors.preferredDate = "Tentukan tanggal rencana kunjungan";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Spam honeypot trap
    if (honeypot) {
      setSubmitSuccess(true);
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const leadType = mode === "test_drive" ? "test_drive" : "tukar_tambah";

      const additionalData: Record<string, unknown> = {};

      if (mode === "tukar_tambah" || mode === "jual") {
        additionalData.subType =
          mode === "jual" ? "jual_mobil" : "tukar_tambah";
        additionalData.oldCar = {
          brand: oldBrand.trim(),
          model: oldModel.trim(),
          year: Number(oldYear),
          transmission: oldTransmission,
          mileage: oldMileage ? oldMileage.trim() : null,
          expectedPrice: expectedPrice ? expectedPrice.trim() : null,
        };
        additionalData.targetCar =
          mode === "jual" ? "Hanya Jual Mobil Lama" : targetCarName || null;
      }

      if (mode === "test_drive") {
        additionalData.preferredDate = preferredDate;
        additionalData.preferredTime = preferredTime || "Fleksibel";
        additionalData.carTitle = targetCarName || null;
      }

      const res = await apiClient.submitLead({
        type: leadType,
        name: name.trim(),
        phone: phone.replace(/[\s-]/g, ""),
        carId: mode === "jual" ? null : selectedCarId || null,
        notes: notes.trim() || null,
        data: additionalData,
        honeypot: honeypot || undefined,
      });

      if (res.data?.id) {
        setSubmittedLeadId(res.data.id);
        setSubmitSuccess(true);
      } else {
        throw new Error(res.error?.message || "Gagal mengirimkan formulir");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim formulir. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ganti mode wajib membuang state yang khas mode sebelumnya, supaya lead
  // tidak membawa mobil target dari tab lain dan banner error lama.
  const changeMode = (next: FormMode) => {
    if (next === mode) return;

    const reset = resetModeState(
      next,
      initialMode,
      initialCarId,
      initialTargetName,
    );

    setMode(next);
    setSubmitSuccess(false);
    setSubmitError(null);
    setFieldErrors({});
    setSelectedCarId(reset.selectedCarId);
    setTargetCarName(reset.targetCarName);
    setPreferredDate(reset.preferredDate);
    setPreferredTime(reset.preferredTime);
  };

  const showroomName = layoutSettings?.showroomName || "Bintang Mobil";
  const waNumber = layoutSettings?.whatsappNumber || "6281298765432";

  // Build follow-up WhatsApp message based on submitted state
  const buildSuccessWaMessage = () => {
    if (mode === "test_drive") {
      return `Halo ${showroomName}, saya ${name} sudah mengisi form janji Test Drive untuk unit ${
        targetCarName || "mobil bekas"
      } pada tanggal ${preferredDate} ${preferredTime ? `jam ${preferredTime}` : ""}. Mohon konfirmasi jadwalnya. Terima kasih.`;
    }

    if (mode === "jual") {
      return `Halo ${showroomName}, saya ${name} sudah mengirim data penawaran jual mobil lama (${oldBrand} ${oldModel} tahun ${oldYear}, transmisi ${oldTransmission}). Mohon taksiran harga awalnya. Terima kasih.`;
    }

    return `Halo ${showroomName}, saya ${name} sudah mengirim form tukar tambah mobil ${oldBrand} ${oldModel} ${oldYear} dengan target ${
      targetCarName || "unit di katalog"
    }. Mohon info estimasi selisih dan jadwal appraisal. Terima kasih.`;
  };

  const waSuccessLink = buildWhatsAppLink({
    phoneNumber: waNumber,
    showroomName,
    context: "general",
    params: {
      customMessage: buildSuccessWaMessage(),
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-blue-800 transition-colors">
          Beranda
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-900">
          Formulir Tukar Tambah & Test Drive
        </span>
      </nav>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => changeMode("tukar_tambah")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            mode === "tukar_tambah"
              ? "border-blue-800 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          🔄 Tukar Tambah Mobil
        </button>
        <button
          type="button"
          onClick={() => changeMode("jual")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            mode === "jual"
              ? "border-blue-800 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          💰 Jual Mobil Anda
        </button>
        <button
          type="button"
          onClick={() => changeMode("test_drive")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            mode === "test_drive"
              ? "border-blue-800 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          🚗 Janji Test Drive
        </button>
      </div>

      {/* State Sukses */}
      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              ✓
            </span>
            <div className="space-y-2 flex-1">
              <h2 className="text-lg md:text-xl font-extrabold text-emerald-950">
                {mode === "test_drive"
                  ? "Permintaan Jadwal Test Drive Berhasil Diterima!"
                  : "Permintaan Penilaian & Taksiran Berhasil Diterima!"}
              </h2>
              <p className="text-sm text-emerald-900 leading-relaxed">
                Terima kasih, <strong>{name}</strong>! Tim appraisal & konsultan
                kami akan memeriksa data kendaraan Anda dan segera mengirimkan
                estimasi harga ke nomor WhatsApp <strong>{phone}</strong> dalam
                15–30 menit.
              </p>
              {submittedLeadId && (
                <p className="text-xs text-emerald-700">
                  ID Tiket Layanan:{" "}
                  <code className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">
                    {submittedLeadId}
                  </code>
                </p>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href={waSuccessLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-wa font-bold text-sm shadow-sm justify-center"
                >
                  💬 Lanjut Konfirmasi ke WhatsApp Sales
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setName("");
                    setPhone("");
                    setNotes("");
                    setOldBrand("");
                    setOldModel("");
                    setOldYear("");
                    setOldMileage("");
                    setExpectedPrice("");
                  }}
                  className="btn btn-outline text-sm font-semibold justify-center"
                >
                  Kirim Formulir Lain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          {mode === "tukar_tambah" &&
            "Tukar Tambah Mobil Lama dengan Harga Fair"}
          {mode === "jual" && "Jual Mobil Anda dengan Cepat & Aman"}
          {mode === "test_drive" && "Jadwalkan Test Drive Mobil Pilihan Anda"}
        </h1>
        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          {mode === "tukar_tambah" &&
            "Tukarkan mobil lama Anda dengan unit impian bergaransi. Kami berikan appraisal transparan dan proses cepat satu hari selesai."}
          {mode === "jual" &&
            "Ingin jual mobil tanpa ribet pasang iklan? Dapatkan harga taksiran terbaik langsung dari showroom kami, dana cair hari ini."}
          {mode === "test_drive" &&
            "Rasakan kenyamanan dan performa langsung di jalan. Tim kami akan menyiapkan unit dan rute uji berkendara terbaik untuk Anda."}
        </p>

        {submitError && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6 text-sm text-red-800 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div>{submitError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Honeypot Spam Field (Hidden) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website-hp">Website</label>
            <input
              id="website-hp"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* SECTION 1: DATA MOBIL LAMA (Hanya untuk Tukar Tambah & Jual) */}
          {(mode === "tukar_tambah" || mode === "jual") && (
            <section className="space-y-4">
              <div className="text-base font-bold text-blue-900 pb-2 border-b border-slate-200">
                1. Data Mobil yang Mau Dijual / Ditukar
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merek Mobil */}
                <div>
                  <label
                    htmlFor="old-brand"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Merek Mobil *
                  </label>
                  <input
                    id="old-brand"
                    type="text"
                    placeholder="Contoh: Toyota, Honda, Mitsubishi"
                    value={oldBrand}
                    onChange={(e) => setOldBrand(e.target.value)}
                    className={`form-input text-sm h-11 ${
                      fieldErrors.oldBrand
                        ? "border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                  />
                  {fieldErrors.oldBrand && (
                    <span className="text-xs text-red-600 mt-1 block">
                      ⚠️ {fieldErrors.oldBrand}
                    </span>
                  )}
                </div>

                {/* Model / Varian */}
                <div>
                  <label
                    htmlFor="old-model"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Model & Varian *
                  </label>
                  <input
                    id="old-model"
                    type="text"
                    placeholder="Contoh: Avanza 1.3 G, Jazz RS"
                    value={oldModel}
                    onChange={(e) => setOldModel(e.target.value)}
                    className={`form-input text-sm h-11 ${
                      fieldErrors.oldModel
                        ? "border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                  />
                  {fieldErrors.oldModel && (
                    <span className="text-xs text-red-600 mt-1 block">
                      ⚠️ {fieldErrors.oldModel}
                    </span>
                  )}
                </div>

                {/* Tahun Pembuatan */}
                <div>
                  <label
                    htmlFor="old-year"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Tahun Pembuatan *
                  </label>
                  <input
                    id="old-year"
                    type="number"
                    placeholder="Contoh: 2018"
                    value={oldYear}
                    onChange={(e) => setOldYear(e.target.value)}
                    className={`form-input text-sm h-11 ${
                      fieldErrors.oldYear
                        ? "border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                  {fieldErrors.oldYear && (
                    <span className="text-xs text-red-600 mt-1 block">
                      ⚠️ {fieldErrors.oldYear}
                    </span>
                  )}
                </div>

                {/* Transmisi */}
                <div>
                  <label
                    htmlFor="old-trans"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Transmisi
                  </label>
                  <select
                    id="old-trans"
                    value={oldTransmission}
                    onChange={(e) => setOldTransmission(e.target.value)}
                    className="form-select text-sm h-11"
                  >
                    <option value="manual">Manual</option>
                    <option value="otomatis">Matic (Otomatis)</option>
                  </select>
                </div>

                {/* Jarak Tempuh / Kilometer */}
                <div>
                  <label
                    htmlFor="old-km"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Jarak Tempuh (Kilometer)
                  </label>
                  <input
                    id="old-km"
                    type="text"
                    placeholder="Contoh: 65.000 km"
                    value={oldMileage}
                    onChange={(e) => setOldMileage(e.target.value)}
                    className="form-input text-sm h-11"
                  />
                </div>

                {/* Ekspektasi Harga */}
                <div>
                  <label
                    htmlFor="expected-price"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Ekspektasi Harga (Opsional)
                  </label>
                  <input
                    id="expected-price"
                    type="text"
                    placeholder="Contoh: Rp 160.000.000"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(e.target.value)}
                    className="form-input text-sm h-11"
                  />
                </div>
              </div>

              {/* Upload Foto Mobil Notice */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto Kendaraan (Opsional - Bisa dikirim menyusul via WhatsApp)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:border-blue-700 transition-colors cursor-pointer">
                  <div className="text-3xl mb-1">📷</div>
                  <div className="text-xs font-semibold text-slate-700">
                    Foto mobil depan, samping, dan interior speedometer
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dapat dikirimkan langsung ke tim sales melalui obrolan
                    WhatsApp setelah konfirmasi
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: TARGET MOBIL BARU / TEST DRIVE */}
          {(mode === "tukar_tambah" || mode === "test_drive") && (
            <section className="space-y-4">
              <div className="text-base font-bold text-blue-900 pb-2 border-b border-slate-200">
                {mode === "test_drive"
                  ? "1. Pilih Unit Mobil & Waktu Test Drive"
                  : "2. Target Mobil Baru yang Diinginkan"}
              </div>

              <div>
                <label
                  htmlFor="target-car"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Pilih Mobil dari Katalog {showroomName} *
                </label>
                <select
                  id="target-car"
                  value={selectedCarId}
                  onChange={(e) => {
                    const carId = e.target.value;
                    setSelectedCarId(carId);
                    const selected = catalogCars.find((c) => c.id === carId);
                    if (selected) {
                      setTargetCarName(selected.title);
                    } else {
                      setTargetCarName("");
                    }
                  }}
                  className={`form-select text-sm h-11 ${
                    fieldErrors.targetCar ? "border-red-500" : ""
                  }`}
                >
                  <option value="">
                    {targetCarName
                      ? `Unit Dipilih: ${targetCarName}`
                      : "-- Pilih Unit Mobil dari Katalog Showroom --"}
                  </option>
                  {catalogCars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} - Rp {Number(c.price).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
                {fieldErrors.targetCar && (
                  <span className="text-xs text-red-600 mt-1 block">
                    ⚠️ {fieldErrors.targetCar}
                  </span>
                )}
                {targetCarName && !selectedCarId && (
                  <p className="text-xs text-blue-800 mt-1 font-semibold">
                    Unit rujukan saat ini: <strong>{targetCarName}</strong>
                  </p>
                )}
              </div>

              {/* Rencana Waktu Test Drive */}
              {mode === "test_drive" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="drive-date"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Tanggal Rencana Uji Jalan *
                    </label>
                    <input
                      id="drive-date"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className={`form-input text-sm h-11 ${
                        fieldErrors.preferredDate ? "border-red-500" : ""
                      }`}
                    />
                    {fieldErrors.preferredDate && (
                      <span className="text-xs text-red-600 mt-1 block">
                        ⚠️ {fieldErrors.preferredDate}
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="drive-time"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Jam Perkiraan
                    </label>
                    <select
                      id="drive-time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="form-select text-sm h-11"
                    >
                      <option value="">Fleksibel (Jam Kerja)</option>
                      <option value="10:00 WIB">Pagi (10:00 WIB)</option>
                      <option value="13:30 WIB">Siang (13:30 WIB)</option>
                      <option value="15:30 WIB">Sore (15:30 WIB)</option>
                      <option value="17:00 WIB">Petang (17:00 WIB)</option>
                    </select>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECTION 3: KONTAK PEMOHON */}
          <section className="space-y-4">
            <div className="text-base font-bold text-blue-900 pb-2 border-b border-slate-200">
              {mode === "test_drive"
                ? "2. Data Kontak Pemesan"
                : "3. Data Kontak & Pengiriman Hasil Taksiran"}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="lead-name"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nama Lengkap *
                </label>
                <input
                  id="lead-name"
                  type="text"
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`form-input text-sm h-11 ${
                    fieldErrors.name ? "border-red-500 focus:ring-red-200" : ""
                  }`}
                  required
                />
                {fieldErrors.name && (
                  <span className="text-xs text-red-600 mt-1 block">
                    ⚠️ {fieldErrors.name}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="lead-phone"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`form-input text-sm h-11 ${
                    fieldErrors.phone ? "border-red-500 focus:ring-red-200" : ""
                  }`}
                  required
                />
                {fieldErrors.phone && (
                  <span className="text-xs text-red-600 mt-1 block">
                    ⚠️ {fieldErrors.phone}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="lead-notes"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Catatan Tambahan (Kondisi Khusus / Permintaan)
              </label>
              <textarea
                id="lead-notes"
                placeholder="Tuliskan catatan kondisi mobil lama, modifikasi, atau pertanyaan Anda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea text-sm"
                rows={3}
              />
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-full font-bold shadow-md text-base justify-center"
            >
              {isSubmitting
                ? "Mengirim Data..."
                : mode === "test_drive"
                  ? "🚗 Jadwalkan Test Drive Sekarang"
                  : "Kirim Permintaan Taksiran Sekarang"}
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              🔒 Data Anda aman dan hanya digunakan oleh tim resmi{" "}
              {showroomName} untuk keperluan taksiran harga dan konfirmasi
              layanan.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
