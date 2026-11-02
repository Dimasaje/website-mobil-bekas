import { existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(import.meta.dir, "../../.env"),
    resolve(import.meta.dir, "../.env"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      process.loadEnvFile(path);
      if (process.env.DATABASE_URL) break;
    }
  }
}

loadEnv();

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:password@localhost:5432/website_mobil_bekas";
