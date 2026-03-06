import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type PipelineStage = Database['public']['Tables']['pipeline_stages']['Row'];

interface StageUpdate {
  id: string;
  position: number;
  name: string;
  color: string;
}

// ============================================================================
// GET /api/crm/stages - List pipeline stages
// ============================================================================

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
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Check membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Get stages
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    let stages = data;

    if (error) throw error;

    // If no stages exist, create defaults
    if (!stages || stages.length === 0) {
      const defaultStages = [
        { name: 'Lead', color: '#6366f1', position: 0 },
        { name: 'Qualified', color: '#8b5cf6', position: 1 },
        { name: 'Proposal', color: '#a855f7', position: 2 },
        { name: 'Negotiation', color: '#d946ef', position: 3 },
        { name: 'Won', color: '#22c55e', position: 4, is_won: true },
        { name: 'Lost', color: '#ef4444', position: 5, is_lost: true },
      ];

      for (const stage of defaultStages) {
        await supabase.from('pipeline_stages').insert({
          workspace_id: workspaceId,
          ...stage,
        });
      }

      // Fetch again
      const { data: newStages } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true });

      stages = newStages;
    }

    return NextResponse.json({ stages: stages || [] });
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/crm/stages - Create stage
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, name, color, position, is_won, is_lost } = body;

    if (!workspace_id || !name) {
      return NextResponse.json(
        { error: 'workspace_id and name are required' },
        { status: 400 }
      );
    }

    // Check membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get max position if not provided
    let stagePosition = position;
    if (stagePosition === undefined) {
      const { data: maxPos } = await supabase
        .from('pipeline_stages')
        .select('position')
        .eq('workspace_id', workspace_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      stagePosition = ((maxPos as PipelineStage | null)?.position ?? -1) + 1;
    }

    const { data: stage, error } = await supabase
      .from('pipeline_stages')
      .insert({
        workspace_id,
        name,
        color: color || '#6366f1',
        position: stagePosition,
        is_won: is_won || false,
        is_lost: is_lost || false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/crm/stages - Update stage positions
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, stages } = body as { workspace_id: string; stages: StageUpdate[] };

    if (!workspace_id || !stages) {
      return NextResponse.json(
        { error: 'workspace_id and stages are required' },
        { status: 400 }
      );
    }

    // Check membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update each stage position
    for (const stage of stages) {
      await supabase
        .from('pipeline_stages')
        .update({ position: stage.position, name: stage.name, color: stage.color })
        .eq('id', stage.id)
        .eq('workspace_id', workspace_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating stages:', error);
    return NextResponse.json(
      { error: 'Failed to update stages' },
      { status: 500 }
    );
  }
}
