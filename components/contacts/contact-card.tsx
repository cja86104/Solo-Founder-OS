'use client';

import { Contact, getContactDisplayName, getContactInitials, getSourceLabel, getStatusColor, calculateEngagementScore } from '@/types/contacts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  Clock,
  Eye,
  MousePointer,
  Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================================================
// Contact Card Props
// ============================================================================

interface ContactCardProps {
  contact: Contact;
  variant?: 'default' | 'compact' | 'detailed';
  selected?: boolean;
  onSelect?: (contact: Contact) => void;
  onClick?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  showActions?: boolean;
  className?: string;
}

// ============================================================================
// Contact Card Component
// ============================================================================

export function ContactCard({
  contact,
  variant = 'default',
  selected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className,
}: ContactCardProps) {
  const displayName = getContactDisplayName(contact);
  const initials = getContactInitials(contact);
  const engagementScore = calculateEngagementScore(contact);

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
          selected && 'border-primary bg-primary/5',
          onClick && 'cursor-pointer hover:bg-muted/50',
          className
        )}
        onClick={() => onClick?.(contact)}
      >
        <Avatar className="h-8 w-8">
          {contact.avatar_url && <AvatarImage src={contact.avatar_url} alt={displayName} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
        </div>
        {contact.tags.length > 0 && (
          <Badge variant="secondary" className="shrink-0">
            {contact.tags.length} tags
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn(selected && 'ring-2 ring-primary', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {contact.avatar_url && <AvatarImage src={contact.avatar_url} alt={displayName} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                {displayName}
                <span className={cn('h-2 w-2 rounded-full', getStatusColor(contact.status))} />
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {contact.email}
              </CardDescription>
              {contact.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" />
                  {contact.company}
                  {contact.job_title && ` • ${contact.job_title}`}
                </p>
              )}
            </div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(contact)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Engagement Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Engagement Score</span>
              <span className="font-medium">{engagementScore}%</span>
            </div>
            <Progress value={engagementScore} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{contact.total_visits}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Total Visits</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Send className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{contact.total_emails_sent}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Emails Sent</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <MousePointer className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{contact.total_emails_clicked}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Email Clicks</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {getSourceLabel(contact.source)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border transition-colors',
        selected && 'border-primary bg-primary/5',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={() => onClick?.(contact)}
    >
      {onSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(contact);
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
      )}
      
      <Avatar className="h-10 w-10">
        {contact.avatar_url && <AvatarImage src={contact.avatar_url} alt={displayName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{displayName}</p>
          <span className={cn('h-2 w-2 rounded-full shrink-0', getStatusColor(contact.status))} />
        </div>
        <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
      </div>

      {contact.company && (
        <div className="hidden md:block text-sm text-muted-foreground truncate max-w-[150px]">
          {contact.company}
        </div>
      )}

      {contact.tags.length > 0 && (
        <div className="hidden lg:flex gap-1">
          {contact.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {contact.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{contact.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      <div className="hidden sm:block text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
      </div>

      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`mailto:${contact.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </a>
            </DropdownMenuItem>
            {contact.phone && (
              <DropdownMenuItem asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(contact)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(contact)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ============================================================================
// Contact Avatar Component (standalone)
// ============================================================================

interface ContactAvatarProps {
  contact: Contact;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export function ContactAvatar({
  contact,
  size = 'md',
  showStatus = false,
  className,
}: ContactAvatarProps) {
  const displayName = getContactDisplayName(contact);
  const initials = getContactInitials(contact);

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  return (
    <div className={cn('relative', className)}>
      <Avatar className={sizeClasses[size]}>
        {contact.avatar_url && <AvatarImage src={contact.avatar_url} alt={displayName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
            getStatusColor(contact.status)
          )}
        />
      )}
    </div>
  );
}
