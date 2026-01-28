import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/content/posts - List posts
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

    // Build query - use user_id which is the actual FK column
    let query = supabase
      .from('content_posts')
      .select(`
        *,
        author:profiles(id, full_name, avatar_url)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Apply filters
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status as any);
    }

    const search = searchParams.get('search');
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Date range for calendar
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    if (dateFrom && dateTo) {
      query = query.or(
        `scheduled_at.gte.${dateFrom},scheduled_at.lte.${dateTo},published_at.gte.${dateFrom},published_at.lte.${dateTo}`
      );
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    query = query.range(offset, offset + pageSize - 1);

    const { data: posts, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: posts || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/content/posts - Create post
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      workspace_id,
      title,
      content,
      status,
      scheduled_at,
      platforms,
      tags,
      is_ai_generated,
    } = body;

    if (!workspace_id || !title) {
      return NextResponse.json(
        { error: 'workspace_id and title are required' },
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

    // Use user_id which is the actual column in the schema
    const { data: post, error } = await supabase
      .from('content_posts')
      .insert({
        workspace_id,
        user_id: user.id,
        title,
        content: content || '',
        status: status || 'draft',
        scheduled_at: scheduled_at || null,
        platforms: platforms || [],
        tags: tags || [],
        ai_generated: is_ai_generated || false,
      })
      .select(`
        *,
        author:profiles(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
