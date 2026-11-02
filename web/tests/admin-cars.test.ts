import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { AdminCarPhoto } from "../src/lib/api";
import {
  AdminCarFormPage,
  buildCarPayload,
  movePhoto,
  parseFeatures,
  type FormState,
} from "../src/pages/admin/AdminCarFormPage";
import { AdminCarsPage, formatPrice } from "../src/pages/admin/AdminCarsPage";

const BASE_FORM: FormState = {
  brandId: "3f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8",
  title: "  Toyota Innova Zenix  ",
  slug: "",
  model: " Innova Zenix ",
  year: "2023",
  price: "180000000",
  transmission: "matic",
  mileage: "12000",
  fuelType: "bensin",
  engineCapacity: "",
  color: "",
  licensePlate: "",
  stnkValidUntil: "",
  description: "",
  features: "",
  status: "tersedia",
  isFeatured: false,
};

function photo(id: string, order: number): AdminCarPhoto {
  return {
    id,
    carId: "car-1",
    url: `/photo-${id}.jpg`,
    order,
    isPrimary: false,
  };
}

describe("Admin kelola mobil (T-29)", () => {
  it("formats price as Indonesian rupiah", () => {
    expect(formatPrice(180000000)).toBe("Rp 180.000.000");
    expect(formatPrice("52500000")).toBe("Rp 52.500.000");
  });

  it("parses feature list from commas and newlines", () => {
    expect(parseFeatures("AC, Power Window\nKamera Mundur")).toEqual([
      "AC",
      "Power Window",
      "Kamera Mundur",
    ]);
    expect(parseFeatures("   ,  ")).toEqual([]);
  });

  it("builds payload with trimmed text and numbers", () => {
    const payload = buildCarPayload(BASE_FORM);

    expect(payload.title).toBe("Toyota Innova Zenix");
    expect(payload.model).toBe("Innova Zenix");
    expect(payload.year).toBe(2023);
    expect(payload.price).toBe(180000000);
    expect(payload.mileage).toBe(12000);
    expect(payload.transmission).toBe("matic");
    expect(payload.features).toEqual([]);
  });

  it("drops blank optional fields and keeps filled ones", () => {
    const payload = buildCarPayload({
      ...BASE_FORM,
      engineCapacity: "",
      color: "Putih",
      stnkValidUntil: "2027-05-01",
    });

    expect(payload.engineCapacity).toBeNull();
    expect(payload.color).toBe("Putih");
    expect(payload.stnkValidUntil).toBe("2027-05-01");
    expect(payload.slug).toBeUndefined();
  });

  it("moves a photo up and renumbers order sequentially", () => {
    const photos = [photo("a", 0), photo("b", 1), photo("c", 2)];
    const moved = movePhoto(photos, 2, -1);

    expect(moved.map((p) => p.id)).toEqual(["a", "c", "b"]);
    expect(moved.map((p) => p.order)).toEqual([0, 1, 2]);
  });

  it("ignores moves outside the photo list bounds", () => {
    const photos = [photo("a", 0), photo("b", 1)];

    expect(movePhoto(photos, 0, -1)).toBe(photos);
    expect(movePhoto(photos, 1, 1)).toBe(photos);
  });

  it("renders the car list shell in loading state", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/admin/mobil"] },
        React.createElement(AdminCarsPage),
      ),
    );

    expect(html).toContain("Daftar Inventori Unit");
    expect(html).toContain("+ Tambah Unit Baru");
    expect(html).toContain("Semua Status");
    expect(html).toContain("Memuat daftar mobil...");
  });

  it("renders the new-car form with the core required fields", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/admin/mobil/baru"] },
        React.createElement(AdminCarFormPage),
      ),
    );

    expect(html).toContain("Tambah Unit Mobil");
    expect(html).toContain("Spesifikasi Dasar Kendaraan");
    expect(html).toContain("Harga Cash OTR");
    expect(html).toContain(
      "Simpan unit terlebih dahulu untuk mengunggah foto.",
    );
    expect(html).toContain('id="brandId"');
    expect(html).toContain('id="title"');
    expect(html).toContain('id="price"');
  });
});
