'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import type {
  Automation,
  AutomationRun,
  AutomationRunLog,
  AutomationRunWithLogs,
} from '@/types/automations';
import {
  AutomationStatusBadge,
  TriggerTypeBadge,
  RunHistoryList,
  RunLogViewer,
} from '@/components/automations';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Zap,
  Activity,
  RefreshCw,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

// =============================================================================
// Types
// =============================================================================

interface RunWithLogs extends AutomationRun {
  logs: (AutomationRunLog & { action?: { action_type: string; position: number } | null })[];
}

// =============================================================================
// Page Component
// =============================================================================

export default function AutomationRunsPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [runStats, setRunStats] = useState<{
    total_runs: number;
    completed: number;
    failed: number;
    avg_duration_ms: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRuns, setTotalRuns] = useState(0);
  const pageSize = 20;

  // Selected run state
  const [selectedRun, setSelectedRun] = useState<RunWithLogs | null>(null);
  const [isLoadingRun, setIsLoadingRun] = useState(false);
  const [runSheetOpen, setRunSheetOpen] = useState(false);

  // Fetch automation details
  const fetchAutomation = useCallback(async () => {
    if (!automationId) return;

    try {
      const response = await fetch(`/api/automations/${automationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Automation not found');
          router.push('/automations');
          return;
        }
        throw new Error('Failed to fetch automation');
      }
      const data = await response.json();
      setAutomation(data);
    } catch (error) {
      console.error('Error fetching automation:', error);
      toast.error('Failed to load automation');
    }
  }, [automationId, router]);

  // Fetch runs
  const fetchRuns = useCallback(async (showRefreshIndicator = false) => {
    if (!automationId) return;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const offset = (currentPage - 1) * pageSize;
      const response = await fetch(
        `/api/automations/${automationId}/runs?limit=${pageSize}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch runs');
      }

      const data = await response.json();
      setRuns(data.runs || []);
      setTotalRuns(data.summary?.total_runs || 0);
      setRunStats(data.summary || null);
    } catch (error) {
      console.error('Error fetching runs:', error);
      toast.error('Failed to load runs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [automationId, currentPage, pageSize]);

  // Fetch single run with logs
  const fetchRunDetails = async (run: AutomationRun) => {
    setIsLoadingRun(true);
    setRunSheetOpen(true);

    try {
      // Fetch run details
      const runResponse = await fetch(`/api/automations/runs/${run.id}`);
      if (!runResponse.ok) throw new Error('Failed to fetch run');
      const runData = await runResponse.json();

      // Fetch logs
      const logsResponse = await fetch(`/api/automations/runs/${run.id}/logs?limit=100`);
      if (!logsResponse.ok) throw new Error('Failed to fetch logs');
      const logsData = await logsResponse.json();

      setSelectedRun({
        ...runData,
        logs: logsData.logs || [],
      });
    } catch (error) {
      console.error('Error fetching run details:', error);
      toast.error('Failed to load run details');
      setRunSheetOpen(false);
    } finally {
      setIsLoadingRun(false);
    }
  };

  // Refresh selected run logs
  const refreshRunLogs = async () => {
    if (!selectedRun) return;

    try {
      const logsResponse = await fetch(`/api/automations/runs/${selectedRun.id}/logs?limit=100`);
      if (!logsResponse.ok) throw new Error('Failed to fetch logs');
      const logsData = await logsResponse.json();

      setSelectedRun({
        ...selectedRun,
        logs: logsData.logs || [],
      });
    } catch (error) {
      console.error('Error refreshing logs:', error);
      toast.error('Failed to refresh logs');
    }
  };

  // Cancel run
  const handleCancelRun = async (run: AutomationRun) => {
    try {
      const response = await fetch(`/api/automations/runs/${run.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) throw new Error('Failed to cancel run');

      toast.success('Run cancelled');
      fetchRuns(true);

      if (selectedRun?.id === run.id) {
        setSelectedRun({ ...selectedRun, status: 'cancelled' });
      }
    } catch (error) {
      console.error('Error cancelling run:', error);
      toast.error('Failed to cancel run');
    }
  };

  // Run automation now
  const handleRunNow = async () => {
    if (!automation) return;

    try {
      const response = await fetch(`/api/automations/${automation.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_data: { manual: true } }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run automation');
      }

      const result = await response.json();
      toast.success(`Automation started (Run ID: ${result.run.id.slice(0, 8)}...)`);
      fetchRuns(true);
    } catch (error) {
      console.error('Error running automation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run automation');
    }
  };

  useEffect(() => {
    fetchAutomation();
  }, [fetchAutomation]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Not found
  if (!automation) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Automation Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The automation you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push('/automations')}>
              Back to Automations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/automations/${automation.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Run History
              </h1>
              <AutomationStatusBadge status={automation.status} size="sm" />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{automation.name}</span>
              <TriggerTypeBadge triggerType={automation.trigger_type} size="sm" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRuns(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {can('automations.update') && automation.status !== 'archived' && (
            <Button onClick={handleRunNow}>
              <Play className="h-4 w-4 mr-2" />
              Run Now
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {runStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold">{runStats.total_runs}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{runStats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{runStats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{Math.round(runStats.avg_duration_ms)}ms</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Runs List */}
      <RunHistoryList
        runs={runs}
        totalRuns={totalRuns}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onViewRun={fetchRunDetails}
        onRefresh={() => fetchRuns(true)}
        isLoading={isRefreshing}
      />

      {/* Run Details Sheet */}
      <Sheet open={runSheetOpen} onOpenChange={setRunSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Run Details
              {selectedRun && (
                <span className="text-xs font-mono text-muted-foreground">
                  {selectedRun.id.slice(0, 8)}
                </span>
              )}
            </SheetTitle>
            <SheetDescription>
              {selectedRun?.started_at
                ? `Started ${format(new Date(selectedRun.started_at), 'PPpp')}`
                : 'Run details and execution logs'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isLoadingRun ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedRun ? (
              <div className="space-y-6">
                {/* Run Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize">{selectedRun.status}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">
                      {selectedRun.duration_ms ? `${selectedRun.duration_ms}ms` : '-'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Actions Executed</p>
                    <p className="text-sm font-medium">{selectedRun.actions_executed}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Actions Failed</p>
                    <p className="text-sm font-medium text-red-600">
                      {selectedRun.actions_failed}
                    </p>
                  </div>
                </div>

                {/* Cancel button for running/pending */}
                {(selectedRun.status === 'running' || selectedRun.status === 'pending') && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleCancelRun(selectedRun)}
                  >
                    Cancel Run
                  </Button>
                )}

                {/* Logs */}
                <RunLogViewer
                  run={selectedRun}
                  logs={selectedRun.logs}
                  onRefresh={refreshRunLogs}
                  isLoading={false}
                />

                {/* Trigger Data */}
                {selectedRun.trigger_data && Object.keys(selectedRun.trigger_data).length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Trigger Data</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 pb-3">
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedRun.trigger_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No run selected</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
