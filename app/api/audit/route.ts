import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuditLogs } from '@/lib/activity';
import type { AuditLogFilters, AuditEventCategory, AuditSeverity } from '@/types/activity';

// ============================================================================
// GET /api/audit - List audit logs (owners/admins only)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace ID
    const workspaceId = searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Check workspace membership - only owners and admins can view audit logs
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can view audit logs' },
        { status: 403 }
      );
    }

    // Parse filters
    const filters: AuditLogFilters = {};
    if (searchParams.get('event_category')) {
      const categories = searchParams.get('event_category')!.split(',') as AuditEventCategory[];
      filters.event_category = categories.length === 1 ? categories[0] : categories;
    }
    if (searchParams.get('event_type')) {
      filters.event_type = searchParams.get('event_type')!;
    }
    if (searchParams.get('user_id')) {
      filters.user_id = searchParams.get('user_id')!;
    }
    if (searchParams.get('severity')) {
      const severities = searchParams.get('severity')!.split(',') as AuditSeverity[];
      filters.severity = severities.length === 1 ? severities[0] : severities;
    }
    if (searchParams.get('date_from')) {
      filters.dateFrom = searchParams.get('date_from')!;
    }
    if (searchParams.get('date_to')) {
      filters.dateTo = searchParams.get('date_to')!;
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Get audit logs
    const { logs, total, error } = await getAuditLogs(
      supabase,
      workspaceId,
      filters,
      { page, pageSize }
    );

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
