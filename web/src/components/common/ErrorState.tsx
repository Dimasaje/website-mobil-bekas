export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat data dari server. Silakan coba beberapa saat lagi.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-md mx-auto my-6 ${className}`.trim()}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
        ⚠️
      </div>
      <h3 className="text-lg font-bold text-red-900 mb-1">{title}</h3>
      <p className="text-sm text-red-700 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-outline btn-sm bg-white border-red-300 text-red-800 hover:bg-red-100"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
