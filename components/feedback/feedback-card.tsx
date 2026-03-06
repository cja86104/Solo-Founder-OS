'use client';

import {
  FeedbackSubmissionWithRelations,
  getStatusColor,
  getStatusLabel,
  getCategoryIcon,
  getCategoryLabel,
} from '@/types/feedback';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
  MoreHorizontal,
  Mail,
  Globe,
  User,
  Trash2,
  CheckCircle,
  Eye,
  Archive,
  MessageSquare,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface FeedbackCardProps {
  submission: FeedbackSubmissionWithRelations;
  variant?: 'default' | 'compact' | 'detailed';
  onStatusChange?: (status: string) => void;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
}

export function FeedbackCard({
  submission,
  variant = 'default',
  onStatusChange,
  onDelete,
  onClick,
  className,
}: FeedbackCardProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors',
          className
        )}
        onClick={onClick}
      >
        <span className="text-xl">{getCategoryIcon(submission.category)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{submission.message.slice(0, 60)}...</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {submission.email && <span>{submission.email}</span>}
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(submission.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        <Badge className={cn('text-xs', getStatusColor(submission.status))}>
          {getStatusLabel(submission.status)}
        </Badge>
        {submission.emoji_rating && (
          <span className="text-xl">{submission.emoji_rating}</span>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCategoryIcon(submission.category)}</span>
              <div>
                <CardTitle className="text-lg">
                  {getCategoryLabel(submission.category)}
                </CardTitle>
                <CardDescription>
                  {format(new Date(submission.created_at), 'PPpp')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn(getStatusColor(submission.status))}>
                {getStatusLabel(submission.status)}
              </Badge>
              {submission.emoji_rating && (
                <span className="text-2xl">{submission.emoji_rating}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap">{submission.message}</p>

          {/* Submitter Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {submission.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{submission.email}</span>
              </div>
            )}
            {submission.name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{submission.name}</span>
              </div>
            )}
            {submission.page_url && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <Globe className="h-4 w-4" />
                <span className="truncate">{submission.page_url}</span>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          {submission.internal_notes && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Internal Notes
              </p>
              <p className="text-sm">{submission.internal_notes}</p>
            </div>
          )}

          {/* Responses */}
          {submission.responses && submission.responses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Responses</p>
              {submission.responses.map((response) => (
                <div
                  key={response.id}
                  className={cn(
                    'p-3 rounded-lg',
                    response.is_internal ? 'bg-amber-50 dark:bg-amber-950' : 'bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-5 w-5">
                      {response.user?.avatar_url && (
                        <AvatarImage src={response.user.avatar_url} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {(response.user?.full_name || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {response.user?.full_name || 'Team'}
                    </span>
                    {response.is_internal && (
                      <Badge variant="outline" className="text-[10px]">
                        Internal
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(response.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{response.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          {submission.status === 'new' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange?.('in_review')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Mark In Review
            </Button>
          )}
          {submission.status === 'in_review' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange?.('resolved')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Resolved
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange?.('archived')}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getCategoryIcon(submission.category)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn('text-xs', getStatusColor(submission.status))}>
                {getStatusLabel(submission.status)}
              </Badge>
              {submission.emoji_rating && (
                <span className="text-lg">{submission.emoji_rating}</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(submission.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm line-clamp-2 mb-2">{submission.message}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {submission.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {submission.email}
                </span>
              )}
              {submission.responses && submission.responses.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {submission.responses.length} response(s)
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {submission.status !== 'resolved' && (
                <DropdownMenuItem onClick={() => onStatusChange?.('resolved')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onStatusChange?.('archived')}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
