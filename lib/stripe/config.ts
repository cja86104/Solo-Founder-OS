// lib/stripe/config.ts
//
// Founder's Helm sells two products via Stripe:
//   1. Pro Monthly  — recurring subscription
//   2. Lifetime     — one-time payment
//
// A Pro Yearly tier was previously scaffolded but is not part of the live
// product offering and was removed on 2026-05-31. If you intend to re-add
// yearly billing, restore:
//   - the STRIPE_PRO_YEARLY_PRICE_ID lookup in PRICE_IDS below
//   - PRICE_IDS.PRO_YEARLY
//   - the PRO_YEARLY clause inside isSubscriptionPrice()
//   - the `interval` parameter handling in app/api/stripe/checkout/route.ts
//   - any UI affordance for yearly billing in components/settings/billing/*
// Do NOT re-add a hard-required env check at module load without all of the
// above in place — a stale hard-required env that no code path uses will
// break production builds (exactly the bug that motivated this cleanup).
//
// 2026-06-29 update: env validation is now lazy. The previous
// `if (!process.env.X) throw ...` block at module top fired during
// `next build`'s page-data collection step (which evaluates route modules
// for metadata), making builds fail without secrets. The Stripe client and
// each price ID are now resolved on first access. Behavior at runtime is
// unchanged — a missing env still throws the same "Missing required
// environment variable: X" error, just at the call site instead of at boot.

import Stripe from 'stripe';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Lazy Stripe client. Constructed on first property access (e.g. `stripe.customers.list`).
// A Proxy lets every existing call site keep using `stripe.x.y(...)` unchanged.
let stripeInstance: Stripe | undefined;
function getStripeClient(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeClient(), prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(getStripeClient(), prop);
  },
}) as Stripe;

// Lazy price IDs. Getter-backed so `PRICE_IDS.PRO_MONTHLY` keeps working,
// but validation happens only when the value is actually read.
// Note: tightened to `string` (vs. previous `string | undefined`) — the
// getter throws on missing env, so it never resolves to undefined.
export const PRICE_IDS: { readonly PRO_MONTHLY: string; readonly LIFETIME: string } = Object.freeze({
  get PRO_MONTHLY(): string {
    return requireEnv('STRIPE_PRO_MONTHLY_PRICE_ID');
  },
  get LIFETIME(): string {
    return requireEnv('STRIPE_LIFETIME_PRICE_ID');
  },
});

// Product configuration
export const PRODUCTS = {
  pro: {
    name: 'Pro',
    description: 'Everything you need to run your solo business',
    features: [
      '5 workspaces',
      'Unlimited landing pages',
      '10,000 contacts',
      'Unlimited vault items',
      'All products',
      '5 team members',
      'API access',
      'Priority support',
    ],
  },
  lifetime: {
    name: 'Lifetime',
    description: 'One-time payment, lifetime access',
    features: [
      'Everything in Pro',
      'Unlimited workspaces',
      'Unlimited team members',
      'White-label option',
      'All future products',
    ],
  },
} as const;

// Stripe subscription status mapping
export const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid',
  incomplete: 'incomplete',
  incomplete_expired: 'incomplete_expired',
  paused: 'paused',
};

// Helper to check if a price is for a subscription.
// With yearly removed, the only subscription price is monthly.
export function isSubscriptionPrice(priceId: string): boolean {
  return priceId === PRICE_IDS.PRO_MONTHLY;
}

// Helper to check if a price is for lifetime
export function isLifetimePrice(priceId: string): boolean {
  return priceId === PRICE_IDS.LIFETIME;
}
