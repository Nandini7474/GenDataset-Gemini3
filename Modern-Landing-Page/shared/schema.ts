import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  description: text("description"),
  rowCount: integer("row_count").notNull(),
  colCount: integer("col_count").notNull(),
  schema: jsonb("schema").$type<Array<{ name: string; type: string; required: boolean }>>().notNull(),
});

export const insertDatasetSchema = createInsertSchema(datasets).omit({ id: true });

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;
