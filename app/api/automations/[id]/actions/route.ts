import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateAutomationActionInput } from '@/types/automations';

// =============================================================================
// GET /api/automations/[id]/actions - List all actions for an automation
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch automation to verify access
    const { data: automation, error: fetchError } = await (supabase
      .from('automations') as any)
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (fetchError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', automation.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to view this automation' },
        { status: 403 }
      );
    }

    // Fetch actions
    const { data: actions, error: actionsError } = await (supabase
      .from('automation_actions') as any)
      .select('*')
      .eq('automation_id', id)
      .order('position', { ascending: true });

    if (actionsError) {
      console.error('Error fetching actions:', actionsError);
      throw actionsError;
    }

    return NextResponse.json({ actions: actions || [] });
  } catch (error) {
    console.error('Error in GET /api/automations/[id]/actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/automations/[id]/actions - Add a new action to an automation
// =============================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch automation
    const { data: automation, error: fetchError } = await (supabase
      .from('automations') as any)
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (fetchError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership with editor+ role
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', automation.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to modify this automation' },
        { status: 403 }
      );
    }

    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role or higher required.' },
        { status: 403 }
      );
    }

    // Validate action input
    const {
      action_type,
      action_config,
      position,
      parent_action_id,
      branch_condition,
    } = body as CreateAutomationActionInput;

    if (!action_type) {
      return NextResponse.json(
        { error: 'action_type is required' },
        { status: 400 }
      );
    }

    // Get current max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const { data: existingActions } = await (supabase
        .from('automation_actions') as any)
        .select('position')
        .eq('automation_id', id)
        .order('position', { ascending: false })
        .limit(1);

      finalPosition = existingActions && existingActions.length > 0
        ? existingActions[0].position + 1
        : 0;
    }

    // Create the action
    const { data: action, error: createError } = await (supabase
      .from('automation_actions') as any)
      .insert({
        automation_id: id,
        action_type,
        action_config: (action_config || {}) as any,
        position: finalPosition,
        parent_action_id: parent_action_id || null,
        branch_condition: branch_condition || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating action:', createError);
      throw createError;
    }

    return NextResponse.json({ action }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/automations/[id]/actions:', error);
    return NextResponse.json(
      { error: 'Failed to create action' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/automations/[id]/actions - Replace all actions (bulk update)
// =============================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch automation
    const { data: automation, error: fetchError } = await (supabase
      .from('automations') as any)
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (fetchError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership with editor+ role
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', automation.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to modify this automation' },
        { status: 403 }
      );
    }

    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role or higher required.' },
        { status: 403 }
      );
    }

    const { actions } = body as {
      actions: Array<{
        action_type: string;
        action_config: Record<string, unknown>;
        position: number;
        parent_action_id?: string | null;
        branch_condition?: string | null;
      }>;
    };

    if (!Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'actions must be an array' },
        { status: 400 }
      );
    }

    // Delete all existing actions
    await (supabase
      .from('automation_actions') as any)
      .delete()
      .eq('automation_id', id);

    // Insert new actions
    let createdActions: Array<Record<string, unknown>> = [];
    if (actions.length > 0) {
      const actionsToInsert = actions.map((action, index) => ({
        automation_id: id,
        action_type: action.action_type,
        action_config: (action.action_config || {}) as any,
        position: action.position ?? index,
        parent_action_id: action.parent_action_id || null,
        branch_condition: (action.branch_condition || null) as any,
      }));

      const { data: insertedActions, error: insertError } = await (supabase
        .from('automation_actions') as any)
        .insert(actionsToInsert as any)
        .select();

      if (insertError) {
        console.error('Error inserting actions:', insertError);
        throw insertError;
      }

      createdActions = insertedActions || [];
    }

    return NextResponse.json({ actions: createdActions });
  } catch (error) {
    console.error('Error in PUT /api/automations/[id]/actions:', error);
    return NextResponse.json(
      { error: 'Failed to update actions' },
      { status: 500 }
    );
  }
}
