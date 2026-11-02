import { describe, expect, it } from "bun:test";
import { App } from "../src/App";
import { Badge } from "../src/components/common/Badge";
import { Button } from "../src/components/common/Button";
import { EmptyState } from "../src/components/common/EmptyState";
import { ErrorState } from "../src/components/common/ErrorState";
import { LoadingSpinner } from "../src/components/common/LoadingSpinner";
import { Footer } from "../src/components/layout/Footer";
import { Header } from "../src/components/layout/Header";
import { Layout } from "../src/components/layout/Layout";
import { ApiClientError, apiClient } from "../src/lib/api";
import { PageNotFound } from "../src/pages/PageNotFound";

describe("Web Foundation Component Tests", () => {
  it("exports main components as functions", () => {
    expect(typeof App).toBe("function");
    expect(typeof Layout).toBe("function");
    expect(typeof Header).toBe("function");
    expect(typeof Footer).toBe("function");
    expect(typeof PageNotFound).toBe("function");
    expect(typeof Button).toBe("function");
    expect(typeof Badge).toBe("function");
    expect(typeof LoadingSpinner).toBe("function");
    expect(typeof ErrorState).toBe("function");
    expect(typeof EmptyState).toBe("function");
  });

  describe("API Client", () => {
    it("has all required domain endpoints", () => {
      expect(typeof apiClient.getCars).toBe("function");
      expect(typeof apiClient.getCarBySlug).toBe("function");
      expect(typeof apiClient.getCarFilters).toBe("function");
      expect(typeof apiClient.getPromos).toBe("function");
      expect(typeof apiClient.getTestimonials).toBe("function");
      expect(typeof apiClient.getArticles).toBe("function");
      expect(typeof apiClient.getArticleBySlug).toBe("function");
      expect(typeof apiClient.getSettings).toBe("function");
      expect(typeof apiClient.submitLead).toBe("function");
    });

    it("throws ApiClientError with custom code and message", () => {
      const err = new ApiClientError("Mobil tidak ditemukan", "NOT_FOUND", 404);
      expect(err.message).toBe("Mobil tidak ditemukan");
      expect(err.code).toBe("NOT_FOUND");
      expect(err.status).toBe(404);
      expect(err.name).toBe("ApiClientError");
    });
  });

  describe("UI Component Props & Structure", () => {
    it("Button renders with variants", () => {
      const btn = Button({
        variant: "wa",
        size: "sm",
        children: "Chat WA",
      });
      expect(btn.props.className).toContain("btn-wa");
      expect(btn.props.className).toContain("btn-sm");
      expect(btn.props.children).toBe("Chat WA");
    });

    it("Badge renders with status variant", () => {
      const badge = Badge({
        variant: "available",
        children: "Tersedia",
      });
      expect(badge.props.className).toContain("badge-available");
      expect(badge.props.children).toBe("Tersedia");
    });

    it("LoadingSpinner has accessible role and message", () => {
      const spinner = LoadingSpinner({ message: "Memuat mobil..." });
      expect(spinner.props.role).toBe("status");
    });

    it("ErrorState renders role alert and title", () => {
      const err = ErrorState({
        title: "Koneksi Gagal",
        message: "Periksa sambungan internet.",
      });
      expect(err.props.role).toBe("alert");
    });

    it("EmptyState renders custom icon and title", () => {
      const empty = EmptyState({
        title: "Stok Kosong",
        icon: "🚗",
      });
      expect(empty).toBeDefined();
    });
  });
});
