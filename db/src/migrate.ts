import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { join } from "node:path";
import { DATABASE_URL } from "./env";

const client = new SQL(DATABASE_URL);
const db = drizzle({ client });

console.log("Menjalankan migrasi database...");
await migrate(db, { migrationsFolder: join(import.meta.dir, "../drizzle") });
console.log("Migrasi selesai!");
await client.close();
