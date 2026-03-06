import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/types/database';
import type { AutomationRunStatus } from '@/types/automations';
import { executeAction as executeActionImpl } from '@/lib/automations/action-executor';

type AutomationActionRow = Database['public']['Tables']['automation_actions']['Row'];

// =============================================================================
// POST /api/automations/[id]/run - Manually trigger an automation run
// =============================================================================
export async function POST(
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

    // Parse optional custom trigger data
    let customData: Record<string, unknown> = {};
    try {
      const body = await request.json();
      customData = body.custom_data || {};
    } catch {
      // No body provided, that's fine for manual triggers
    }

    // Fetch automation with actions
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership with editor+ role
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', automation.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to run this automation' },
        { status: 403 }
      );
    }

    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role or higher required.' },
        { status: 403 }
      );
    }

    // Check if automation can be run
    if (automation.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot run an archived automation' },
        { status: 400 }
      );
    }

    // Check run limit if set
    if (automation.run_limit !== null) {
      // Count runs today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count: todayRunCount } = await supabase
        .from('automation_runs')
        .select('*', { count: 'exact', head: true })
        .eq('automation_id', id)
        .gte('created_at', todayStart.toISOString());

      if (todayRunCount !== null && todayRunCount >= automation.run_limit) {
        return NextResponse.json(
          { error: `Daily run limit (${automation.run_limit}) reached` },
          { status: 429 }
        );
      }
    }

    // Check cooldown
    if ((automation.cooldown_seconds || 0) > 0 && automation.last_run_at) {
      const lastRun = new Date(automation.last_run_at);
      const cooldownEnd = new Date(lastRun.getTime() + (automation.cooldown_seconds || 0) * 1000);
      
      if (new Date() < cooldownEnd) {
        const remainingSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
        return NextResponse.json(
          { error: `Cooldown active. Try again in ${remainingSeconds} seconds.` },
          { status: 429 }
        );
      }
    }

    // Build trigger data for manual execution
    const triggerData = {
      triggered_by: user.id,
      custom_data: customData,
    };

    // Create the run record
    const { data: run, error: runError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: id,
        workspace_id: automation.workspace_id,
        status: 'pending' as AutomationRunStatus,
        trigger_type: 'manual',
        trigger_data: triggerData as Json,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating automation run:', runError);
      throw runError;
    }

    // Log the start of execution
    await supabase.from('automation_run_logs').insert({
      run_id: run.id,
      level: 'info',
      message: 'Automation run started manually',
      details: { triggered_by: user.id, user_email: user.email },
    });

    // Fetch actions to execute
    const { data: actions } = await supabase
      .from('automation_actions')
      .select('*')
      .eq('automation_id', id)
      .order('position', { ascending: true });

    // Update run status to running
    await supabase
      .from('automation_runs')
      .update({ status: 'running' as AutomationRunStatus })
      .eq('id', run.id);

    // Execute actions (simplified - in production this would be a queue/worker)
    let actionsExecuted = 0;
    let actionsFailed = 0;
    let errorMessage: string | null = null;

    if (actions && actions.length > 0) {
      for (const action of actions) {
        try {
          // Log action start
          await supabase.from('automation_run_logs').insert({
            run_id: run.id,
            action_id: action.id,
            level: 'info',
            message: `Executing action: ${action.action_type}`,
            details: { action_config: action.action_config },
          });

          // Simulate action execution (actual implementation would go here)
          // In a real system, this would call action-specific handlers
          await executeAction(supabase, action, triggerData, run.id);

          actionsExecuted++;

          // Log action success
          await supabase.from('automation_run_logs').insert({
            run_id: run.id,
            action_id: action.id,
            level: 'info',
            message: `Action completed: ${action.action_type}`,
            details: { success: true },
          });
        } catch (actionError) {
          const errMsg = actionError instanceof Error ? actionError.message : 'Unknown error';

          // Condition not met — stop executing further actions (not a failure)
          if (errMsg === 'CONDITION_NOT_MET') {
            await supabase.from('automation_run_logs').insert({
              run_id: run.id,
              action_id: action.id,
              level: 'info',
              message: 'Condition not met — skipping remaining actions',
              details: { config: action.action_config },
            });
            break;
          }

          actionsFailed++;

          // Log action failure
          await supabase.from('automation_run_logs').insert({
            run_id: run.id,
            action_id: action.id,
            level: 'error',
            message: `Action failed: ${action.action_type}`,
            details: { error: errMsg },
          });

          // Continue with other actions
          if (!errorMessage) {
            errorMessage = `Action ${action.action_type} failed: ${errMsg}`;
          }
        }
      }
    }

    // Calculate duration
    const completedAt = new Date();
    const startedAt = new Date(run.started_at || completedAt);
    const durationMs = completedAt.getTime() - startedAt.getTime();

    // Determine final status
    const finalStatus: AutomationRunStatus = 
      actionsFailed > 0 && actionsExecuted === 0 ? 'failed' :
      actionsFailed > 0 ? 'completed' : // Partial success
      'completed';

    // Update run with results
    const { data: updatedRun, error: updateError } = await supabase
      .from('automation_runs')
      .update({
        status: finalStatus,
        actions_executed: actionsExecuted,
        actions_failed: actionsFailed,
        error_message: errorMessage,
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
      })
      .eq('id', run.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating run:', updateError);
    }

    // Log completion
    await supabase.from('automation_run_logs').insert({
      run_id: run.id,
      level: actionsFailed > 0 ? 'warning' : 'info',
      message: `Automation run completed`,
      details: {
        actions_executed: actionsExecuted,
        actions_failed: actionsFailed,
        duration_ms: durationMs,
      },
    });

    return NextResponse.json({
      run: updatedRun || run,
      summary: {
        actions_executed: actionsExecuted,
        actions_failed: actionsFailed,
        duration_ms: durationMs,
        status: finalStatus,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/automations/[id]/run:', error);
    return NextResponse.json(
      { error: 'Failed to run automation' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Action Execution Helper — delegates to lib/automations/action-executor.ts
// =============================================================================
async function executeAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: AutomationActionRow,
  triggerData: Record<string, unknown>,
  _runId: string
): Promise<void> {
  const actionConfig = action.action_config as Record<string, unknown>;
  await executeActionImpl(supabase, action.action_type, actionConfig, triggerData);
}
