import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/admin/AdminLayout";
import { Layout } from "./components/layout/Layout";
import { LoadingSpinner } from "./components/common/LoadingSpinner";

// Code-splitting per halaman: tiap rute dimuat saat dibutuhkan, jadi bundle
// awal hanya berisi shell + beranda.
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const CatalogPage = lazy(() =>
  import("./pages/CatalogPage").then((m) => ({ default: m.CatalogPage })),
);
const CarDetailPage = lazy(() =>
  import("./pages/CarDetailPage").then((m) => ({ default: m.CarDetailPage })),
);
const CreditPage = lazy(() =>
  import("./pages/CreditPage").then((m) => ({ default: m.CreditPage })),
);
const TradeInPage = lazy(() =>
  import("./pages/TradeInPage").then((m) => ({ default: m.TradeInPage })),
);
const TestimonialsPage = lazy(() =>
  import("./pages/TestimonialsPage").then((m) => ({
    default: m.TestimonialsPage,
  })),
);
const ArticlesPage = lazy(() =>
  import("./pages/ArticlesPage").then((m) => ({ default: m.ArticlesPage })),
);
const ArticleDetailPage = lazy(() =>
  import("./pages/ArticleDetailPage").then((m) => ({
    default: m.ArticleDetailPage,
  })),
);
const ContactPage = lazy(() =>
  import("./pages/ContactPage").then((m) => ({ default: m.ContactPage })),
);
const PageNotFound = lazy(() =>
  import("./pages/PageNotFound").then((m) => ({ default: m.PageNotFound })),
);

// Admin dimuat terpisah; pengunjung publik tidak pernah mengunduhnya.
const AdminLoginPage = lazy(() =>
  import("./pages/admin/AdminLoginPage").then((m) => ({
    default: m.AdminLoginPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminCarsPage = lazy(() =>
  import("./pages/admin/AdminCarsPage").then((m) => ({
    default: m.AdminCarsPage,
  })),
);
const AdminCarFormPage = lazy(() =>
  import("./pages/admin/AdminCarFormPage").then((m) => ({
    default: m.AdminCarFormPage,
  })),
);
const AdminLeadsPage = lazy(() =>
  import("./pages/admin/AdminLeadsPage").then((m) => ({
    default: m.AdminLeadsPage,
  })),
);
const AdminContentPage = lazy(() =>
  import("./pages/admin/AdminContentPage").then((m) => ({
    default: m.AdminContentPage,
  })),
);

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="py-16">
          <LoadingSpinner message="Memuat halaman..." />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <PageSuspense>
                <HomePage />
              </PageSuspense>
            }
          />
          <Route
            path="katalog"
            element={
              <PageSuspense>
                <CatalogPage />
              </PageSuspense>
            }
          />
          <Route
            path="katalog/:slug"
            element={
              <PageSuspense>
                <CarDetailPage />
              </PageSuspense>
            }
          />
          <Route
            path="simulasi-kredit"
            element={
              <PageSuspense>
                <CreditPage />
              </PageSuspense>
            }
          />
          <Route
            path="tukar-tambah"
            element={
              <PageSuspense>
                <TradeInPage />
              </PageSuspense>
            }
          />
          <Route
            path="testimoni"
            element={
              <PageSuspense>
                <TestimonialsPage />
              </PageSuspense>
            }
          />
          <Route
            path="artikel"
            element={
              <PageSuspense>
                <ArticlesPage />
              </PageSuspense>
            }
          />
          <Route
            path="artikel/:slug"
            element={
              <PageSuspense>
                <ArticleDetailPage />
              </PageSuspense>
            }
          />
          <Route
            path="kontak"
            element={
              <PageSuspense>
                <ContactPage />
              </PageSuspense>
            }
          />
          <Route
            path="*"
            element={
              <PageSuspense>
                <PageNotFound />
              </PageSuspense>
            }
          />
        </Route>

        {/* Admin */}
        <Route
          path="/admin/login"
          element={
            <PageSuspense>
              <AdminLoginPage />
            </PageSuspense>
          }
        />
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <PageSuspense>
                <AdminDashboardPage />
              </PageSuspense>
            }
          />
          <Route
            path="mobil"
            element={
              <PageSuspense>
                <AdminCarsPage />
              </PageSuspense>
            }
          />
          <Route
            path="mobil/baru"
            element={
              <PageSuspense>
                <AdminCarFormPage />
              </PageSuspense>
            }
          />
          <Route
            path="mobil/:id"
            element={
              <PageSuspense>
                <AdminCarFormPage />
              </PageSuspense>
            }
          />
          <Route
            path="leads"
            element={
              <PageSuspense>
                <AdminLeadsPage />
              </PageSuspense>
            }
          />
          <Route
            path="konten"
            element={
              <PageSuspense>
                <AdminContentPage />
              </PageSuspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
