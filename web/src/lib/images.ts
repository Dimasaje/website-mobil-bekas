// Varian gambar dari #13: setiap foto disimpan sebagai <base>-thumb.webp (400w),
// <base>-medium.webp (800w), dan <base>-large.webp (1600w). Helper ini memetakan
// URL apa pun ke srcSet yang sesuai; URL di luar pola itu dibiarkan apa adanya.
const VARIANT_PATTERN = /-(?:large|medium|thumb)\.webp$/;

export const CARD_IMAGE_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
export const DETAIL_IMAGE_SIZES = "(min-width: 1024px) 66vw, 100vw";

export interface ImageSources {
  src: string;
  srcSet?: string;
}

export function imageSources(url: string): ImageSources {
  if (!VARIANT_PATTERN.test(url)) return { src: url };

  const base = url.replace(VARIANT_PATTERN, "");

  return {
    src: `${base}-medium.webp`,
    srcSet: [
      `${base}-thumb.webp 400w`,
      `${base}-medium.webp 800w`,
      `${base}-large.webp 1600w`,
    ].join(", "),
  };
}

// Thumbnail strip dan modal zoom butuh satu varian spesifik, bukan srcSet.
export function imageVariant(
  url: string,
  variant: "thumb" | "medium" | "large",
): string {
  if (!VARIANT_PATTERN.test(url)) return url;
  return `${url.replace(VARIANT_PATTERN, "")}-${variant}.webp`;
}
