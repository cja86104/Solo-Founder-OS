'use client';

import {
  TaskWithRelations,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatDuration,
} from '@/types/projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Clock,
  MessageSquare,
  Pencil,
  Trash2,
  Flag,
  ChevronRight,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithRelations;
  variant?: 'default' | 'compact' | 'kanban';
  showProject?: boolean;
  onStatusChange?: (status: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
}

export function TaskCard({
  task,
  variant = 'default',
  showProject = false,
  onStatusChange,
  onEdit,
  onDelete,
  onClick,
  className,
}: TaskCardProps) {
  const isOverdue =
    task.due_date &&
    isPast(new Date(task.due_date)) &&
    task.status !== 'done' &&
    task.status !== 'cancelled';
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const isDone = task.status === 'done';

  const handleCheckboxChange = (checked: boolean) => {
    onStatusChange?.(checked ? 'done' : 'todo');
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group',
          className
        )}
        onClick={onClick}
      >
        <Checkbox
          checked={isDone}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
        />
        <span
          className={cn(
            'flex-1 text-sm truncate',
            isDone && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </span>
        {task.priority !== 'medium' && (
          <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
            {getPriorityLabel(task.priority)}
          </Badge>
        )}
        {task.due_date && (
          <span
            className={cn(
              'text-xs text-muted-foreground',
              isOverdue && 'text-destructive',
              isDueToday && 'text-amber-500'
            )}
          >
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'kanban') {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4
            className={cn(
              'font-medium text-sm line-clamp-2',
              isDone && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="secondary" className="text-[10px]">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.priority !== 'medium' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Flag
                      className={cn(
                        'h-3 w-3',
                        task.priority === 'urgent' && 'text-red-500',
                        task.priority === 'high' && 'text-amber-500',
                        task.priority === 'low' && 'text-gray-400'
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{getPriorityLabel(task.priority)}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {task.due_date && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-destructive',
                  isDueToday && 'text-amber-500'
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
            {task.comments_count && task.comments_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments_count}
              </span>
            )}
          </div>
          {task.assignee && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-5 w-5">
                    {task.assignee.avatar_url && (
                      <AvatarImage src={task.assignee.avatar_url} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {(task.assignee.full_name || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{task.assignee.full_name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group',
        className
      )}
      onClick={onClick}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={cn(
              'font-medium truncate',
              isDone && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h4>
          {showProject && task.project && (
            <Badge variant="outline" className="text-xs shrink-0">
              {task.project.icon} {task.project.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge className={cn('text-xs', getStatusColor(task.status))}>
            {getStatusLabel(task.status)}
          </Badge>
          <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
            <Flag className="h-3 w-3 mr-1" />
            {getPriorityLabel(task.priority)}
          </Badge>
          {task.due_date && (
            <span
              className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-destructive',
                isDueToday && 'text-amber-500'
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
          {task.estimated_hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimated_hours}h est.
            </span>
          )}
          {task.time_logged && task.time_logged > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(task.time_logged)} logged
            </span>
          )}
        </div>
      </div>

      {task.assignee && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 shrink-0">
                {task.assignee.avatar_url && (
                  <AvatarImage src={task.assignee.avatar_url} />
                )}
                <AvatarFallback>
                  {(task.assignee.full_name || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{task.assignee.full_name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}
