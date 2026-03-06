'use client';

import { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AutomationRun, AutomationRunStatus } from '@/types/automations';
import { RunStatusBadge } from './automation-status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  Timer,
  Loader2,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface RunHistoryListProps {
  runs: AutomationRun[];
  totalRuns?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onViewRun?: (run: AutomationRun) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  showAutomationName?: boolean;
  className?: string;
}

type StatusFilter = 'all' | AutomationRunStatus;

// =============================================================================
// Stats Summary Component
// =============================================================================

interface RunStatsSummaryProps {
  runs: AutomationRun[];
}

function RunStatsSummary({ runs }: RunStatsSummaryProps) {
  const stats = useMemo(() => {
    const completed = runs.filter((r) => r.status === 'completed').length;
    const failed = runs.filter((r) => r.status === 'failed').length;
    const running = runs.filter((r) => r.status === 'running').length;
    const avgDuration = runs
      .filter((r) => r.duration_ms)
      .reduce((acc, r) => acc + (r.duration_ms || 0), 0) / (runs.filter((r) => r.duration_ms).length || 1);

    return {
      total: runs.length,
      completed,
      failed,
      running,
      successRate: runs.length > 0 ? Math.round((completed / runs.length) * 100) : 0,
      avgDuration: Math.round(avgDuration),
    };
  }, [runs]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="text-center">
        <p className="text-2xl font-semibold">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Total Runs</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
        <p className="text-xs text-muted-foreground">Completed</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
        <p className="text-xs text-muted-foreground">Failed</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold">{stats.successRate}%</p>
        <p className="text-xs text-muted-foreground">Success Rate</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold">{stats.avgDuration}ms</p>
        <p className="text-xs text-muted-foreground">Avg Duration</p>
      </div>
    </div>
  );
}

// =============================================================================
// Run Row Component
// =============================================================================

interface RunRowProps {
  run: AutomationRun;
  onViewRun?: (run: AutomationRun) => void;
  showAutomationName?: boolean;
}

function RunRow({ run, onViewRun, showAutomationName }: RunRowProps) {
  return (
    <TableRow
      className={cn(
        'cursor-pointer hover:bg-muted/50',
        run.status === 'failed' && 'bg-red-50/50 dark:bg-red-950/10'
      )}
      onClick={() => onViewRun?.(run)}
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="font-mono text-xs truncate max-w-[120px]">
            {run.id.slice(0, 8)}...
          </span>
          {showAutomationName && run.automation_id && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {run.automation_id.slice(0, 8)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <RunStatusBadge status={run.status} size="sm" />
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm">
                {run.started_at
                  ? formatDistanceToNow(new Date(run.started_at), { addSuffix: true })
                  : '-'}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {run.started_at ? format(new Date(run.started_at), 'PPpp') : 'Not started'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Timer className="h-3 w-3 text-muted-foreground" />
          {run.duration_ms ? `${run.duration_ms}ms` : '-'}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600">{run.actions_executed}</span>
          <span className="text-muted-foreground">/</span>
          <span className={cn('text-sm', run.actions_failed > 0 && 'text-red-600')}>
            {run.actions_failed}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {run.error_message ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-red-600 truncate max-w-[150px] block">
                  {run.error_message.slice(0, 30)}...
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{run.error_message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onViewRun?.(run);
          }}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// Main RunHistoryList Component
// =============================================================================

export function RunHistoryList({
  runs,
  totalRuns,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onViewRun,
  onRefresh,
  isLoading = false,
  showAutomationName = false,
  className,
}: RunHistoryListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter runs
  const filteredRuns = useMemo(() => {
    if (statusFilter === 'all') return runs;
    return runs.filter((run) => run.status === statusFilter);
  }, [runs, statusFilter]);

  // Pagination
  const totalPages = Math.ceil((totalRuns || runs.length) / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: runs.length,
      pending: runs.filter((r) => r.status === 'pending').length,
      running: runs.filter((r) => r.status === 'running').length,
      completed: runs.filter((r) => r.status === 'completed').length,
      failed: runs.filter((r) => r.status === 'failed').length,
      cancelled: runs.filter((r) => r.status === 'cancelled').length,
    };
  }, [runs]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Run History
            </CardTitle>
            <CardDescription>
              {totalRuns || runs.length} total runs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                <SelectItem value="failed">Failed ({statusCounts.failed})</SelectItem>
                <SelectItem value="running">Running ({statusCounts.running})</SelectItem>
                <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
              </SelectContent>
            </Select>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <RunStatsSummary runs={runs} />

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No runs found</p>
            {statusFilter !== 'all' && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Run ID</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[140px]">Started</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      onViewRun={onViewRun}
                      showAutomationName={showAutomationName}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && onPageChange && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
