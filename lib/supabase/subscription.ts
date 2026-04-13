import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Checks whether the user has an active subscription (trial, pro, or lifetime).
 *
 * Returns null  → subscription is active, continue the request.
 * Returns NextResponse → subscription is expired/missing, return this 402 immediately.
 *
 * Usage in any write API route after auth + membership checks:
 *
 *   const blocked = await requireActiveSubscription(supabase, user.id);
 *   if (blocked) return blocked;
 */
export async function requireActiveSubscription(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<NextResponse | null> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', userId)
    .single();

  if (!subscription) {
    return NextResponse.json(
      {
        error: 'Subscription required',
        message: 'An active subscription is required to perform this action. Visit /settings/billing to upgrade.',
      },
      { status: 402 }
    );
  }

  const { plan, status, trial_ends_at } = subscription;
  const now = new Date();

  // Active trial — plan is 'trial', status is 'trialing', not yet expired
  if (
    plan === 'trial' &&
    status === 'trialing' &&
    trial_ends_at &&
    new Date(trial_ends_at) > now
  ) {
    return null;
  }

  // Active pro subscription — allow past_due too (Stripe is still retrying)
  if (plan === 'pro' && ['active', 'past_due', 'trialing'].includes(status ?? '')) {
    return null;
  }

  // Lifetime — always active
  if (plan === 'lifetime') {
    return null;
  }

  // Everything else: expired trial, canceled, unpaid, etc.
  return NextResponse.json(
    {
      error: 'Subscription required',
      message:
        plan === 'trial'
          ? 'Your free trial has expired. Visit /settings/billing to upgrade and continue.'
          : 'Your subscription is inactive. Visit /settings/billing to reactivate.',
    },
    { status: 402 }
  );
}
