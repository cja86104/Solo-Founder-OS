import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AutomationRunStatus } from '@/types/automations';

// =============================================================================
// GET /api/automations/[id]/runs - List run history for an automation
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch automation to verify access
    const { data: automation, error: fetchError } = await (supabase
      .from('automations') as any)
      .select('workspace_id, name')
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

    // Build query with filters
    let query = (supabase
      .from('automation_runs') as any)
      .select('*', { count: 'exact' })
      .eq('automation_id', id)
      .order('created_at', { ascending: false });

    // Filter by status
    const status = searchParams.get('status') as AutomationRunStatus | null;
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by date range
    const dateFrom = searchParams.get('date_from');
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    const dateTo = searchParams.get('date_to');
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data: runs, error: runsError, count } = await query;

    if (runsError) {
      console.error('Error fetching runs:', runsError);
      throw runsError;
    }

    // Calculate summary stats
    const { data: allRuns } = await (supabase
      .from('automation_runs') as any)
      .select('status, duration_ms, actions_executed, actions_failed')
      .eq('automation_id', id);

    type RunSummaryRow = {
      status: string;
      duration_ms: number | null;
      actions_executed: number;
      actions_failed: number;
    };

    const summary = {
      total_runs: allRuns?.length || 0,
      completed: allRuns?.filter((r: RunSummaryRow) => r.status === 'completed').length || 0,
      failed: allRuns?.filter((r: RunSummaryRow) => r.status === 'failed').length || 0,
      running: allRuns?.filter((r: RunSummaryRow) => r.status === 'running').length || 0,
      pending: allRuns?.filter((r: RunSummaryRow) => r.status === 'pending').length || 0,
      cancelled: allRuns?.filter((r: RunSummaryRow) => r.status === 'cancelled').length || 0,
      avg_duration_ms: allRuns && allRuns.length > 0
        ? Math.round(
            allRuns
              .filter((r: RunSummaryRow) => r.duration_ms !== null)
              .reduce((sum: number, r: RunSummaryRow) => sum + (r.duration_ms || 0), 0) /
            allRuns.filter((r: RunSummaryRow) => r.duration_ms !== null).length || 1
          )
        : 0,
      total_actions_executed: allRuns?.reduce((sum: number, r: RunSummaryRow) => sum + r.actions_executed, 0) || 0,
      total_actions_failed: allRuns?.reduce((sum: number, r: RunSummaryRow) => sum + r.actions_failed, 0) || 0,
    };

    return NextResponse.json({
      runs: runs || [],
      count: count || 0,
      summary,
      automation: {
        id,
        name: automation.name,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/automations/[id]/runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation runs' },
      { status: 500 }
    );
  }
}
