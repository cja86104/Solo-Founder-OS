import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Checkout and portal are handled by /api/stripe/checkout and /api/stripe/portal
    return NextResponse.json({
      error: `Unknown billing action: ${action}`,
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's subscription
    const { data: subscription } = await (supabase
      .from('subscriptions') as any)
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      subscription: subscription || {
        plan: 'expired',
        status: 'expired',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

