import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { buildWhatsAppLink } from "../../lib/whatsapp";

export interface HeaderProps {
  showroomName?: string;
  whatsappNumber?: string;
}

export function Header({
  showroomName = "Bintang Mobil",
  whatsappNumber = "6281298765432",
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Beranda" },
    { to: "/katalog", label: "Katalog Mobil" },
    { to: "/simulasi-kredit", label: "Simulasi Kredit" },
    { to: "/tukar-tambah", label: "Tukar Tambah" },
    { to: "/testimoni", label: "Testimoni" },
    { to: "/artikel", label: "Artikel" },
    { to: "/kontak", label: "Kontak" },
  ];

  const waUrl = buildWhatsAppLink({
    phoneNumber: whatsappNumber,
    showroomName,
    context: "general",
  });

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-blue-800 hover:text-blue-900 transition-colors"
        >
          <span>🚗</span>
          <span>{showroomName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium py-1 border-b-2 transition-colors ${
                  isActive
                    ? "text-blue-800 border-blue-800"
                    : "text-slate-700 border-transparent hover:text-blue-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa btn-sm hidden sm:inline-flex"
          >
            💬 Chat WA
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2"
        >
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-800"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa w-full btn-sm justify-center"
            >
              💬 Konsultasi via WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
