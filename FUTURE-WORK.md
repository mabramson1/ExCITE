# exCITE — Incomplete Features & Future Work

Last updated: 2026-04-18

## Requires External Setup (Keys/Accounts Needed)

### Google SSO
- **Status**: Code complete, needs credentials
- **Files**: `src/lib/auth.ts` (socialProviders.google), `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`
- **To activate**:
  1. Create OAuth 2.0 app at https://console.cloud.google.com
  2. Set authorized redirect URI: `https://<your-domain>/api/auth/callback/google`
  3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel env vars

### Email Verification
- **Status**: Code complete, disabled for testing
- **Files**: `src/lib/auth.ts` (line 32: `requireEmailVerification: false`), `src/app/(auth)/sign-up/page.tsx` (redirect to `/dashboard` instead of `/verify-email`), `src/app/(auth)/verify-email/page.tsx`
- **To activate**:
  1. Sign up at https://resend.com (free: 3k emails/month)
  2. Add `RESEND_API_KEY` to Vercel env vars
  3. Replace `console.log` in `sendVerificationEmail` (auth.ts) with Resend API call
  4. Flip `requireEmailVerification` to `true`
  5. Change sign-up redirect from `/dashboard` to `/verify-email`

### Stripe Billing
- **Status**: Code complete (checkout, webhook, portal, pricing page, usage tracking), needs Stripe account
- **Files**: `src/lib/stripe.ts`, `src/lib/usage.ts`, `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/webhook/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/(app)/pricing/page.tsx`, `src/lib/db/schema.ts` (subscription table)
- **To activate**:
  1. Create Stripe account at https://dashboard.stripe.com
  2. Create 2 products: Pro ($19/mo), Unlimited ($39/mo) — grab Price IDs
  3. Create webhook endpoint: `https://<your-domain>/api/billing/webhook`
     - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  4. Add to Vercel env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_UNLIMITED_PRICE_ID`
  5. Run `npm run db:push` to create the `subscription` table in the database

### Database Migration
- **Status**: Schema defined, table not yet created in production DB
- **What**: The `subscription` table needs to be pushed to the database
- **To do**: Run `npm run db:push` from a machine with `DATABASE_URL` set

### Custom Domain
- **Status**: Not started
- **To do**:
  1. Buy a domain
  2. Add to Vercel: Project Settings → Domains
  3. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` env vars
  4. Update `trustedOrigins` in `src/lib/auth.ts`
  5. Update OAuth redirect URIs and Stripe webhook URL

## Usage Enforcement (Not Wired Yet)

### Rate Limiting by Plan
- **Status**: `src/lib/usage.ts` has `checkUsageLimit()` and `getUsageStats()`, but the API routes don't call them yet
- **To do**: Add `checkUsageLimit(userId)` call at the top of each `/api/analyze/*` route, return 402 if over limit
- **Files to edit**: All 5 routes in `src/app/api/analyze/`

### Dashboard Stats
- **Status**: Dashboard shows placeholder "--" values
- **To do**: Fetch actual counts from the `project` table using `getUsageStats()`
- **File**: `src/app/(app)/dashboard/page.tsx`

## Product Improvements (Future)

- [ ] Rename "De-AI-ifier" → "Writing Style Editor" or "Voice Coach" (safer positioning)
- [ ] Compliance Report export (single PDF: citations + AI score + PHI summary)
- [ ] Institutional/team licensing
- [ ] Journal submission formatter (NEJM, JAMA, Lancet format templates)
- [ ] PRISMA/CONSORT checklist integration for systematic reviews
- [ ] Side-by-side diff view on De-AI-ifier (original vs. humanized)
- [ ] PWA support (web app manifest for mobile install)
- [ ] Feedback/bug report widget
