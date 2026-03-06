import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

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
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    let query = supabase
      .from('content_posts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as Database['public']['Enums']['post_status']);

    const contentType = searchParams.get('content_type');
    if (contentType) query = query.eq('content_type', contentType);

    const platform = searchParams.get('platform');
    if (platform) query = query.contains('platforms', [platform]);

    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * pageSize;

    query = query.range(offset, offset + pageSize - 1);

    const { data: posts, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ posts: posts || [], total: count || 0 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, title, content, content_type, status, platforms, scheduled_at, tags, slug, meta_description, category, media_urls } = body;

    if (!workspace_id || !content) {
      return NextResponse.json({ error: 'workspace_id and content are required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build insert object — only include extended columns if they have values,
    // so the query still works even if the migration hasn't been applied yet.
    const insertData: Database['public']['Tables']['content_posts']['Insert'] = {
      workspace_id,
      user_id: user.id,
      title: title || null,
      content,
      status: status || 'draft',
      platforms: platforms || [],
      scheduled_at: scheduled_at || null,
      tags: tags || [],
    };

    // Extended columns added by the content engine migration
    if (content_type) insertData.content_type = content_type;
    if (media_urls && media_urls.length > 0) insertData.media_urls = media_urls;
    if (slug) insertData.slug = slug;
    if (meta_description) insertData.meta_description = meta_description;
    if (category) insertData.category = category;

    let result = await supabase
      .from('content_posts')
      .insert(insertData)
      .select()
      .single();

    // If it fails due to unknown columns, retry with base columns only
    if (result.error?.code === 'PGRST204') {
      const baseData: Database['public']['Tables']['content_posts']['Insert'] = {
        workspace_id,
        user_id: user.id,
        title: title || null,
        content,
        status: status || 'draft',
        platforms: platforms || [],
        scheduled_at: scheduled_at || null,
        tags: tags || [],
      };

      result = await supabase
        .from('content_posts')
        .insert(baseData)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({ post: result.data }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
