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

    // Get stages (read-only — default seeding lives in POST to keep GET pure)
    const { data: stages, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (error) throw error;

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
// POST /api/crm/stages - Create stage (also handles seed_defaults action)
// ============================================================================

const DEFAULT_STAGES = [
  { name: 'Lead', color: '#6366f1', position: 0, is_won: false, is_lost: false },
  { name: 'Qualified', color: '#8b5cf6', position: 1, is_won: false, is_lost: false },
  { name: 'Proposal', color: '#a855f7', position: 2, is_won: false, is_lost: false },
  { name: 'Negotiation', color: '#d946ef', position: 3, is_won: false, is_lost: false },
  { name: 'Won', color: '#22c55e', position: 4, is_won: true, is_lost: false },
  { name: 'Lost', color: '#ef4444', position: 5, is_won: false, is_lost: true },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, name, color, position, is_won, is_lost, seed_defaults } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
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

    // Seed defaults action — idempotent: only inserts when no stages exist yet
    if (seed_defaults === true) {
      const { count } = await supabase
        .from('pipeline_stages')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspace_id);

      if ((count ?? 0) === 0) {
        const rows = DEFAULT_STAGES.map((stage) => ({
          workspace_id,
          ...stage,
        }));
        const { error: seedError } = await supabase
          .from('pipeline_stages')
          .insert(rows);
        if (seedError) throw seedError;
      }

      const { data: stages, error: fetchError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('position', { ascending: true });
      if (fetchError) throw fetchError;

      return NextResponse.json({ stages: stages || [] }, { status: 200 });
    }

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
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
