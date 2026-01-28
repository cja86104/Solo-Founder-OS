import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    let query = supabase
      .from('deals')
      .select(`*, stage:pipeline_stages(*), contact:contacts(id, email, name)`)
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    const stageId = searchParams.get('stage_id');
    if (stageId) query = query.eq('stage_id', stageId);

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as any);

    const { data: deals, error } = await query;
    if (error) throw error;

    return NextResponse.json({ deals: deals || [] });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, name, value, stage_id, contact_id, company, expected_close_date, description, tags } = body;

    if (!workspace_id || !name) {
      return NextResponse.json({ error: 'workspace_id and name are required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get max position for ordering
    const { data: maxPos } = await supabase
      .from('deals')
      .select('position')
      .eq('workspace_id', workspace_id)
      .eq('stage_id', stage_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        workspace_id,
        name,
        value: value || 0,
        stage_id: stage_id || null,
        contact_id: contact_id || null,
        company: company || null,
        expected_close_date: expected_close_date || null,
        description: description || null,
        tags: tags || [],
        owner_id: user.id,
        position: (maxPos?.position || 0) + 1,
      })
      .select(`*, stage:pipeline_stages(*), contact:contacts(id, email, name)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
