'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { StripeSyncLog, SyncType, SyncStatus as SyncStatusType } from '@/types/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Users,
  CreditCard,
  FileText,
  Zap,
  History,
  ChevronRight,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface SyncStatusProps {
  lastSync?: StripeSyncLog | null;
  isSyncing?: boolean;
  syncProgress?: number;
  onSync?: (type: SyncType) => Promise<void>;
  className?: string;
}

export interface SyncHistoryProps {
  logs: StripeSyncLog[];
  isLoading?: boolean;
  maxDisplay?: number;
  onViewAll?: () => void;
  className?: string;
}

export interface SyncLogDetailProps {
  log: StripeSyncLog;
  className?: string;
}

// =============================================================================
// Sync Type Config
// =============================================================================

const syncTypeConfig: Record<SyncType, { icon: React.ElementType; label: string; color: string }> = {
  full: { icon: Zap, label: 'Full Sync', color: 'text-orange-500' },
  incremental: { icon: RefreshCw, label: 'Incremental', color: 'text-blue-500' },
  customers: { icon: Users, label: 'Customers', color: 'text-green-500' },
  subscriptions: { icon: CreditCard, label: 'Subscriptions', color: 'text-purple-500' },
  invoices: { icon: FileText, label: 'Invoices', color: 'text-cyan-500' },
};

const syncStatusConfig: Record<SyncStatusType, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  started: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Failed' },
};

// =============================================================================
// Sync Status Badge
// =============================================================================

export interface SyncStatusBadgeProps {
  status: SyncStatusType;
  size?: 'sm' | 'default';
  className?: string;
}

export function SyncStatusBadge({ status, size = 'default', className }: SyncStatusBadgeProps) {
  const config = syncStatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        config.bgColor,
        config.color,
        'border-transparent',
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1',
        className
      )}
    >
      <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', status === 'started' && 'animate-spin')} />
      {config.label}
    </Badge>
  );
}

// =============================================================================
// Sync Status Card
// =============================================================================

export function SyncStatus({
  lastSync,
  isSyncing = false,
  syncProgress,
  onSync,
  className,
}: SyncStatusProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSync = async (type: SyncType) => {
    if (onSync) {
      await onSync(type);
    }
    setIsDialogOpen(false);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
            Stripe Sync
          </CardTitle>
          {lastSync && <SyncStatusBadge status={lastSync.status} size="sm" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status */}
        {isSyncing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Syncing data from Stripe...</span>
            </div>
            {syncProgress !== undefined && (
              <Progress value={syncProgress} className="h-2" />
            )}
          </div>
        ) : lastSync ? (
          <div className="space-y-3">
            {/* Last sync info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last sync</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      {formatDistanceToNow(new Date(lastSync.completed_at || lastSync.started_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(new Date(lastSync.completed_at || lastSync.started_at), 'PPpp')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Sync type */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <div className="flex items-center gap-1">
                {(() => {
                  const config = syncTypeConfig[lastSync.sync_type];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={cn('h-3.5 w-3.5', config.color)} />
                      <span>{config.label}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Records */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Records synced</span>
              <span className="font-medium">{lastSync.records_synced}</span>
            </div>

            {/* Duration */}
            {lastSync.duration_ms && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span>{(lastSync.duration_ms / 1000).toFixed(1)}s</span>
              </div>
            )}

            {/* Error */}
            {lastSync.status === 'failed' && lastSync.error_message && (
              <div className="p-2 rounded bg-red-500/10 text-red-600 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{lastSync.error_message}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Never synced</p>
            <p className="text-xs text-muted-foreground">
              Sync to import data from Stripe
            </p>
          </div>
        )}

        {/* Sync button */}
        {onSync && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Sync Type</DialogTitle>
                <DialogDescription>
                  Select what data to sync from Stripe
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                {(Object.entries(syncTypeConfig) as [SyncType, typeof syncTypeConfig[SyncType]][]).map(
                  ([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => handleSync(type)}
                      >
                        <Icon className={cn('h-5 w-5 mr-3', config.color)} />
                        <div className="text-left">
                          <p className="font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {type === 'full' && 'Re-import all data (slower)'}
                            {type === 'incremental' && 'Sync recent changes only (faster)'}
                            {type === 'customers' && 'Sync customer data only'}
                            {type === 'subscriptions' && 'Sync subscription data only'}
                            {type === 'invoices' && 'Sync invoice data only'}
                          </p>
                        </div>
                      </Button>
                    );
                  }
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sync History
// =============================================================================

export function SyncHistory({
  logs,
  isLoading = false,
  maxDisplay = 5,
  onViewAll,
  className,
}: SyncHistoryProps) {
  const displayLogs = logs.slice(0, maxDisplay);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Sync History
          </CardTitle>
          {onViewAll && logs.length > maxDisplay && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View all
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayLogs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sync history</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayLogs.map((log) => {
              const typeConfig = syncTypeConfig[log.sync_type];
              const statusConfig = syncStatusConfig[log.status];
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('p-1.5 rounded', statusConfig.bgColor)}>
                      <StatusIcon
                        className={cn(
                          'h-4 w-4',
                          statusConfig.color,
                          log.status === 'started' && 'animate-spin'
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn('h-3.5 w-3.5', typeConfig.color)} />
                        <span className="text-sm font-medium">{typeConfig.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{log.records_synced}</p>
                    <p className="text-xs text-muted-foreground">records</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sync Log Detail
// =============================================================================

export function SyncLogDetail({ log, className }: SyncLogDetailProps) {
  const typeConfig = syncTypeConfig[log.sync_type];
  const _statusConfig = syncStatusConfig[log.status];
  const TypeIcon = typeConfig.icon;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TypeIcon className={cn('h-5 w-5', typeConfig.color)} />
            {typeConfig.label}
          </CardTitle>
          <SyncStatusBadge status={log.status} />
        </div>
        <CardDescription>
          Started {format(new Date(log.started_at), 'PPpp')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{log.records_synced}</p>
            <p className="text-xs text-muted-foreground">Total Synced</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-600">{log.records_created}</p>
            <p className="text-xs text-muted-foreground">Created</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-600">{log.records_updated}</p>
            <p className="text-xs text-muted-foreground">Updated</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <p className="text-2xl font-bold text-red-600">{log.records_failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Timing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Started</span>
            <span>{format(new Date(log.started_at), 'PPpp')}</span>
          </div>
          {log.completed_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span>{format(new Date(log.completed_at), 'PPpp')}</span>
            </div>
          )}
          {log.duration_ms && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>{(log.duration_ms / 1000).toFixed(2)} seconds</span>
            </div>
          )}
          {log.triggered_by && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Triggered by</span>
              <span>{log.triggered_by}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {log.status === 'failed' && log.error_message && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Sync Failed</p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {log.error_message}
                </p>
                {log.error_details && (
                  <pre className="mt-2 p-2 bg-red-900/10 rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.error_details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
