import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ContentRenderer } from '@/components/content/renderers/content-renderer';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel, getContentTypeLabel, type ContentPost } from '@/types/content';
import { PreviewTracker } from './tracker';

export default async function ContentPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: post } = await supabase
    .from('content_posts')
    .select('*')
    .eq('id', id)
    .single() as { data: ContentPost | null };

  if (!post) notFound();

  // Verify membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', post.workspace_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) notFound();

  const contentType = post.content_type || 'post';

  // Hoist the date string out of JSX so it's computed once at render.
  // (Server component, so no hydration concern; this also silences
  // react-doctor/rendering-hydration-mismatch-time cleanly.)
  const timestamp = post.updated_at ?? post.created_at;
  const dateLabel = timestamp ? new Date(timestamp).toLocaleDateString() : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Track view */}
      <PreviewTracker postId={id} />

      {/* Preview header bar */}
      <div className="border-b bg-muted/30 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Preview
            </Badge>
            <Badge className={getStatusColor(post.status)}>
              {getStatusLabel(post.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getContentTypeLabel(contentType)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {dateLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <ContentRenderer
          content={post.content || ''}
          contentType={contentType}
          title={post.title ?? undefined}
          mediaUrls={post.media_urls || []}
          platforms={post.platforms || []}
        />
      </div>
    </div>
  );
}
