import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendVerificationEmail } from "./email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "https://docsquared.app",
  trustedOrigins: [
    "https://docsquared.app",
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
    // Auto-enables once RESEND_API_KEY is set on Vercel.
    requireEmailVerification: !!process.env.RESEND_API_KEY,
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      const result = await sendVerificationEmail({ to: user.email, url, name: user.name });
      if (!result.ok) {
        console.error(`[Auth] Verification email failed for ${user.email}: ${result.error}. URL: ${url}`);
      } else {
        console.log(`[Auth] Verification email sent to ${user.email}`);
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
