import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const entries = sqliteTable("entries", {id:text("id").primaryKey(),kind:text("kind").notNull(),title:text("title").notNull(),body:text("body").notNull(),extra:text("extra").notNull(),created:text("created").notNull()});
export const loginAttempts = sqliteTable("login_attempts", {id:text("id").primaryKey(),count:text("count").notNull(),created:text("created").notNull()});
