import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "https://ex-cite.vercel.app",
  trustedOrigins: [
    "https://ex-cite.vercel.app",
    process.env.BETTER_AUTH_URL || "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.NEXT_PUBLIC_APP_URL || "",
    "http://localhost:3000",
  ].filter(Boolean),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: flip to true once Resend is wired up
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      // For now, log the verification URL. In production, integrate with Resend/SendGrid.
      console.log(`[Email Verification] Send to ${user.email}: ${url}`);
      // TODO: Replace with actual email sending (Resend, SendGrid, etc.)
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
