import { useCallback, useEffect, useState } from "react";
import {
  ApiClientError,
  apiClient,
  type AdminArticle,
  type ArticleStatus,
} from "../../../lib/api";

interface ArticleForm {
  title: string;
  coverImageUrl: string;
  content: string;
  status: ArticleStatus;
  publishedAt: string;
}

const EMPTY_FORM: ArticleForm = {
  title: "",
  coverImageUrl: "",
  content: "",
  status: "draft",
  publishedAt: "",
};

export function ArticlesTab() {
  const [items, setItems] = useState<AdminArticle[]>([]);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listAdminArticles({ page, limit: 20 });
      setItems(res.data ?? []);
      setTotalPages(Math.max(1, res.pagination?.totalPages ?? 1));
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal memuat daftar artikel.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (article: AdminArticle) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      coverImageUrl: article.coverImageUrl ?? "",
      content: article.content,
      status: article.status,
      publishedAt: article.publishedAt ? article.publishedAt.slice(0, 10) : "",
    });
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      title: form.title.trim(),
      coverImageUrl: form.coverImageUrl.trim() || null,
      content: form.content.trim(),
      status: form.status,
      publishedAt: form.publishedAt || null,
    };

    try {
      if (editingId) {
        await apiClient.updateAdminArticle(editingId, payload);
        setNotice("Artikel berhasil diperbarui.");
      } else {
        await apiClient.createAdminArticle(payload);
        setNotice("Artikel berhasil dibuat.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal menyimpan artikel.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article: AdminArticle) => {
    if (!window.confirm(`Hapus artikel "${article.title}"?`)) return;
    try {
      await apiClient.deleteAdminArticle(article.id);
      setItems((prev) => prev.filter((row) => row.id !== article.id));
      if (editingId === article.id) resetForm();
      setNotice("Artikel dihapus.");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal menghapus artikel.",
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 items-start">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
        {loading && <p className="text-sm text-slate-600">Memuat artikel...</p>}

        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-500">
            Belum ada artikel. Tulis artikel tips pertama.
          </p>
        )}

        <ul className="divide-y divide-slate-100">
          {items.map((article) => (
            <li key={article.id} className="py-3 flex items-start gap-3">
              {article.coverImageUrl ? (
                <img
                  src={article.coverImageUrl}
                  alt=""
                  className="w-20 h-14 object-cover rounded-md bg-slate-100"
                  loading="lazy"
                />
              ) : (
                <div className="w-20 h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  —
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-900 truncate">
                  {article.title}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  /artikel/{article.slug}
                </div>
                <span
                  className={`mt-1 inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                    article.status === "terbit"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {article.status === "terbit" ? "Terbit" : "Draft"}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(article)}
                  className="text-blue-800 hover:underline cursor-pointer"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(article)}
                  className="text-red-700 hover:underline cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 mt-3 text-sm">
            <span className="text-slate-600">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
      >
        <h2 className="font-bold text-sm text-slate-900">
          {editingId ? "Ubah Artikel" : "Tulis Artikel"}
        </h2>

        {notice && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5"
          >
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="article-title"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Judul Artikel
          </label>
          <input
            id="article-title"
            required
            minLength={3}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="article-cover"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            URL Gambar Sampul
          </label>
          <input
            id="article-cover"
            value={form.coverImageUrl}
            onChange={(e) => update("coverImageUrl", e.target.value)}
            placeholder="https://..."
            className="form-input text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="article-content"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Isi Artikel
          </label>
          <textarea
            id="article-content"
            required
            minLength={10}
            rows={10}
            value={form.content}
            onChange={(e) => update("content", e.target.value)}
            placeholder="Tulis isi artikel. Pisahkan paragraf dengan baris kosong."
            className="form-input text-sm"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {form.content.trim().split(/\s+/).filter(Boolean).length} kata
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="article-status"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Status
            </label>
            <select
              id="article-status"
              value={form.status}
              onChange={(e) =>
                update("status", e.target.value as ArticleStatus)
              }
              className="form-input text-sm"
            >
              <option value="draft">Draft</option>
              <option value="terbit">Terbit</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="article-published"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Tanggal Terbit
            </label>
            <input
              id="article-published"
              type="date"
              value={form.publishedAt}
              onChange={(e) => update("publishedAt", e.target.value)}
              disabled={form.status === "draft"}
              className="form-input text-sm disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-sm font-bold disabled:opacity-60"
          >
            {saving
              ? "Menyimpan..."
              : editingId
                ? "Simpan Perubahan"
                : "Simpan Artikel"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-outline btn-sm"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
