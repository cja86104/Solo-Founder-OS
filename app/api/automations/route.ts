import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  Automation,
  AutomationWithActions,
  CreateAutomationInput,
  AutomationStatus,
  AutomationTriggerType,
} from '@/types/automations';

// =============================================================================
// GET /api/automations - List all automations for a workspace
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require workspace_id
    const workspaceId = searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Build query with optional filters
    let query = supabase
      .from('automations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Filter by status
    const status = searchParams.get('status') as AutomationStatus | null;
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by trigger type
    const triggerType = searchParams.get('trigger_type') as AutomationTriggerType | null;
    if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }

    // Search by name
    const search = searchParams.get('search');
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data: automations, error, count } = await query;

    if (error) {
      console.error('Error fetching automations:', error);
      throw error;
    }

    // Optionally include actions if requested
    const includeActions = searchParams.get('include_actions') === 'true';
    let automationsWithActions: AutomationWithActions[] | Automation[] = (automations || []) as any;

    if (includeActions && automations && automations.length > 0) {
      const automationIds = automations.map((a) => a.id);
      const { data: actions } = await supabase
        .from('automation_actions')
        .select('*')
        .in('automation_id', automationIds)
        .order('position', { ascending: true });

      if (actions) {
        automationsWithActions = automations.map((automation) => ({
          ...automation,
          actions: actions.filter((action) => action.automation_id === automation.id),
        })) as any;
      }
    }

    return NextResponse.json({
      automations: automationsWithActions,
      count: count || automationsWithActions.length,
    });
  } catch (error) {
    console.error('Error in GET /api/automations:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch automations';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/automations - Create a new automation
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    const {
      workspace_id,
      name,
      description,
      trigger_type,
      trigger_config,
      filter_conditions,
      run_limit,
      cooldown_seconds,
      status,
      actions,
    } = body as CreateAutomationInput & {
      workspace_id: string;
      actions?: Array<{
        action_type: string;
        action_config: Record<string, unknown>;
        position: number;
        parent_action_id?: string | null;
        branch_condition?: string | null;
      }>;
    };

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!trigger_type) {
      return NextResponse.json(
        { error: 'trigger_type is required' },
        { status: 400 }
      );
    }

    // Verify workspace membership with editor+ role
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role or higher required.' },
        { status: 403 }
      );
    }

    // Create the automation
    const { data: automation, error: createError } = await supabase
      .from('automations')
      .insert({
        workspace_id,
        name: name.trim(),
        description: description?.trim() || null,
        trigger_type,
        trigger_config: (trigger_config || {}) as any,
        filter_conditions: (filter_conditions || []) as any,
        run_limit: run_limit ?? null,
        cooldown_seconds: cooldown_seconds ?? 0,
        status: status || 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating automation:', createError);
      throw createError;
    }

    // Create actions if provided
    let createdActions: Array<Record<string, unknown>> = [];
    if (actions && actions.length > 0) {
      const actionsToInsert = actions.map((action, index) => ({
        automation_id: automation.id,
        action_type: action.action_type,
        action_config: (action.action_config || {}) as any,
        position: action.position ?? index,
        parent_action_id: action.parent_action_id || null,
        branch_condition: (action.branch_condition || null) as any,
      }));

      const { data: insertedActions, error: actionsError } = await supabase
        .from('automation_actions')
        .insert(actionsToInsert as any)
        .select();

      if (actionsError) {
        console.error('Error creating automation actions:', actionsError);
        // Automation was created, but actions failed - don't throw, just log
      } else {
        createdActions = insertedActions || [];
      }
    }

    // Handle scheduled automations - create schedule record
    if (trigger_type === 'scheduled' && trigger_config) {
      const scheduleConfig = trigger_config as { cron_expression?: string; timezone?: string };
      if (scheduleConfig.cron_expression) {
        const { error: scheduleError } = await supabase
          .from('automation_schedules')
          .insert({
            automation_id: automation.id,
            cron_expression: scheduleConfig.cron_expression,
            timezone: scheduleConfig.timezone || 'UTC',
          });

        if (scheduleError) {
          console.error('Error creating automation schedule:', scheduleError);
        }
      }
    }

    // Handle webhook automations - create webhook record
    if (trigger_type === 'webhook') {
      const webhookConfig = trigger_config as { require_signature?: boolean; allowed_ips?: string[] };
      const { error: webhookError } = await supabase
        .from('automation_webhooks')
        .insert({
          automation_id: automation.id,
          workspace_id,
          require_signature: webhookConfig?.require_signature ?? true,
          allowed_ips: webhookConfig?.allowed_ips || null,
        });

      if (webhookError) {
        console.error('Error creating automation webhook:', webhookError);
      }
    }

    return NextResponse.json(
      {
        automation: {
          ...automation,
          actions: createdActions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/automations:', error);
    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    );
  }
}
