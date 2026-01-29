import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: post, error } = await (supabase
      .from('content_posts') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', post.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingPost } = await (supabase
      .from('content_posts') as any)
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', existingPost.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    // Base columns that always exist
    const baseFields = ['title', 'content', 'status', 'scheduled_at', 'published_at', 'platforms', 'tags'];
    // Extended columns from content engine migration
    const extendedFields = ['content_type', 'slug', 'meta_description', 'category', 'media_urls'];

    for (const field of baseFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.status === 'published' && !body.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    // Only include extended fields if they have actual values
    for (const field of extendedFields) {
      if (body[field] !== undefined && body[field] !== null) {
        updateData[field] = body[field];
      }
    }

    let result = await (supabase
      .from('content_posts') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // If it fails due to unknown columns, retry with base columns only
    if (result.error?.code === 'PGRST204') {
      const baseOnly: Record<string, unknown> = {};
      for (const field of baseFields) {
        if (body[field] !== undefined) {
          baseOnly[field] = body[field];
        }
      }
      if (body.status === 'published' && !body.published_at) {
        baseOnly.published_at = new Date().toISOString();
      }

      result = await (supabase
        .from('content_posts') as any)
        .update(baseOnly)
        .eq('id', id)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({ post: result.data });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: post } = await (supabase
      .from('content_posts') as any)
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', post.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await (supabase.from('content_posts') as any).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
