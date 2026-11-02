import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const candidates = [
  resolve(process.cwd(), ".env"),
  resolve(import.meta.dir, "../../.env"),
  resolve(import.meta.dir, "../.env"),
];
for (const p of candidates) {
  if (existsSync(p)) {
    process.loadEnvFile?.(p);
    if (process.env.DATABASE_URL) break;
  }
}

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:password@localhost:5432/website_mobil_bekas"),
  SHOWROOM_NAME: z.string().default("Bintang Mobil"),
});

export const env = envSchema.parse(process.env);
