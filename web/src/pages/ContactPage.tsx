import { useState } from "react";
import { Link } from "react-router-dom";
import { useLayoutSettings } from "../components/layout/Layout";
import { apiClient } from "../lib/api";
import { buildWhatsAppLink } from "../lib/whatsapp";

// Regex nomor HP Indonesia: 08..., 628..., +628... dengan panjang 9-15 digit
const INDO_PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;

export function ContactPage() {
  const { settings: layoutSettings } = useLayoutSettings();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showroomName = layoutSettings?.showroomName || "Bintang Mobil";
  const address =
    layoutSettings?.address ||
    "Jl. Raya Otista No. 123, Bidara Cina, Jatinegara, Jakarta Timur";
  const openingHours =
    layoutSettings?.openingHours ||
    "Buka Setiap Hari: 08:30 - 18:00 WIB (Sabtu & Minggu Tetap Buka)";
  const phoneNumber = layoutSettings?.phoneNumber || "021-87654321";
  const waNumber = layoutSettings?.whatsappNumber || "6281298765432";
  const mapsUrl =
    layoutSettings?.mapsUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(
      `${showroomName} ${address}`,
    )}`;

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
        "Nomor tidak valid. Gunakan format nomor HP Indonesia (misal: 08123456789 atau 628123456789)";
    }

    if (!message.trim()) {
      errors.message = "Pesan atau pertanyaan wajib diisi";
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
      const res = await apiClient.submitLead({
        type: "kontak",
        name: name.trim(),
        phone: phone.replace(/[\s-]/g, ""),
        notes: message.trim(),
        honeypot: honeypot || undefined,
      });

      if (res.data?.id) {
        setSubmitSuccess(true);
      } else {
        throw new Error(res.error?.message || "Gagal mengirimkan pesan");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Gagal mengirimkan pesan. Silakan coba lagi atau langsung chat via WhatsApp.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const directWaLink = buildWhatsAppLink({
    phoneNumber: waNumber,
    showroomName,
    context: "general",
    params: {
      customMessage: `Halo ${showroomName}, saya ingin menanyakan informasi stok unit mobil bekas dan lokasi showroom.`,
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
          Kontak & Lokasi Showroom
        </span>
      </nav>

      {/* Header */}
      <div className="max-w-2xl mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2">
          Hubungi Kami & Lokasi Showroom
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Kunjungi showroom kami untuk cek unit fisik langsung, uji kemudi, atau
          konsultasi pembiayaan bersama konsultan kami.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Informasi Showroom & Peta (7 Kolom) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Informasi Resmi Showroom
            </h2>
            <p className="text-xs text-slate-500">
              Kami siap melayani kebutuhan kendaraan bekas berkualitas Anda.
            </p>
          </div>

          <div className="space-y-4">
            {/* Alamat */}
            <div className="flex gap-3.5 items-start">
              <span className="text-2xl text-blue-800 flex-shrink-0">📍</span>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Alamat Lengkap
                </div>
                <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {address}
                </div>
              </div>
            </div>

            {/* Jam Operasional */}
            <div className="flex gap-3.5 items-start">
              <span className="text-2xl text-blue-800 flex-shrink-0">🕒</span>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Jam Operasional
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {openingHours}
                </div>
              </div>
            </div>

            {/* Telepon Showroom */}
            <div className="flex gap-3.5 items-start">
              <span className="text-2xl text-blue-800 flex-shrink-0">📞</span>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Telepon Kantor
                </div>
                <a
                  href={`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`}
                  className="text-sm font-bold text-blue-800 hover:underline"
                >
                  {phoneNumber}
                </a>
              </div>
            </div>

            {/* WhatsApp Showroom */}
            <div className="flex gap-3.5 items-start">
              <span className="text-2xl text-emerald-600 flex-shrink-0">
                💬
              </span>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Konsultasi WhatsApp (Respon Cepat)
                </div>
                <a
                  href={directWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-emerald-700 hover:underline"
                >
                  +{waNumber}
                </a>
              </div>
            </div>
          </div>

          {/* Map Preview Box */}
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 text-center flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">🗺️</span>
            <span className="text-xs font-bold text-slate-800">
              Peta Lokasi Google Maps: {showroomName}
            </span>
            <p className="text-xs text-slate-500 max-w-sm mb-1">{address}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm font-bold text-xs"
            >
              📍 Buka Petunjuk Arah di Google Maps →
            </a>
          </div>
        </div>

        {/* Kolom Kanan: Formulir Tinggalkan Pesan (5 Kolom) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Tinggalkan Pesan
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Punya pertanyaan mengenai stok unit tertentu atau simulasi kredit?
            Kirimkan pesan dan kami akan merespons dalam hitungan menit.
          </p>

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 mb-6 text-sm text-emerald-900">
              <div className="font-bold mb-1">✓ Pesan Berhasil Terkirim!</div>
              <p className="text-xs text-emerald-800 mb-3">
                Terima kasih <strong>{name}</strong>. Tim kami akan segera
                menghubungi Anda ke WhatsApp <strong>{phone}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setName("");
                  setPhone("");
                  setMessage("");
                }}
                className="btn btn-outline btn-sm text-xs w-full"
              >
                Kirim Pesan Lain
              </button>
            </div>
          )}

          {submitError && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 mb-4 text-xs text-red-800">
              ⚠️ {submitError}
            </div>
          )}

          {!submitSuccess && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Honeypot Spam Protection */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Nama */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nama Lengkap *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`form-input text-sm h-11 ${
                    fieldErrors.name ? "border-red-500" : ""
                  }`}
                  required
                />
                {fieldErrors.name && (
                  <span className="text-xs text-red-600 mt-1 block">
                    ⚠️ {fieldErrors.name}
                  </span>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  placeholder="0812xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`form-input text-sm h-11 ${
                    fieldErrors.phone ? "border-red-500" : ""
                  }`}
                  required
                />
                {fieldErrors.phone && (
                  <span className="text-xs text-red-600 mt-1 block">
                    ⚠️ {fieldErrors.phone}
                  </span>
                )}
              </div>

              {/* Pesan */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Pesan / Mobil yang Ditanyakan *
                </label>
                <textarea
                  id="contact-message"
                  placeholder="Tuliskan pertanyaan seputar unit atau syarat kredit..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className={`form-textarea text-sm ${
                    fieldErrors.message ? "border-red-500" : ""
                  }`}
                  required
                />
                {fieldErrors.message && (
                  <span className="text-xs text-red-600 mt-1 block">
                    ⚠️ {fieldErrors.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full font-bold text-sm h-11 justify-center"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase">
                  atau
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <a
                href={directWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa w-full font-bold text-sm h-11 justify-center"
              >
                💬 Langsung Chat via WhatsApp Sales
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
