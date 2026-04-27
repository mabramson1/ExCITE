import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load DATABASE_URL from .env.local (drizzle-kit doesn't auto-load Next.js env files)
function loadEnvLocal(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip matched surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL not found. Set it in .env.local or pass it inline:\n" +
      '  DATABASE_URL="postgres://..." npx drizzle-kit push'
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
