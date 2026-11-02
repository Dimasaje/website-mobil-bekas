import { BrowserRouter, Route, Routes } from "react-router-dom";
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
      </Routes>
    </BrowserRouter>
  );
}
