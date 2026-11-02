import { useSearchParams } from "react-router-dom";
import { ArticlesTab } from "./content/ArticlesTab";
import { PromosTab } from "./content/PromosTab";
import { SettingsTab } from "./content/SettingsTab";
import { TestimonialsTab } from "./content/TestimonialsTab";

export const CONTENT_TABS = [
  { id: "pengaturan", label: "Pengaturan Kontak & Kredit" },
  { id: "promo", label: "Kelola Promo Banner" },
  { id: "testimoni", label: "Kelola Testimoni" },
  { id: "artikel", label: "Kelola Artikel Tips" },
] as const;

export type ContentTabId = (typeof CONTENT_TABS)[number]["id"];

export function resolveTab(value: string | null): ContentTabId {
  return CONTENT_TABS.some((tab) => tab.id === value)
    ? (value as ContentTabId)
    : "pengaturan";
}

export function AdminContentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get("tab"));

  return (
    <div className="max-w-6xl">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">
          Pengaturan Showroom &amp; Konten
        </h1>
        <p className="text-sm text-slate-600">
          Konfigurasi website publik, promo, testimoni, dan artikel tips.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Bagian konten dan pengaturan"
        className="flex flex-wrap gap-1.5 border-b border-slate-200 mb-4 pb-2"
      >
        {CONTENT_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() =>
                setSearchParams({ tab: tab.id }, { replace: true })
              }
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === "pengaturan" && <SettingsTab />}
        {activeTab === "promo" && <PromosTab />}
        {activeTab === "testimoni" && <TestimonialsTab />}
        {activeTab === "artikel" && <ArticlesTab />}
      </div>
    </div>
  );
}
