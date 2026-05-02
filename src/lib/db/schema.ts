import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  jsonb,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";

// ── Role enum ─────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "free",    // Free tier (10 credits/month)
  "pro",     // Paid tier 1 ($19/mo, 100 credits/month)
  "unlimited", // Paid tier 2 ($39/mo, 500 credits/month fair-use cap)
  "admin",   // Full platform access
]);

// ── Auth tables (Better Auth) ──────────────────────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("free"),
  lastCreditWarning: timestamp("last_credit_warning"),
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
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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

// ── User Preferences ──────────────────────────────────────────────
// Non-PHI preferences that should sync across devices.
// Voice samples may include the USER's writing — they're shared with Claude
// during analysis anyway, so storing them server-side adds no privacy risk.
// PHI-bearing data (tokenMaps, raw patient input) stays in localStorage only.

export const userPreference = pgTable("user_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  voiceSampleClinical: text("voice_sample_clinical"), // for A/P writer
  voiceSampleGeneral: text("voice_sample_general"), // for de-ai-ifier
  defaultBrevity: text("default_brevity").default("standard"), // brief|standard|detailed
  defaultWritingStyle: text("default_writing_style").default("general"),
  defaultCitationStyle: citationStyleEnum("default_citation_style"),
  customTemplates: jsonb("custom_templates").$type<Array<{ name: string; template: string }>>(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Billing tables ────────────────────────────────────────────────

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("free"), // free, pro, unlimited
  status: text("status").notNull().default("active"), // active, canceled, past_due
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Usage meter ───────────────────────────────────────────────────
// One row per Claude API call. Tracks credit cost (per-tool weight) and
// raw token counts so admins can audit COGS and users can see their usage.
export const usageMeter = pgTable("usage_meter", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tool: text("tool").notNull(), // e.g. "ap_writer", "manuscript_writer"
  credits: integer("credits").notNull(), // 1 or 2
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
  // Cost in tenths of a cent (millicents) so we can store sub-cent values as int
  costMillicents: integer("cost_millicents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UsageMeter = typeof usageMeter.$inferSelect;

// ── Shared Template Marketplace ──────────────────────────────────────
export const sharedTemplate = pgTable("shared_template", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // e.g. "cardiology", "endocrine", "general"
  skeleton: text("skeleton").notNull(), // the actual template text
  starCount: integer("star_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const templateStar = pgTable("template_star", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").notNull().references(() => sharedTemplate.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.templateId] })]);

// ── Citation Library ─────────────────────────────────────────────
export const citationLibrary = pgTable("citation_library", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  pmid: text("pmid"),
  doi: text("doi"),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  journal: text("journal"),
  year: text("year"),
  tags: jsonb("tags").$type<string[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types
export type User = typeof user.$inferSelect;
export type Project = typeof project.$inferSelect;
export type Citation = typeof citation.$inferSelect;
export type TemplateFavorite = typeof templateFavorite.$inferSelect;
export type Subscription = typeof subscription.$inferSelect;
export type UserPreference = typeof userPreference.$inferSelect;
export type SharedTemplate = typeof sharedTemplate.$inferSelect;
export type TemplateStar = typeof templateStar.$inferSelect;
export type CitationLibraryEntry = typeof citationLibrary.$inferSelect;
export type ProjectType = "clinical_note" | "manuscript" | "deai" | "ai_detector";
export type CitationStyle = "apa" | "mla" | "chicago" | "vancouver" | "harvard" | "ieee";
