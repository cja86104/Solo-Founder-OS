import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireActiveSubscription } from '@/lib/supabase/subscription';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .select(`
        *,
        stage:pipeline_stages(*),
        contact:contacts(id, email, name)
      `)
      .eq('id', id)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', deal.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const { data: activities } = await supabase
      .from('deal_activities')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ deal, activities: activities || [] });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingDeal } = await supabase
      .from('deals')
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingDeal.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Subscription gate — block expired/non-paying users from write operations
    const subscriptionBlocked = await requireActiveSubscription(supabase, user.id);
    if (subscriptionBlocked) return subscriptionBlocked;

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'value', 'currency', 'stage_id', 'probability',
      'contact_id', 'company', 'expected_close_date', 'actual_close_date',
      'owner_id', 'status', 'lost_reason', 'description', 'tags', 'position'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.status === 'won' || body.status === 'lost') {
      if (!updateData.actual_close_date) {
        updateData.actual_close_date = new Date().toISOString();
      }
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select(`*, stage:pipeline_stages(*), contact:contacts(id, email, name)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deal } = await supabase
      .from('deals')
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', deal.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await supabase.from('deals').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
