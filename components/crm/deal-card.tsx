'use client';

import { DealWithRelations, formatCurrency, getStatusColor } from '@/types/crm';
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
import {
  MoreHorizontal,
  Calendar,
  User,
  Building2,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: DealWithRelations;
  variant?: 'kanban' | 'list' | 'detailed';
  isDragging?: boolean;
  onEdit?: (deal: DealWithRelations) => void;
  onDelete?: (deal: DealWithRelations) => void;
  onMarkWon?: (deal: DealWithRelations) => void;
  onMarkLost?: (deal: DealWithRelations) => void;
  onClick?: (deal: DealWithRelations) => void;
  className?: string;
}

export function DealCard({
  deal,
  variant = 'kanban',
  isDragging = false,
  onEdit,
  onDelete,
  onMarkWon,
  onMarkLost,
  onClick,
  className,
}: DealCardProps) {
  const isOverdue =
    deal.expected_close_date &&
    isPast(new Date(deal.expected_close_date)) &&
    deal.status === 'open';
  const isCloseToday =
    deal.expected_close_date && isToday(new Date(deal.expected_close_date));

  if (variant === 'kanban') {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isDragging && 'opacity-50 rotate-2 shadow-lg',
          className
        )}
        onClick={() => onClick?.(deal)}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2">{deal.name}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(deal)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {deal.status === 'open' && (
                  <>
                    <DropdownMenuItem onClick={() => onMarkWon?.(deal)}>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Mark as Won
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMarkLost?.(deal)}>
                      <XCircle className="h-4 w-4 mr-2 text-red-500" />
                      Mark as Lost
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(deal)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Value */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(deal.value, deal.currency)}
            </span>
            <Badge variant="outline" className="text-xs">
              {deal.probability}%
            </Badge>
          </div>

          {/* Company/Contact */}
          {(deal.company || deal.contact) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {deal.company ? (
                <>
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{deal.company}</span>
                </>
              ) : deal.contact ? (
                <>
                  <User className="h-3 w-3" />
                  <span className="truncate">
                    {deal.contact.name || deal.contact.email}
                  </span>
                </>
              ) : null}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            {deal.expected_close_date && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        isOverdue && 'text-destructive',
                        isCloseToday && 'text-amber-500'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {format(new Date(deal.expected_close_date), 'MMM d')}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Expected close:{' '}
                    {format(new Date(deal.expected_close_date), 'PPP')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {deal.owner && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-5 w-5">
                      {deal.owner.avatar_url && (
                        <AvatarImage src={deal.owner.avatar_url} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {(deal.owner.full_name || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{deal.owner.full_name || 'Owner'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer',
          className
        )}
        onClick={() => onClick?.(deal)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{deal.name}</h4>
            <Badge
              variant={deal.status === 'open' ? 'secondary' : 'default'}
              className={cn(
                deal.status === 'won' && 'bg-green-500',
                deal.status === 'lost' && 'bg-red-500'
              )}
            >
              {deal.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {deal.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {deal.company}
              </span>
            )}
            {deal.stage && (
              <Badge
                variant="outline"
                style={{ borderColor: deal.stage.color, color: deal.stage.color }}
              >
                {deal.stage.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-bold">{formatCurrency(deal.value, deal.currency)}</p>
          {deal.expected_close_date && (
            <p
              className={cn(
                'text-xs text-muted-foreground',
                isOverdue && 'text-destructive'
              )}
            >
              {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        {deal.owner && (
          <Avatar className="h-8 w-8">
            {deal.owner.avatar_url && <AvatarImage src={deal.owner.avatar_url} />}
            <AvatarFallback>
              {(deal.owner.full_name || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(deal)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {deal.status === 'open' && (
              <>
                <DropdownMenuItem onClick={() => onMarkWon?.(deal)}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Mark as Won
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMarkLost?.(deal)}>
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  Mark as Lost
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(deal)}
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

  // Detailed variant
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{deal.name}</CardTitle>
            {deal.description && (
              <CardDescription className="mt-1">
                {deal.description}
              </CardDescription>
            )}
          </div>
          <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(deal.value, deal.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Probability</p>
            <p className="text-2xl font-bold">{deal.probability}%</p>
          </div>
        </div>

        {deal.stage && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Stage</p>
            <Badge
              variant="outline"
              style={{ borderColor: deal.stage.color, color: deal.stage.color }}
            >
              {deal.stage.name}
            </Badge>
          </div>
        )}

        {(deal.company || deal.contact) && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Contact</p>
            {deal.company && (
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {deal.company}
              </p>
            )}
            {deal.contact && (
              <p className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                {deal.contact.name || deal.contact.email}
              </p>
            )}
          </div>
        )}

        {deal.expected_close_date && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Expected Close</p>
            <p className={cn(isOverdue && 'text-destructive')}>
              {format(new Date(deal.expected_close_date), 'PPP')}
            </p>
          </div>
        )}

        {deal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {deal.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
