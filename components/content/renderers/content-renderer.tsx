'use client';

import { cn } from '@/lib/utils';
import { getPlatformIcon, getPlatformLabel, getContentTypeIcon } from '@/types/content';
import { Badge } from '@/components/ui/badge';

interface ContentRendererProps {
  content: string;
  contentType: string;
  title?: string;
  mediaUrls?: string[];
  platforms?: string[];
  className?: string;
}

interface ThreadSegment {
  text: string;
  media_url?: string;
}

export function ContentRenderer({
  content,
  contentType,
  title,
  mediaUrls = [],
  platforms = [],
  className,
}: ContentRendererProps) {
  if (contentType === 'thread') {
    return (
      <ThreadRenderer
        content={content}
        title={title}
        className={className}
      />
    );
  }

  if (contentType === 'post') {
    return (
      <PostRenderer
        content={content}
        title={title}
        mediaUrls={mediaUrls}
        platforms={platforms}
        className={className}
      />
    );
  }

  // Article: clean blog-style layout
  return (
    <ArticleRenderer
      content={content}
      title={title}
      className={className}
    />
  );
}

function PostRenderer({
  content,
  title,
  mediaUrls,
  platforms,
  className,
}: {
  content: string;
  title?: string;
  mediaUrls: string[];
  platforms: string[];
  className?: string;
}) {
  return (
    <div className={cn('max-w-lg mx-auto', className)}>
      <div className="border rounded-xl p-6 space-y-4 bg-card">
        {/* Author area placeholder */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            {getContentTypeIcon('post')}
          </div>
          <div>
            {title && <p className="font-medium text-sm">{title}</p>}
            <p className="text-xs text-muted-foreground">Draft preview</p>
          </div>
        </div>

        {/* Content */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Media */}
        {mediaUrls.length > 0 && (
          <div
            className={cn(
              'grid gap-2 rounded-xl overflow-hidden',
              mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            )}
          >
            {mediaUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className={cn(
                  'w-full object-cover',
                  mediaUrls.length === 1 ? 'max-h-80' : 'h-40'
                )}
              />
            ))}
          </div>
        )}

        {/* Platforms */}
        {platforms.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            {platforms.map((p) => (
              <Badge key={p} variant="outline" className="text-xs">
                {getPlatformIcon(p)} {getPlatformLabel(p)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleRenderer({
  content,
  title,
  className,
}: {
  content: string;
  title?: string;
  className?: string;
}) {
  return (
    <article className={cn('max-w-3xl mx-auto', className)}>
      {title && (
        <h1 className="text-4xl font-bold mb-8 leading-tight">{title}</h1>
      )}
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}

function ThreadRenderer({
  content,
  title,
  className,
}: {
  content: string;
  title?: string;
  className?: string;
}) {
  let segments: ThreadSegment[] = [];
  try {
    const parsed = JSON.parse(content);
    if (parsed.segments) segments = parsed.segments;
  } catch {
    segments = [{ text: content }];
  }

  return (
    <div className={cn('max-w-lg mx-auto space-y-0', className)}>
      {title && (
        <h2 className="text-xl font-bold mb-4">{title}</h2>
      )}
      {segments.map((segment, index) => (
        <div key={index} className="relative pl-8 pb-6">
          {/* Thread connector line */}
          {index < segments.length - 1 && (
            <div className="absolute left-[14px] top-10 bottom-0 w-0.5 bg-border" />
          )}

          {/* Dot */}
          <div className="absolute left-2.5 top-3 h-3 w-3 rounded-full border-2 border-primary bg-background" />

          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">
                {index + 1}/{segments.length}
              </span>
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: segment.text }}
            />
            {segment.media_url && (
              <img
                src={segment.media_url}
                alt=""
                className="w-full rounded-lg max-h-60 object-cover"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
