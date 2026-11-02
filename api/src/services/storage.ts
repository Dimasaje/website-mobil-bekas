import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface StorageDriver {
  save(
    key: string,
    buffer: Buffer | Uint8Array,
    contentType: string,
  ): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

export class LocalStorageDriver implements StorageDriver {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir?: string, baseUrl: string = "/uploads") {
    this.baseDir = baseDir || resolve(process.cwd(), "uploads");
    this.baseUrl = baseUrl;
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async save(key: string, buffer: Buffer | Uint8Array): Promise<string> {
    const fullPath = join(this.baseDir, key);
    const parentDir = dirname(fullPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }
    await Bun.write(fullPath, buffer);
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.baseDir, key);
    if (existsSync(fullPath)) {
      try {
        unlinkSync(fullPath);
      } catch {
        // Ignored if file cannot be deleted
      }
    }
  }

  getUrl(key: string): string {
    const normalized = key.replace(/\\/g, "/");
    return `${this.baseUrl}/${normalized}`;
  }

  getBaseDir(): string {
    return this.baseDir;
  }
}

export const defaultStorage = new LocalStorageDriver();
