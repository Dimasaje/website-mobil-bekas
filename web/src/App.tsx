import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/admin/AdminLayout";
import { Layout } from "./components/layout/Layout";
import { ArticleDetailPage } from "./pages/ArticleDetailPage";
import { ArticlesPage } from "./pages/ArticlesPage";
import { CarDetailPage } from "./pages/CarDetailPage";
import { CatalogPage } from "./pages/CatalogPage";
import { ContactPage } from "./pages/ContactPage";
import { CreditPage } from "./pages/CreditPage";
import { HomePage } from "./pages/HomePage";
import { PageNotFound } from "./pages/PageNotFound";
import { TestimonialsPage } from "./pages/TestimonialsPage";
import { TradeInPage } from "./pages/TradeInPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminSectionPlaceholder } from "./pages/admin/AdminSectionPlaceholder";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="katalog" element={<CatalogPage />} />
          <Route path="katalog/:slug" element={<CarDetailPage />} />
          <Route path="simulasi-kredit" element={<CreditPage />} />
          <Route path="tukar-tambah" element={<TradeInPage />} />
          <Route path="testimoni" element={<TestimonialsPage />} />
          <Route path="artikel" element={<ArticlesPage />} />
          <Route path="artikel/:slug" element={<ArticleDetailPage />} />
          <Route path="kontak" element={<ContactPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route
            path="mobil"
            element={
              <AdminSectionPlaceholder
                title="Kelola Stok Mobil"
                description="Daftar unit, tambah unit baru, dan update status stok."
              />
            }
          />
          <Route
            path="leads"
            element={
              <AdminSectionPlaceholder
                title="Leads & Prospek"
                description="Tindak lanjuti pengajuan tukar tambah, test drive, dan kontak."
              />
            }
          />
          <Route
            path="konten"
            element={
              <AdminSectionPlaceholder
                title="Konten & Pengaturan"
                description="Artikel, promo, testimoni, dan pengaturan situs."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
