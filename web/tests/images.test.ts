import { describe, expect, it } from "bun:test";
import {
  CARD_IMAGE_SIZES,
  DETAIL_IMAGE_SIZES,
  imageSources,
  imageVariant,
} from "../src/lib/images";

const LARGE = "/uploads/cars/car-1/photo-1-large.webp";

describe("image variants (T-35)", () => {
  it("builds a srcSet with thumb, medium and large widths", () => {
    const { src, srcSet } = imageSources(LARGE);

    expect(src).toBe("/uploads/cars/car-1/photo-1-medium.webp");
    expect(srcSet).toBe(
      "/uploads/cars/car-1/photo-1-thumb.webp 400w, /uploads/cars/car-1/photo-1-medium.webp 800w, /uploads/cars/car-1/photo-1-large.webp 1600w",
    );
  });

  it("derives from any existing variant, not only the large one", () => {
    expect(imageSources("/uploads/cars/car-1/photo-1-thumb.webp").src).toBe(
      "/uploads/cars/car-1/photo-1-medium.webp",
    );
  });

  it("leaves external or legacy URLs untouched", () => {
    const url = "https://cdn.example/foto.jpg";

    expect(imageSources(url)).toEqual({ src: url });
    expect(imageVariant(url, "thumb")).toBe(url);
    expect(imageSources("/uploads/logo.png").srcSet).toBeUndefined();
  });

  it("picks a single variant for thumbnails and zoom", () => {
    expect(imageVariant(LARGE, "thumb")).toBe(
      "/uploads/cars/car-1/photo-1-thumb.webp",
    );
    expect(imageVariant(LARGE, "large")).toBe(LARGE);
  });

  it("uses layout-aware sizes attributes", () => {
    expect(CARD_IMAGE_SIZES).toContain("33vw");
    expect(DETAIL_IMAGE_SIZES).toContain("66vw");
  });
});
