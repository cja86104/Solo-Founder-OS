'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import {
  AutomationList,
  AutomationCard,
  AutomationStatusBadge,
} from '@/components/automations';
import type {
  Automation,
  AutomationWithActions,
  AutomationStatus,
} from '@/types/automations';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  Plus,
  RefreshCw,
  Activity,
  Pause,
  Play,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationsPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [automations, setAutomations] = useState<AutomationWithActions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch automations
  const fetchAutomations = useCallback(async (showRefreshIndicator = false) => {
    if (!currentWorkspace) return;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch(
        `/api/automations?workspace_id=${currentWorkspace.id}&include_actions=true`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || `HTTP ${response.status}`;
        console.error('Automations API error:', response.status, errorData);
        throw new Error(msg);
      }

      const data = await response.json();
      setAutomations(data.automations || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error('Failed to load automations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // Calculate stats
  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === 'active').length,
    paused: automations.filter((a) => a.status === 'paused').length,
    draft: automations.filter((a) => a.status === 'draft').length,
    totalRuns: automations.reduce((sum, a) => sum + a.run_count, 0),
  };

  // Handlers
  const handleCreateNew = () => {
    router.push('/automations/new');
  };

  const handleEdit = (automation: Automation | AutomationWithActions) => {
    router.push(`/automations/${automation.id}`);
  };

  const handleViewRuns = (automation: Automation | AutomationWithActions) => {
    router.push(`/automations/${automation.id}/runs`);
  };

  const handleStatusChange = async (
    automation: Automation | AutomationWithActions,
    newStatus: AutomationStatus
  ) => {
    try {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(
        newStatus === 'active'
          ? 'Automation activated'
          : newStatus === 'paused'
          ? 'Automation paused'
          : newStatus === 'archived'
          ? 'Automation archived'
          : 'Status updated'
      );

      fetchAutomations(true);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDuplicate = async (automation: Automation | AutomationWithActions) => {
    try {
      // Fetch full automation with actions
      const fetchRes = await fetch(`/api/automations/${automation.id}?include_actions=true`);
      if (!fetchRes.ok) throw new Error('Failed to fetch automation');
      const fullAutomation = await fetchRes.json();

      // Create duplicate
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace?.id,
          name: `${automation.name} (Copy)`,
          description: automation.description,
          trigger_type: automation.trigger_type,
          trigger_config: automation.trigger_config,
          status: 'draft',
          run_limit: automation.run_limit,
          cooldown_seconds: automation.cooldown_seconds,
          actions: fullAutomation.actions?.map((a: { action_type: string; action_config: unknown; position: number }) => ({
            action_type: a.action_type,
            action_config: a.action_config,
            position: a.position,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate automation');
      }

      toast.success('Automation duplicated');
      fetchAutomations(true);
    } catch (error) {
      console.error('Error duplicating automation:', error);
      toast.error('Failed to duplicate automation');
    }
  };

  const handleRun = async (automation: Automation | AutomationWithActions) => {
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
      fetchAutomations(true);
    } catch (error) {
      console.error('Error running automation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run automation');
    }
  };

  const handleDeleteConfirm = (automation: Automation | AutomationWithActions) => {
    setAutomationToDelete(automation);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!automationToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/automations/${automationToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete automation');
      }

      toast.success('Automation deleted');
      setDeleteDialogOpen(false);
      setAutomationToDelete(null);
      fetchAutomations(true);
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast.error('Failed to delete automation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  // Permission check
  if (!can('content.view')) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don&apos;t have permission to view automations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Automations
          </h1>
          <p className="text-muted-foreground">
            Create workflows that run automatically when triggered by events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAutomations(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {can('content.create') && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
              </div>
              <Pause className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold">{stats.totalRuns}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <AutomationList
        automations={automations}
        isLoading={isRefreshing}
        onCreateNew={can('content.create') ? handleCreateNew : undefined}
        onEdit={can('content.update') ? handleEdit : undefined}
        onDelete={can('content.delete') ? handleDeleteConfirm : undefined}
        onDuplicate={can('content.create') ? handleDuplicate : undefined}
        onStatusChange={can('content.update') ? handleStatusChange : undefined}
        onRun={can('content.update') ? handleRun : undefined}
        onClick={handleViewRuns}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{automationToDelete?.name}&quot;?
              This action cannot be undone. All run history and logs will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
