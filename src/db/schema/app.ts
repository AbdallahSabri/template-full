import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Example domain table — replace with real tables as the app grows.
// Every column that scopes ownership (e.g. a future `userId`) must be
// queried through src/db/queries/, never read directly elsewhere.
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
