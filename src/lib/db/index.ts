import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Supabase uses connection pooling via PgBouncer in transaction mode,
// which requires prepare: false
const client = postgres(connectionString, {
  prepare: false,
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
});

export const db = drizzle(client, { schema });
