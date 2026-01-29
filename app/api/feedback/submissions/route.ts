import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/feedback/submissions - List submissions
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
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Build query - only join with tables that exist
    let query = (supabase
      .from('feedback_submissions') as any)
      .select(`
        *,
        widget:feedback_widgets(id, name)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Apply filters
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status as any);
    }

    const type = searchParams.get('type');
    if (type) {
      query = query.eq('type', type as any);
    }

    const widgetId = searchParams.get('widget_id');
    if (widgetId) {
      query = query.eq('widget_id', widgetId);
    }

    const search = searchParams.get('search');
    if (search) {
      query = query.or(`content.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    query = query.range(offset, offset + pageSize - 1);

    const { data: submissions, error, count } = await query;

    if (error) throw error;

    // Map DB field names to frontend field names
    // DB: content -> message, type -> category
    const mapped = (submissions || []).map((s: any) => ({
      ...s,
      message: s.content,
      category: s.type || 'other',
    }));

    return NextResponse.json({
      submissions: mapped,
      pagination: {
        page,
        pageSize,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/feedback/submissions - Create submission (public endpoint)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      widget_id,
      content,
      message, // alias for content
      email,
      name,
      type,
      category, // alias for type
      rating,
      emoji_rating,
      page_url,
      user_agent,
      screen_size,
    } = body;

    const feedbackContent = content || message;
    const feedbackType = type || category || 'other';

    if (!widget_id || !feedbackContent) {
      return NextResponse.json(
        { error: 'widget_id and content are required' },
        { status: 400 }
      );
    }

    // Get widget to find workspace_id and validate
    const { data: widget, error: widgetError } = await (supabase
      .from('feedback_widgets') as any)
      .select('workspace_id, is_active')
      .eq('id', widget_id)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    if (!widget.is_active) {
      return NextResponse.json(
        { error: 'This feedback widget is not active' },
        { status: 400 }
      );
    }

    const { data: submission, error } = await (supabase
      .from('feedback_submissions') as any)
      .insert({
        workspace_id: widget.workspace_id,
        widget_id,
        content: feedbackContent,
        email: email || null,
        name: name || null,
        type: feedbackType,
        rating: rating || null,
        emoji_rating: emoji_rating || null,
        page_url: page_url || null,
        user_agent: user_agent || null,
        screen_size: screen_size || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/feedback/submissions - Update submission status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, status, priority } = body;

    if (!submission_id) {
      return NextResponse.json(
        { error: 'submission_id is required' },
        { status: 400 }
      );
    }

    // Get submission to check workspace
    const { data: existing } = await (supabase
      .from('feedback_submissions') as any)
      .select('workspace_id')
      .eq('id', submission_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', existing.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build update
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (body.internal_notes !== undefined) updateData.internal_notes = body.internal_notes;
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;

    const { data: submission, error } = await (supabase
      .from('feedback_submissions') as any)
      .update(updateData)
      .eq('id', submission_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
