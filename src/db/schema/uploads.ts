import {
  pgEnum,
  pgTable,
  integer,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const uploadStatus = pgEnum("upload_status", ["PENDING", "UPLOADED"]);

// One row per object handed a presigned PUT URL. `key` is the S3 object
// key, structured {ownerId}/{entity}/{id}/{filename} — see
// src/lib/storage/CLAUDE.md. `size` is the size the client declared when
// requesting the upload, not a verified value.
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  entity: text("entity").notNull(),
  key: text("key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size"),
  status: uploadStatus("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
