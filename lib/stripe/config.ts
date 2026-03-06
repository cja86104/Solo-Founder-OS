import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

if (!process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
  throw new Error('Missing required environment variable: STRIPE_PRO_MONTHLY_PRICE_ID');
}

if (!process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
  throw new Error('Missing required environment variable: STRIPE_PRO_YEARLY_PRICE_ID');
}

if (!process.env.STRIPE_LIFETIME_PRICE_ID) {
  throw new Error('Missing required environment variable: STRIPE_LIFETIME_PRICE_ID');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  LIFETIME: process.env.STRIPE_LIFETIME_PRICE_ID,
} as const;

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

// Helper to check if a price is for a subscription
export function isSubscriptionPrice(priceId: string): boolean {
  return priceId === PRICE_IDS.PRO_MONTHLY || priceId === PRICE_IDS.PRO_YEARLY;
}

// Helper to check if a price is for lifetime
export function isLifetimePrice(priceId: string): boolean {
  return priceId === PRICE_IDS.LIFETIME;
}
