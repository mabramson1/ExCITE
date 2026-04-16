import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── Auth tables (Better Auth) ──────────────────────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Application tables ─────────────────────────────────────────────

export const projectTypeEnum = pgEnum("project_type", [
  "clinical_note",
  "manuscript",
  "deai",
  "ai_detector",
]);

export const citationStyleEnum = pgEnum("citation_style", [
  "apa",
  "mla",
  "chicago",
  "vancouver",
  "harvard",
  "ieee",
]);

export const project = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: projectTypeEnum("type").notNull(),
  inputText: text("input_text").notNull(),
  outputText: text("output_text"),
  citationStyle: citationStyleEnum("citation_style"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  phiDetected: boolean("phi_detected").notNull().default(false),
  favorite: boolean("favorite").notNull().default(false),
  shareId: text("share_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const citation = pgTable("citation", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  originalText: text("original_text"),
  citedText: text("cited_text").notNull(),
  source: text("source"),
  codeType: text("code_type"), // ICD-10, CPT, etc.
  codeValue: text("code_value"),
  confidence: text("confidence"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const templateFavorite = pgTable(
  "template_favorite",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.templateId] })]
);

// Types
export type User = typeof user.$inferSelect;
export type Project = typeof project.$inferSelect;
export type Citation = typeof citation.$inferSelect;
export type TemplateFavorite = typeof templateFavorite.$inferSelect;
export type ProjectType = "clinical_note" | "manuscript" | "deai" | "ai_detector";
export type CitationStyle = "apa" | "mla" | "chicago" | "vancouver" | "harvard" | "ieee";
