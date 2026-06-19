import { NextRequest, NextResponse } from 'next/server';
import type { TablesUpdate } from '@/types/db-helpers';
import { createClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/types/database';
import type { UpdateAutomationInput } from '@/types/automations';
import { requireActiveSubscription } from '@/lib/supabase/subscription';

type AutomationActionRow = Database['public']['Tables']['automation_actions']['Row'];
type AutomationScheduleRow = Database['public']['Tables']['automation_schedules']['Row'];
type AutomationWebhookRow = Database['public']['Tables']['automation_webhooks']['Row'];

// =============================================================================
// GET /api/automations/[id] - Get a single automation with full details
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

    // Fetch automation
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

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
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

    // Fetch related actions
    const { data: actions } = await supabase
      .from('automation_actions')
      .select('*')
      .eq('automation_id', id)
      .order('position', { ascending: true });

    // Fetch schedule if applicable
    let schedule: AutomationScheduleRow | null = null;
    if (automation.trigger_type === 'scheduled') {
      const { data: scheduleData } = await supabase
        .from('automation_schedules')
        .select('*')
        .eq('automation_id', id)
        .single();
      schedule = scheduleData;
    }

    // Fetch webhook if applicable
    let webhook: AutomationWebhookRow | null = null;
    if (automation.trigger_type === 'webhook') {
      const { data: webhookData } = await supabase
        .from('automation_webhooks')
        .select('*')
        .eq('automation_id', id)
        .single();
      webhook = webhookData;
    }

    // Fetch recent runs (last 10)
    const { data: recentRuns } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('automation_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      ...automation,
      actions: actions || [],
      schedule,
      webhook,
      recent_runs: recentRuns || [],
    });
  } catch (error) {
    console.error('Error in GET /api/automations/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/automations/[id] - Update an automation
// =============================================================================
export async function PATCH(
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

    // Fetch existing automation
    const { data: existingAutomation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAutomation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership with editor+ role
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingAutomation.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to update this automation' },
        { status: 403 }
      );
    }

    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role or higher required.' },
        { status: 403 }
      );
    }

    // Subscription gate — block expired/non-paying users from write operations
    const subscriptionBlocked = await requireActiveSubscription(supabase, user.id);
    if (subscriptionBlocked) return subscriptionBlocked;

    // Extract update fields
    const {
      name,
      description,
      trigger_type,
      trigger_config,
      filter_conditions,
      run_limit,
      cooldown_seconds,
      status,
      actions,
    } = body as UpdateAutomationInput & {
      actions?: Array<{
        id?: string;
        action_type: string;
        action_config: Record<string, unknown>;
        position: number;
        parent_action_id?: string | null;
        branch_condition?: string | null;
      }>;
    };

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (trigger_type !== undefined) updateData.trigger_type = trigger_type;
    if (trigger_config !== undefined) updateData.trigger_config = trigger_config;
    if (filter_conditions !== undefined) updateData.filter_conditions = filter_conditions;
    if (run_limit !== undefined) updateData.run_limit = run_limit;
    if (cooldown_seconds !== undefined) updateData.cooldown_seconds = cooldown_seconds;
    if (status !== undefined) updateData.status = status;

    // Update the automation
    const { data: updatedAutomation, error: updateError } = await supabase
      .from('automations')
      .update(updateData as TablesUpdate<'automations'>)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating automation:', updateError);
      throw updateError;
    }

    // Handle actions update if provided (replace all)
    let updatedActions: AutomationActionRow[] = [];
    if (actions !== undefined) {
      // Delete existing actions
      await supabase
        .from('automation_actions')
        .delete()
        .eq('automation_id', id);

      // Insert new actions
      if (actions.length > 0) {
        const actionsToInsert = actions.map((action, index) => ({
          automation_id: id,
          action_type: action.action_type as Database['public']['Enums']['automation_action_type'],
          action_config: (action.action_config || {}) as Json,
          position: action.position ?? index,
          parent_action_id: action.parent_action_id || null,
          branch_condition: action.branch_condition || null,
        }));

        const { data: insertedActions, error: actionsError } = await supabase
          .from('automation_actions')
          .insert(actionsToInsert)
          .select();

        if (actionsError) {
          console.error('Error updating automation actions:', actionsError);
        } else {
          updatedActions = insertedActions || [];
        }
      }
    } else {
      // Fetch existing actions if not updating them
      const { data: existingActions } = await supabase
        .from('automation_actions')
        .select('*')
        .eq('automation_id', id)
        .order('position', { ascending: true });
      updatedActions = existingActions || [];
    }

    // Update schedule if trigger type changed to/from scheduled
    if (trigger_type !== undefined || trigger_config !== undefined) {
      const newTriggerType = trigger_type || existingAutomation.trigger_type;
      const newConfig = trigger_config || existingAutomation.trigger_config;

      if (newTriggerType === 'scheduled') {
        const scheduleConfig = newConfig as { cron_expression?: string; timezone?: string };
        if (scheduleConfig?.cron_expression) {
          // Upsert schedule
          await supabase
            .from('automation_schedules')
            .upsert({
              automation_id: id,
              cron_expression: scheduleConfig.cron_expression,
              timezone: scheduleConfig.timezone || 'UTC',
            }, { onConflict: 'automation_id' });
        }
      } else if (existingAutomation.trigger_type === 'scheduled') {
        // Remove schedule if trigger type changed away from scheduled
        await supabase
          .from('automation_schedules')
          .delete()
          .eq('automation_id', id);
      }

      // Handle webhook updates similarly
      if (newTriggerType === 'webhook') {
        const webhookConfig = newConfig as { require_signature?: boolean; allowed_ips?: string[] };
        await supabase
          .from('automation_webhooks')
          .upsert({
            automation_id: id,
            workspace_id: existingAutomation.workspace_id,
            require_signature: webhookConfig?.require_signature ?? true,
            allowed_ips: webhookConfig?.allowed_ips || null,
          }, { onConflict: 'automation_id' });
      } else if (existingAutomation.trigger_type === 'webhook') {
        await supabase
          .from('automation_webhooks')
          .delete()
          .eq('automation_id', id);
      }
    }

    return NextResponse.json({
      ...updatedAutomation,
      actions: updatedActions,
    });
  } catch (error) {
    console.error('Error in PATCH /api/automations/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update automation' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/automations/[id] - Delete an automation
// =============================================================================
export async function DELETE(
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

    // Fetch existing automation
    const { data: existingAutomationForDelete, error: fetchError } = await supabase
      .from('automations')
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAutomationForDelete) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership with admin+ role
    const { data: membershipForDelete } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingAutomationForDelete.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membershipForDelete) {
      return NextResponse.json(
        { error: 'Not authorized to delete this automation' },
        { status: 403 }
      );
    }

    if (membershipForDelete.role !== 'owner' && membershipForDelete.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role or higher required to delete automations.' },
        { status: 403 }
      );
    }

    // Delete the automation (cascades to actions, schedules, webhooks via FK)
    const { error: deleteError } = await supabase
      .from('automations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting automation:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/automations/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete automation' },
      { status: 500 }
    );
  }
}
