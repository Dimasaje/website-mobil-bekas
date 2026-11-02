import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
];
for (const p of envPaths) {
  if (existsSync(p)) {
    process.loadEnvFile(p);
    if (process.env.DATABASE_URL) break;
  }
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://postgres:password@localhost:5432/website_mobil_bekas",
  },
});
