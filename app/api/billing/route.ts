import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/billing is not used.
// Checkout → /api/stripe/checkout
// Portal   → /api/stripe/portal

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subscription, error } = await (supabase
      .from('subscriptions') as any)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    return NextResponse.json({
      subscription: subscription || {
        plan: 'expired',
        status: 'expired',
      },
    });
  } catch (error) {
    console.error('Billing GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
