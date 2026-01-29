import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActivities, getActivitySummary, logActivity } from '@/lib/activity';
import { ActivityFilters } from '@/types/activity';

// ============================================================================
// GET /api/activity - List activities
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

    // Check workspace membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
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

    // Check if requesting summary
    if (searchParams.get('summary') === 'true') {
      const summary = await getActivitySummary(supabase, workspaceId);
      return NextResponse.json({ summary });
    }

    // Parse filters
    const filters: ActivityFilters = {};
    if (searchParams.get('category')) {
      const categories = searchParams.get('category')!.split(',');
      filters.category = categories.length === 1 ? categories[0] as any : categories as any;
    }
    if (searchParams.get('resource_type')) {
      filters.resource_type = searchParams.get('resource_type')!;
    }
    if (searchParams.get('actor_id')) {
      filters.actor_id = searchParams.get('actor_id')!;
    }
    if (searchParams.get('action')) {
      filters.action = searchParams.get('action')!;
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
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get activities
    const { activities, total, error } = await getActivities(
      supabase,
      workspaceId,
      filters,
      { page, pageSize }
    );

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({
      activities,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/activity - Create activity (for manual logging)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      workspace_id,
      action,
      resource_type,
      resource_id,
      resource_name,
      description,
      metadata,
      category,
      contact_id,
    } = body;

    // Validate required fields
    if (!workspace_id || !action || !resource_type) {
      return NextResponse.json(
        { error: 'workspace_id, action, and resource_type are required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
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

    // Log activity
    const { activity, error } = await logActivity(supabase, {
      workspace_id,
      actor_id: user.id,
      actor_type: 'user',
      action,
      resource_type,
      resource_id,
      resource_name,
      description,
      metadata,
      category,
      contact_id,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
