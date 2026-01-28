'use client';

import {
  ContentPostWithAuthor,
  getContentTypeIcon,
  getContentTypeLabel,
  getStatusColor,
  getStatusLabel,
  getPlatformIcon,
  getPlatformLabel,
} from '@/types/content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Calendar,
  Eye,
  Heart,
  Share2,
  Pencil,
  Trash2,
  Copy,
  Send,
  Archive,
  Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: ContentPostWithAuthor;
  variant?: 'grid' | 'list' | 'compact';
  onEdit?: (post: ContentPostWithAuthor) => void;
  onDelete?: (post: ContentPostWithAuthor) => void;
  onDuplicate?: (post: ContentPostWithAuthor) => void;
  onPublish?: (post: ContentPostWithAuthor) => void;
  onArchive?: (post: ContentPostWithAuthor) => void;
  onClick?: (post: ContentPostWithAuthor) => void;
  className?: string;
}

export function PostCard({
  post,
  variant = 'grid',
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  onClick,
  className,
}: PostCardProps) {
  const contentPreview = post.content
    ? post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '')
    : '';

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors',
          className
        )}
        onClick={() => onClick?.(post)}
      >
        <span className="text-xl">{getContentTypeIcon(post.content_type)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{post.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className={cn('text-[10px]', getStatusColor(post.status))}
            >
              {getStatusLabel(post.status)}
            </Badge>
            {post.scheduled_at && post.status === 'scheduled' && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
              </span>
            )}
          </div>
        </div>
        {(post.platforms || []).length > 0 && (
          <div className="flex gap-1">
            {(post.platforms || []).slice(0, 3).map((platform) => (
              <TooltipProvider key={platform}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs px-1.5">
                      {getPlatformIcon(platform)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{getPlatformLabel(platform)}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer',
          className
        )}
        onClick={() => onClick?.(post)}
      >
        {/* Thumbnail or Type Icon */}
        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {post.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl">{getContentTypeIcon(post.content_type)}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{post.title}</h4>
            <Badge className={cn('text-xs', getStatusColor(post.status))}>
              {getStatusLabel(post.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {contentPreview || 'No content yet'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{getContentTypeLabel(post.content_type)}</span>
            {(post.platforms || []).length > 0 && (
              <span>{(post.platforms || []).length} platform(s)</span>
            )}
            {(post.tags || []).length > 0 && <span>{(post.tags || []).length} tag(s)</span>}
          </div>
        </div>

        {/* Stats */}
        {post.status === 'published' && (
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.engagement.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {post.engagement.likes}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              {post.engagement.shares}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="text-right text-sm shrink-0">
          {post.status === 'scheduled' && post.scheduled_at ? (
            <div className="flex items-center gap-1 text-blue-500">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.scheduled_at), 'MMM d')}
            </div>
          ) : post.published_at ? (
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(post.published_at), {
                addSuffix: true,
              })}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(post.updated_at!), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(post)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(post)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            {post.status === 'draft' && (
              <DropdownMenuItem onClick={() => onPublish?.(post)}>
                <Send className="h-4 w-4 mr-2" />
                Publish Now
              </DropdownMenuItem>
            )}
            {post.status !== 'archived' && (
              <DropdownMenuItem onClick={() => onArchive?.(post)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(post)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Grid variant
  return (
    <Card
      className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={() => onClick?.(post)}
    >
      {/* Thumbnail */}
      {post.thumbnail_url && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={post.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getContentTypeIcon(post.content_type)}</span>
            <Badge className={cn('text-xs', getStatusColor(post.status))}>
              {getStatusLabel(post.status)}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(post)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(post)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(post)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {contentPreview || 'No content yet'}
        </p>

        {/* Platforms */}
        {(post.platforms || []).length > 0 && (
          <div className="flex gap-1 mt-3">
            {(post.platforms || []).map((platform) => (
              <Badge key={platform} variant="outline" className="text-xs">
                {getPlatformIcon(platform)} {getPlatformLabel(platform)}
              </Badge>
            ))}
          </div>
        )}

        {/* Tags */}
        {(post.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(post.tags || []).slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {(post.tags || []).length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{(post.tags || []).length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 text-xs text-muted-foreground">
        {post.status === 'scheduled' && post.scheduled_at ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Scheduled for {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
          </div>
        ) : post.published_at ? (
          <span>
            Published{' '}
            {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
          </span>
        ) : (
          <span>
            Updated{' '}
            {formatDistanceToNow(new Date(post.updated_at!), { addSuffix: true })}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
