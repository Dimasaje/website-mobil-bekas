import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { DATABASE_URL } from "./env";
import * as schema from "./schema";

export const client = new SQL(DATABASE_URL);
export const db = drizzle({ client, schema });

export * from "./schema";
export { DATABASE_URL };
