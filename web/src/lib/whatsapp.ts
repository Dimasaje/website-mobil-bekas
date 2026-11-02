export interface WhatsAppMessageParams {
  showroomName?: string;
  carTitle?: string;
  price?: number | string;
  dp?: number | string;
  installment?: number | string;
  tenor?: number | string;
  oldCar?: string;
  targetCar?: string;
  customMessage?: string;
}

export type WhatsAppContext =
  "general" | "car" | "simulation" | "tradeIn" | "testDrive";

export interface WhatsAppOptions {
  phoneNumber?: string;
  showroomName?: string;
  context?: WhatsAppContext;
  params?: WhatsAppMessageParams;
}

const DEFAULT_PHONE = "6281298765432";
const DEFAULT_SHOWROOM = "Bintang Mobil";

/**
 * Normalisasi format nomor WhatsApp ke standar internasional tanpa tanda tambah (misal: 6281298765432).
 */
export function formatWhatsAppNumber(phone?: string | null): string {
  if (!phone) return DEFAULT_PHONE;

  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return DEFAULT_PHONE;

  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("62")) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Format angka rupiah sederhana untuk pesan teks WhatsApp.
 */
function formatRupiah(value?: number | string): string {
  if (value === undefined || value === null || value === "") return "";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

/**
 * Membuat template pesan WhatsApp terstruktur berdasarkan konteks kebutuhan.
 */
export function getWhatsAppMessage(
  context: WhatsAppContext = "general",
  params: WhatsAppMessageParams = {},
): string {
  if (params.customMessage) {
    return params.customMessage.trim();
  }

  const showroom = params.showroomName || DEFAULT_SHOWROOM;

  switch (context) {
    case "car": {
      const title = params.carTitle || "unit mobil ini";
      const priceStr = params.price ? ` (${formatRupiah(params.price)})` : "";
      return `Halo ${showroom}, saya tertarik dengan unit ${title}${priceStr}. Apakah unit masih tersedia dan bisa cek fisik/test drive?`;
    }

    case "simulation": {
      const title = params.carTitle ? ` untuk unit ${params.carTitle}` : "";
      const dpStr = params.dp ? `\n- DP: ${formatRupiah(params.dp)}` : "";
      const tenorStr = params.tenor ? `\n- Tenor: ${params.tenor} bulan` : "";
      const installmentStr = params.installment
        ? `\n- Estimasi Angsuran: ${formatRupiah(params.installment)}/bulan`
        : "";

      return `Halo ${showroom}, saya ingin konsultasi simulasi pembiayaan kredit${title}:${dpStr}${tenorStr}${installmentStr}\n\nMohon info syarat dan proses pengajuannya. Terima kasih.`;
    }

    case "tradeIn": {
      const oldCarStr = params.oldCar
        ? `mobil lama saya (${params.oldCar})`
        : "mobil lama saya";
      const targetStr = params.targetCar
        ? ` dengan unit ${params.targetCar}`
        : "";
      return `Halo ${showroom}, saya ingin mengajukan tukar tambah ${oldCarStr}${targetStr}. Bagaimana proses estimasi harga appraisal dan prosedurnya?`;
    }

    case "testDrive": {
      const title = params.carTitle || "unit mobil";
      return `Halo ${showroom}, saya ingin menjadwalkan test drive untuk ${title}. Kapan waktu yang tersedia untuk berkunjung ke showroom?`;
    }

    case "general":
    default:
      return `Halo ${showroom}, saya ingin bertanya seputar stok mobil bekas berkualitas yang tersedia.`;
  }
}

/**
 * Menghasilkan link URL wa.me lengkap yang siap dipakai pada elemen <a> atau window.open.
 */
export function buildWhatsAppLink(options: WhatsAppOptions = {}): string {
  const phone = formatWhatsAppNumber(options.phoneNumber);
  const message = getWhatsAppMessage(options.context || "general", {
    showroomName: options.showroomName,
    ...options.params,
  });

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
