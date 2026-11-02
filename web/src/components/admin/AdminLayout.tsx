import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import {
  ApiClientError,
  apiClient,
  setUnauthorizedHandler,
  type AdminUser,
} from "../../lib/api";

export interface AdminLayoutContext {
  user: AdminUser;
  logout: () => Promise<void>;
}

export function useAdminUser(): AdminLayoutContext {
  return useOutletContext<AdminLayoutContext>();
}

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/mobil", label: "Kelola Stok Mobil", icon: "🚗", end: false },
  { to: "/admin/leads", label: "Leads & Prospek", icon: "📥", end: false },
  { to: "/admin/konten", label: "Konten & Pengaturan", icon: "⚙️", end: false },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Guard: validasi sesi ke server setiap kali rute admin berubah.
  useEffect(() => {
    let active = true;
    setChecking(true);

    apiClient
      .getAdminMe()
      .then((res) => {
        if (!active) return;
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          navigate(
            `/admin/login?redirect=${encodeURIComponent(pathname)}&expired=1`,
            { replace: true },
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        const expired =
          err instanceof ApiClientError && err.status === 401
            ? "&expired=1"
            : "";
        navigate(
          `/admin/login?redirect=${encodeURIComponent(pathname)}${expired}`,
          { replace: true },
        );
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, navigate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Mutasi admin yang kena 401 di tengah form (simpan mobil, PATCH lead,
  // pengaturan, CRUD konten) diarahkan ke login dengan notice sesi berakhir,
  // bukan menampilkan pesan error mentah dari API.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      navigate(
        `/admin/login?redirect=${encodeURIComponent(pathname)}&expired=1`,
        { replace: true },
      );
    });

    return () => setUnauthorizedHandler(null);
  }, [navigate, pathname]);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await apiClient.logoutAdmin();
    } catch {
      // Sesi lokal tetap dibersihkan walau server tidak merespons
      setLogoutError("Sesi lokal diakhiri, tapi server tidak merespons.");
    }
    setUser(null);
    navigate("/admin/login", { replace: true });
  };

  if (checking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600 animate-pulse">
          Memeriksa sesi admin...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-[250] w-[250px] bg-slate-900 text-slate-400 flex flex-col transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-5 border-b border-slate-800 text-white font-bold flex items-center gap-2">
          <span aria-hidden="true">🚙</span>
          <span>Bintang Mobil Admin</span>
        </div>

        <nav className="flex-1 p-2">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-800 text-white"
                        : "hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="text-white font-bold mb-1">{user.name}</div>
          <div className="break-all">{user.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 text-red-400 hover:text-red-300 font-semibold cursor-pointer"
          >
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[240] bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="lg:hidden p-2 -ml-2 text-slate-700 cursor-pointer"
              aria-label="Buka menu admin"
              aria-expanded={menuOpen}
              aria-controls="admin-sidebar"
            >
              ☰
            </button>
            <span className="text-sm font-semibold truncate">
              Panel Admin Showroom
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm text-xs"
            >
              Lihat Website Publik
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-sm text-xs lg:hidden"
            >
              Keluar
            </button>
          </div>
        </header>

        {logoutError && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2">
            ⚠️ {logoutError}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">
          <Outlet
            context={
              { user, logout: handleLogout } satisfies AdminLayoutContext
            }
          />
        </main>
      </div>
    </div>
  );
}
