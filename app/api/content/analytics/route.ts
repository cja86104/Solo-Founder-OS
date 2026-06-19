import { NextRequest, NextResponse } from 'next/server';
import type { TablesInsert, TablesUpdate } from '@/types/db-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// =============================================================================
// GET /api/content/analytics — Content performance analytics
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
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

    // Fetch all posts for analytics
    const { data: posts, error } = await supabase
      .from('content_posts')
      .select('id, title, content_type, status, platforms, tags, created_at, published_at, scheduled_at, updated_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const allPosts = posts || [];

    // Compute analytics
    const totalPosts = allPosts.length;
    const published = allPosts.filter((p) => p.status === 'published');
    const scheduled = allPosts.filter((p) => p.status === 'scheduled');
    const drafts = allPosts.filter((p) => p.status === 'draft');
    const archived = allPosts.filter((p) => p.status === 'archived');

    // Content type breakdown
    const byType: Record<string, number> = {};
    for (const p of allPosts) {
      const ct = p.content_type || 'post';
      byType[ct] = (byType[ct] || 0) + 1;
    }

    // Platform breakdown
    const byPlatform: Record<string, number> = {};
    for (const p of allPosts) {
      const platforms = p.platforms || [];
      for (const pl of platforms) {
        byPlatform[pl] = (byPlatform[pl] || 0) + 1;
      }
    }

    // Tag breakdown (top 10)
    const tagCounts: Record<string, number> = {};
    for (const p of allPosts) {
      const tags = p.tags || [];
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Publishing activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyPublished = published.filter(
      (p) => p.published_at && new Date(p.published_at) >= thirtyDaysAgo
    );

    // Weekly publishing breakdown
    const weeklyActivity: Array<{ week: string; count: number }> = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const label = `Week ${4 - i}`;
      const count = published.filter(
        (p) =>
          p.published_at &&
          new Date(p.published_at) >= weekStart &&
          new Date(p.published_at) < weekEnd
      ).length;
      weeklyActivity.push({ week: label, count });
    }

    // Top performing posts (most recently published, as engagement tracking is basic)
    const topPosts = published
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        content_type: p.content_type,
        platforms: p.platforms,
        published_at: p.published_at,
      }));

    // Fetch engagement data if table exists
    const engagement = { total_views: 0, total_likes: 0, total_shares: 0, total_comments: 0 };
    let postEngagement: { post_id: string; views: number | null; likes: number | null; shares: number | null; comments: number | null }[] = [];
    try {
      const { data: engData } = await supabase
        .from('content_engagement')
        .select('post_id, views, likes, shares, comments')
        .in('post_id', allPosts.map((p) => p.id));

      if (engData && engData.length > 0) {
        postEngagement = engData;
        for (const e of engData) {
          engagement.total_views += e.views || 0;
          engagement.total_likes += e.likes || 0;
          engagement.total_shares += e.shares || 0;
          engagement.total_comments += e.comments || 0;
        }
      }
    } catch {
      // Table may not exist yet — that's fine
    }

    return NextResponse.json({
      summary: {
        total: totalPosts,
        published: published.length,
        scheduled: scheduled.length,
        drafts: drafts.length,
        archived: archived.length,
        published_last_30_days: recentlyPublished.length,
      },
      engagement,
      byType,
      byPlatform,
      topTags,
      weeklyActivity,
      topPosts,
      postEngagement,
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/content/analytics — Track engagement event
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate the requesting user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { post_id, event_type } = body;

    if (!post_id || !event_type) {
      return NextResponse.json(
        { error: 'post_id and event_type are required' },
        { status: 400 }
      );
    }

    const validEvents = ['view', 'like', 'share', 'comment'];
    if (!validEvents.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Validate post_id is a valid UUID to prevent enumeration
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(post_id)) {
      return NextResponse.json({ error: 'Invalid post_id' }, { status: 400 });
    }

    // Verify the post exists and belongs to a workspace this user is a member of.
    // The user-scoped client enforces RLS — if the post is in a workspace the user
    // doesn't belong to, this query returns null and we exit with 404.
    // This establishes a DB-verified trust chain before the admin client is used.
    const { data: post, error: postError } = await supabase
      .from('content_posts')
      .select('id, workspace_id')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    type EngagementColumn = 'views' | 'likes' | 'shares' | 'comments';
    const column: EngagementColumn = event_type === 'view' ? 'views' : `${event_type}s` as EngagementColumn;

    // Safe to use admin client now — workspace ownership confirmed above via RLS
    try {
      const admin = createAdminClient();

      const { data: existing } = await admin
        .from('content_engagement')
        .select('id, views, likes, shares, comments')
        .eq('post_id', post_id)
        .single();

      if (existing) {
        await admin
          .from('content_engagement')
          .update({ [column]: (existing[column] || 0) + 1 } as TablesUpdate<'content_engagement'>)
          .eq('id', existing.id);
      } else {
        await admin
          .from('content_engagement')
          .insert({
            post_id,
            [column]: 1,
          } as TablesInsert<'content_engagement'>);
      }
    } catch {
      // Table may not exist — silently fail for tracking
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Engagement tracking error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
