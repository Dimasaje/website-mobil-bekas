import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiClientError, apiClient } from "../../lib/api";

export function AdminLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expiredNotice = searchParams.get("expired") === "1";
  const redirectParam = searchParams.get("redirect");
  const redirectTo =
    redirectParam && redirectParam.startsWith("/admin")
      ? redirectParam
      : "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.loginAdmin(email.trim(), password);
      if (res.success && res.data?.user) {
        navigate(redirectTo, { replace: true });
        return;
      }
      throw new Error("Email atau password salah");
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Gagal masuk. Periksa koneksi lalu coba lagi.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
        <div className="text-center mb-6">
          <span className="text-4xl inline-block mb-2" aria-hidden="true">
            🚗
          </span>
          <h1 className="text-2xl font-bold text-blue-800">Bintang Mobil</h1>
          <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">
            Portal Pengelolaan Admin
          </p>
        </div>

        {expiredNotice && !errorMessage && (
          <div
            role="status"
            className="bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-lg px-3 py-2.5 mb-4"
          >
            ⏳ Sesi Anda telah berakhir. Silakan masuk kembali untuk
            melanjutkan.
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="bg-red-50 border border-red-300 text-red-800 text-xs rounded-lg px-3 py-2.5 mb-4"
          >
            ⚠️ <strong>Gagal Masuk:</strong> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-semibold text-slate-800 mb-1"
            >
              Email Administrator
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bintangmobil.com"
              className="form-input text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-semibold text-slate-800 mb-1"
            >
              Kata Sandi (Password)
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input text-sm"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="accent-blue-800"
              />
              Ingat sesi saya
            </label>
            <span>Sesi cookie httpOnly</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full font-bold"
          >
            {isSubmitting ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          <Link to="/" className="hover:text-blue-800 underline">
            ← Kembali ke website publik
          </Link>
        </p>
      </div>
    </div>
  );
}
