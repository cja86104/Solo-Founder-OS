import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ContentRenderer } from '@/components/content/renderers/content-renderer';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel, getContentTypeLabel } from '@/types/content';
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

  const { data: post } = await (supabase
    .from('content_posts') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (!post) notFound();

  // Verify membership
  const { data: membership } = await (supabase
    .from('workspace_members') as any)
    .select('role')
    .eq('workspace_id', post.workspace_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) notFound();

  const contentType = post.content_type || 'post';

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
            {new Date(post.updated_at || post.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <ContentRenderer
          content={post.content || ''}
          contentType={contentType}
          title={post.title}
          mediaUrls={post.media_urls || []}
          platforms={post.platforms || []}
        />
      </div>
    </div>
  );
}
