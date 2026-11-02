import { buildWhatsAppLink } from "../../lib/whatsapp";

export interface FloatingCTAProps {
  whatsappNumber?: string;
  phoneNumber?: string;
  showroomName?: string;
  /** Extra classes for the wrapper, e.g. "hidden lg:flex" to hide on mobile. */
  className?: string;
}

export function FloatingCTA({
  whatsappNumber = "6281298765432",
  phoneNumber = "021-87654321",
  showroomName = "Bintang Mobil",
  className = "",
}: FloatingCTAProps) {
  const waUrl = buildWhatsAppLink({
    phoneNumber: whatsappNumber,
    showroomName,
    context: "general",
  });

  const telUrl = `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;

  return (
    <aside
      aria-label="Kontak Cepat Showroom"
      className={`fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-auto ${className}`}
    >
      {/* Telepon */}
      <a
        href={telUrl}
        className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-full text-sm font-bold text-white bg-blue-800 hover:bg-blue-900 shadow-md transition-transform active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        title="Hubungi melalui Telepon"
      >
        <span>📞</span>
        <span className="hidden sm:inline">Telepon</span>
      </a>

      {/* WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-full text-sm font-bold text-white bg-green-700 hover:bg-green-800 shadow-[0_8px_20px_rgba(21,128,61,0.35)] transition-transform active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        title="Chat WhatsApp Showroom"
      >
        <span>💬</span>
        <span>WhatsApp</span>
      </a>
    </aside>
  );
}
