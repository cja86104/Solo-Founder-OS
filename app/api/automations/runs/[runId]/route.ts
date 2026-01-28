import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AutomationRunStatus } from '@/types/automations';

// =============================================================================
// GET /api/automations/runs/[runId] - Get a single run with full details and logs
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const supabase = await createClient();
    const { runId } = await params;

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch run
    const { data: run, error: fetchError } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (fetchError || !run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', run.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to view this run' },
        { status: 403 }
      );
    }

    // Fetch associated automation info
    const { data: automation } = await supabase
      .from('automations')
      .select('id, name, trigger_type, status')
      .eq('id', run.automation_id)
      .single();

    // Fetch all logs for this run
    const { data: logs } = await supabase
      .from('automation_run_logs')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    // Fetch action details for logs that reference actions
    const actionIds = [...new Set(
      (logs || [])
        .filter(log => log.action_id)
        .map(log => log.action_id)
    )];

    let actionsMap: Record<string, { action_type: string; position: number }> = {};
    if (actionIds.length > 0) {
      const { data: actions } = await supabase
        .from('automation_actions')
        .select('id, action_type, position')
        .in('id', actionIds.filter((id): id is string => id !== null));

      if (actions) {
        actionsMap = actions.reduce((acc, action) => {
          acc[action.id] = { action_type: action.action_type, position: action.position };
          return acc;
        }, {} as Record<string, { action_type: string; position: number }>);
      }
    }

    // Enrich logs with action info
    const enrichedLogs = (logs || []).map(log => ({
      ...log,
      action: log.action_id ? actionsMap[log.action_id] || null : null,
    }));

    return NextResponse.json({
      run: {
        ...run,
        automation,
        logs: enrichedLogs,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/automations/runs/[runId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch run details' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/automations/runs/[runId] - Cancel a running automation
// =============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const supabase = await createClient();
    const { runId } = await params;
    const body = await request.json();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch run
    const { data: run, error: fetchError } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (fetchError || !run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership with editor+ role
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', run.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to modify this run' },
        { status: 403 }
      );
    }

    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role or higher required.' },
        { status: 403 }
      );
    }

    const { action } = body;

    if (action === 'cancel') {
      // Can only cancel pending or running automations
      if (run.status !== 'pending' && run.status !== 'running') {
        return NextResponse.json(
          { error: `Cannot cancel a run with status: ${run.status}` },
          { status: 400 }
        );
      }

      // Update status to cancelled
      const { data: updatedRun, error: updateError } = await supabase
        .from('automation_runs')
        .update({
          status: 'cancelled' as AutomationRunStatus,
          completed_at: new Date().toISOString(),
          error_message: 'Cancelled by user',
          duration_ms: run.started_at
            ? new Date().getTime() - new Date(run.started_at).getTime()
            : null,
        })
        .eq('id', runId)
        .select()
        .single();

      if (updateError) {
        console.error('Error cancelling run:', updateError);
        throw updateError;
      }

      // Log the cancellation
      await supabase.from('automation_run_logs').insert({
        run_id: runId,
        level: 'warning',
        message: 'Automation run cancelled by user',
        details: { cancelled_by: user.id, user_email: user.email },
      });

      return NextResponse.json({ run: updatedRun });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: cancel' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/automations/runs/[runId]:', error);
    return NextResponse.json(
      { error: 'Failed to update run' },
      { status: 500 }
    );
  }
}
