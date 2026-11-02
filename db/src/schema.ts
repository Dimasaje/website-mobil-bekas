import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("ok"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});
