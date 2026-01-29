import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/content/ideas - List content ideas
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

    // Ideas are content posts with status 'idea'
    // If no ideas table exists, return posts with is_idea flag or empty array
    const { data: posts, error } = await (supabase
      .from('content_posts') as any)
      .select('id, title, content, tags, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'draft')
      .is('scheduled_at', null)
      .is('published_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching ideas:', error);
      // Return empty array if table/column doesn't exist
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: posts || [] });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json({ data: [] });
  }
}

// ============================================================================
// POST /api/content/ideas - Create a content idea
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, title, content, tags } = body;

    if (!workspace_id || !title) {
      return NextResponse.json(
        { error: 'workspace_id and title are required' },
        { status: 400 }
      );
    }

    // Check membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create as a draft content post (idea)
    const { data: idea, error } = await (supabase
      .from('content_posts') as any)
      .insert({
        workspace_id,
        title,
        content: content || '',
        status: 'draft',
        tags: tags || [],
        user_id: user.id,
      })
      .select('id, title, content, tags, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ data: idea }, { status: 201 });
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/content/ideas - Delete an idea
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ideaId = searchParams.get('id');
    if (!ideaId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await (supabase
      .from('content_posts') as any)
      .delete()
      .eq('id', ideaId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json(
      { error: 'Failed to delete idea' },
      { status: 500 }
    );
  }
}
