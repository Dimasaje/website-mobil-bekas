export interface AdminSectionPlaceholderProps {
  title: string;
  description: string;
}

export function AdminSectionPlaceholder({
  title,
  description,
}: AdminSectionPlaceholderProps) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">{title}</h1>
      <p className="text-sm text-slate-600 mb-6">{description}</p>

      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
        <div className="text-3xl mb-2" aria-hidden="true">
          🚧
        </div>
        <p className="text-sm font-semibold text-slate-800">
          Modul ini sedang disiapkan
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Halaman {title} akan aktif pada tiket pengembangan berikutnya.
        </p>
      </div>
    </div>
  );
}
