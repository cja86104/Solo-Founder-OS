'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { StripeSyncLog, SyncStatus, SyncType } from '@/types/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  RefreshCw,
  Settings,
  Download,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Zap,
  CreditCard,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface CommandCenterHeaderProps {
  title?: string;
  description?: string;
  lastSync?: StripeSyncLog | null;
  isSyncing?: boolean;
  onSync?: (type: SyncType) => Promise<void>;
  onExport?: () => void;
  onSettings?: () => void;
  className?: string;
}

// =============================================================================
// Sync Status Indicator
// =============================================================================

interface SyncStatusIndicatorProps {
  lastSync?: StripeSyncLog | null;
  isSyncing?: boolean;
}

function SyncStatusIndicator({ lastSync, isSyncing }: SyncStatusIndicatorProps) {
  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-muted-foreground">Syncing...</span>
      </div>
    );
  }

  if (!lastSync) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <span className="text-muted-foreground">Never synced</span>
      </div>
    );
  }

  const statusConfig: Record<SyncStatus, { icon: React.ElementType; color: string; label: string }> = {
    started: { icon: Loader2, color: 'text-blue-500', label: 'In Progress' },
    completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Synced' },
    failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  };

  const config = statusConfig[lastSync.status];
  const Icon = config.icon;
  const syncTime = lastSync.completed_at || lastSync.started_at;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm cursor-default">
            <Icon className={cn('h-4 w-4', config.color, lastSync.status === 'started' && 'animate-spin')} />
            <span className="text-muted-foreground">
              {config.label} {formatDistanceToNow(new Date(syncTime), { addSuffix: true })}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{lastSync.sync_type} sync</p>
            <p>Records synced: {lastSync.records_synced}</p>
            {lastSync.duration_ms && <p>Duration: {lastSync.duration_ms}ms</p>}
            {lastSync.error_message && (
              <p className="text-red-400">Error: {lastSync.error_message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {format(new Date(syncTime), 'PPpp')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// Sync Type Icons
// =============================================================================

const syncTypeIcons: Record<SyncType, React.ElementType> = {
  full: Zap,
  incremental: RefreshCw,
  customers: Users,
  subscriptions: CreditCard,
  invoices: FileText,
};

// =============================================================================
// Main Component
// =============================================================================

export function CommandCenterHeader({
  title = 'Command Center',
  description = 'Monitor your MRR, customers, and revenue metrics',
  lastSync,
  isSyncing = false,
  onSync,
  onExport,
  onSettings,
  className,
}: CommandCenterHeaderProps) {
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedSyncType, setSelectedSyncType] = useState<SyncType>('incremental');
  const [isConfirmingSyncing, setIsConfirmingSyncing] = useState(false);

  const handleSyncClick = (type: SyncType) => {
    if (type === 'full') {
      setSelectedSyncType(type);
      setSyncDialogOpen(true);
    } else {
      onSync?.(type);
    }
  };

  const handleConfirmSync = async () => {
    setIsConfirmingSyncing(true);
    try {
      await onSync?.(selectedSyncType);
      setSyncDialogOpen(false);
    } finally {
      setIsConfirmingSyncing(false);
    }
  };

  return (
    <>
      <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
        {/* Left side - Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Command className="h-6 w-6" />
            {title}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">{description}</p>
            <SyncStatusIndicator lastSync={lastSync} isSyncing={isSyncing} />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Sync Dropdown */}
          {onSync && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isSyncing}>
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sync Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSyncClick('incremental')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Incremental Sync
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Quick
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSyncClick('customers')}>
                  <Users className="h-4 w-4 mr-2" />
                  Sync Customers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSyncClick('subscriptions')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Sync Subscriptions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSyncClick('invoices')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Sync Invoices
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleSyncClick('full')}
                  className="text-orange-600"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Full Sync
                  <Badge variant="outline" className="ml-auto text-xs border-orange-500 text-orange-600">
                    Slow
                  </Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {/* Settings */}
          {onSettings && (
            <Button variant="ghost" size="icon" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Full Sync Confirmation Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Full Sync</DialogTitle>
            <DialogDescription>
              A full sync will re-fetch all data from Stripe. This can take several
              minutes depending on the amount of data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-700 dark:text-orange-400">
                    This operation may take a while
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Use incremental sync for regular updates. Full sync is recommended
                    only when data appears out of sync.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSyncDialogOpen(false)}
              disabled={isConfirmingSyncing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSync}
              disabled={isConfirmingSyncing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isConfirmingSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Start Full Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
