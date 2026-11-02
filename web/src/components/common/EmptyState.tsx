export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "Belum Ada Data",
  description = "Tidak ada item yang ditemukan untuk kriteria pencarian ini.",
  icon = "🚗",
  actionText,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-8 text-center max-w-md mx-auto my-8 ${className}`.trim()}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-5">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary btn-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
