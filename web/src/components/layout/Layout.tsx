import { useEffect, useState } from "react";
import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import { apiClient, type SiteSettings } from "../../lib/api";
import { FloatingCTA } from "../common/FloatingCTA";
import { Footer } from "./Footer";
import { Header } from "./Header";

export interface LayoutContext {
  settings: SiteSettings | null;
}

export function useLayoutSettings(): LayoutContext {
  return useOutletContext<LayoutContext>() || { settings: null };
}

export function Layout() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const { pathname } = useLocation();

  // Halaman dengan CTA mobile sendiri (detail mobil & simulasi kredit)
  // -> FloatingCTA disembunyikan di ponsel agar tidak menutupi kontrol.
  const hideMobileFab = /^\/(katalog\/[^/]+|simulasi-kredit)$/.test(pathname);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getSettings()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch(() => {
        // Silently use defaults if offline
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        showroomName={settings?.showroomName}
        whatsappNumber={settings?.whatsappNumber}
      />
      {/* min-h menjaga footer tetap di bawah lipatan saat konten halaman masih
          dimuat, sehingga tidak ada layout shift besar (CLS). */}
      <main className="flex-1 min-h-[80vh] pb-16 md:pb-6">
        <Outlet context={{ settings } satisfies LayoutContext} />
      </main>
      <Footer
        showroomName={settings?.showroomName}
        whatsappNumber={settings?.whatsappNumber}
        phoneNumber={settings?.phoneNumber || undefined}
        address={settings?.address}
        openingHours={settings?.openingHours || undefined}
      />
      <FloatingCTA
        whatsappNumber={settings?.whatsappNumber}
        phoneNumber={settings?.phoneNumber || undefined}
        showroomName={settings?.showroomName}
        className={hideMobileFab ? "max-lg:hidden" : ""}
      />
    </div>
  );
}
