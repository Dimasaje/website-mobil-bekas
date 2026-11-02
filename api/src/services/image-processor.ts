import sharp from "sharp";
import { defaultStorage, type StorageDriver } from "./storage";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ProcessedImageResult {
  photoId: string;
  originalKey: string;
  largeKey: string;
  mediumKey: string;
  thumbKey: string;
  largeUrl: string;
  mediumUrl: string;
  thumbUrl: string;
}

export class ImageProcessor {
  private storage: StorageDriver;

  constructor(storage: StorageDriver = defaultStorage) {
    this.storage = storage;
  }

  async processCarPhoto(
    carId: string,
    buffer: Buffer | Uint8Array,
    mimeType: string,
  ): Promise<ProcessedImageResult> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `Format file tidak didukung: ${mimeType}. Format yang diizinkan: JPG, PNG, WebP.`,
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error("Ukuran file melebihi batas maksimum 10MB");
    }

    const photoId = crypto.randomUUID();
    const basePath = `cars/${carId}/${photoId}`;

    // Large (max width 1600)
    const largeBuffer = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const largeKey = `${basePath}-large.webp`;
    const largeUrl = await this.storage.save(
      largeKey,
      largeBuffer,
      "image/webp",
    );

    // Medium (max width 800)
    const mediumBuffer = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const mediumKey = `${basePath}-medium.webp`;
    const mediumUrl = await this.storage.save(
      mediumKey,
      mediumBuffer,
      "image/webp",
    );

    // Thumbnail (max width 400)
    const thumbBuffer = await sharp(buffer)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const thumbKey = `${basePath}-thumb.webp`;
    const thumbUrl = await this.storage.save(
      thumbKey,
      thumbBuffer,
      "image/webp",
    );

    return {
      photoId,
      originalKey: largeKey,
      largeKey,
      mediumKey,
      thumbKey,
      largeUrl,
      mediumUrl,
      thumbUrl,
    };
  }

  async deleteCarPhotoFiles(url: string): Promise<void> {
    // URL pattern: /uploads/cars/{carId}/{photoId}-large.webp
    const match = url.match(
      /\/uploads\/(cars\/[^/]+\/[^/]+)-(?:large|medium|thumb)\.webp$/,
    );
    if (match) {
      const baseKey = match[1];
      await this.storage.delete(`${baseKey}-large.webp`);
      await this.storage.delete(`${baseKey}-medium.webp`);
      await this.storage.delete(`${baseKey}-thumb.webp`);
    } else {
      // Fallback relative path
      const key = url.replace(/^\/?uploads\//, "");
      await this.storage.delete(key);
    }
  }
}

export const imageProcessor = new ImageProcessor();
