'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  Automation,
  AutomationWithActions,
  AutomationWithRelations,
  AutomationStatus,
} from '@/types/automations';
import {
  AutomationStatusBadge,
  TriggerTypeBadge,
} from './automation-status-badge';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Play,
  Pause,
  Pencil,
  Trash2,
  Copy,
  Archive,
  ArchiveRestore,
  Zap,
  Clock,
  Activity,
  GitBranch,
  Settings2,
  ExternalLink,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface AutomationCardProps {
  automation: Automation | AutomationWithActions | AutomationWithRelations;
  variant?: 'default' | 'compact' | 'detailed';
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onStatusChange?: (status: AutomationStatus) => void;
  onRun?: () => void;
  onClick?: () => void;
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getActionCount(automation: Automation | AutomationWithActions | AutomationWithRelations): number {
  if ('actions' in automation && automation.actions) {
    return automation.actions.length;
  }
  return 0;
}

function hasRecentRuns(automation: Automation | AutomationWithRelations): boolean {
  if ('recent_runs' in automation && automation.recent_runs) {
    return automation.recent_runs.length > 0;
  }
  return false;
}

// =============================================================================
// Component
// =============================================================================

export function AutomationCard({
  automation,
  variant = 'default',
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onRun,
  onClick,
  className,
}: AutomationCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusToggle = async () => {
    if (!onStatusChange) return;
    setIsLoading(true);
    try {
      const newStatus: AutomationStatus =
        automation.status === 'active' ? 'paused' : 'active';
      await onStatusChange(newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRun) return;
    setIsLoading(true);
    try {
      await onRun();
    } finally {
      setIsLoading(false);
    }
  };

  const actionCount = getActionCount(automation);

  // =========================================================================
  // Compact Variant
  // =========================================================================
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors',
          className
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            automation.status === 'active'
              ? 'bg-green-500/10 text-green-600'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Zap className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{automation.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TriggerTypeBadge triggerType={automation.trigger_type} size="sm" />
            {actionCount > 0 && (
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {actionCount} action{actionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <AutomationStatusBadge status={automation.status} size="sm" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {automation.status !== 'archived' && (
              <>
                <DropdownMenuItem onClick={handleStatusToggle}>
                  {automation.status === 'active' ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                {onRun && (
                  <DropdownMenuItem onClick={handleRun}>
                    <Zap className="h-4 w-4 mr-2" />
                    Run Now
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {automation.status === 'archived' ? (
              <DropdownMenuItem onClick={() => onStatusChange?.('draft')}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onStatusChange?.('archived')}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // =========================================================================
  // Detailed Variant
  // =========================================================================
  if (variant === 'detailed') {
    const recentRuns = 'recent_runs' in automation ? automation.recent_runs : [];

    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg',
                  automation.status === 'active'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{automation.name}</CardTitle>
                <CardDescription>
                  {automation.description || 'No description'}
                </CardDescription>
              </div>
            </div>
            <AutomationStatusBadge status={automation.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trigger & Actions Info */}
          <div className="flex flex-wrap gap-2">
            <TriggerTypeBadge triggerType={automation.trigger_type} />
            {actionCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                <GitBranch className="h-3 w-3" />
                {actionCount} action{actionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-2xl font-semibold">{automation.run_count}</p>
              <p className="text-xs text-muted-foreground">Total Runs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {automation.last_run_at
                  ? formatDistanceToNow(new Date(automation.last_run_at), { addSuffix: false })
                  : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Last Run</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {automation.run_limit ?? '∞'}
              </p>
              <p className="text-xs text-muted-foreground">Daily Limit</p>
            </div>
          </div>

          {/* Recent Runs */}
          {recentRuns && recentRuns.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Runs</p>
              <div className="space-y-1">
                {recentRuns.slice(0, 3).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                  >
                    <span className="text-muted-foreground">
                      {format(new Date(run.created_at), 'MMM d, HH:mm')}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        run.status === 'completed' && 'text-green-600',
                        run.status === 'failed' && 'text-red-600',
                        run.status === 'running' && 'text-blue-600'
                      )}
                    >
                      {run.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {run.duration_ms ? `${run.duration_ms}ms` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {formatDistanceToNow(new Date(automation.created_at), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <Settings2 className="h-3 w-3" />
              Updated {formatDistanceToNow(new Date(automation.updated_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          {automation.status !== 'archived' && (
            <>
              <Button
                size="sm"
                variant={automation.status === 'active' ? 'outline' : 'default'}
                onClick={handleStatusToggle}
                disabled={isLoading}
              >
                {automation.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Activate
                  </>
                )}
              </Button>
              {onRun && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRun}
                  disabled={isLoading}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Run Now
                </Button>
              )}
            </>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // =========================================================================
  // Default Variant
  // =========================================================================
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
              automation.status === 'active'
                ? 'bg-green-500/10 text-green-600'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Zap className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{automation.name}</h3>
              <AutomationStatusBadge status={automation.status} size="sm" showIcon={false} />
            </div>

            {automation.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {automation.description}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
              <TriggerTypeBadge triggerType={automation.trigger_type} size="sm" />

              {actionCount > 0 && (
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {actionCount} action{actionCount !== 1 ? 's' : ''}
                </span>
              )}

              {automation.run_count > 0 && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {automation.run_count} run{automation.run_count !== 1 ? 's' : ''}
                </span>
              )}

              {automation.last_run_at && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(automation.last_run_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Last run: {format(new Date(automation.last_run_at), 'PPpp')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {automation.status !== 'archived' && (
                <>
                  <DropdownMenuItem onClick={handleStatusToggle}>
                    {automation.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  {onRun && (
                    <DropdownMenuItem onClick={handleRun}>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Now
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {automation.status === 'archived' ? (
                <DropdownMenuItem onClick={() => onStatusChange?.('draft')}>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onStatusChange?.('archived')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
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
