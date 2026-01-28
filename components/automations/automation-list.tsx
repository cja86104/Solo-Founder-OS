'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type {
  Automation,
  AutomationWithActions,
  AutomationStatus,
  AutomationTriggerType,
} from '@/types/automations';
import { AutomationCard } from './automation-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  Zap,
  SlidersHorizontal,
  LayoutGrid,
  LayoutList,
  Loader2,
  FolderOpen,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface AutomationListProps {
  automations: (Automation | AutomationWithActions)[];
  isLoading?: boolean;
  onCreateNew?: () => void;
  onEdit?: (automation: Automation | AutomationWithActions) => void;
  onDelete?: (automation: Automation | AutomationWithActions) => void;
  onDuplicate?: (automation: Automation | AutomationWithActions) => void;
  onStatusChange?: (automation: Automation | AutomationWithActions, status: AutomationStatus) => void;
  onRun?: (automation: Automation | AutomationWithActions) => void;
  onClick?: (automation: Automation | AutomationWithActions) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | AutomationStatus;
type TriggerFilter = 'all' | AutomationTriggerType;

// =============================================================================
// Trigger Type Options
// =============================================================================

const triggerOptions: { value: TriggerFilter; label: string }[] = [
  { value: 'all', label: 'All Triggers' },
  { value: 'new_contact', label: 'New Contact' },
  { value: 'contact_updated', label: 'Contact Updated' },
  { value: 'contact_tagged', label: 'Contact Tagged' },
  { value: 'deal_created', label: 'Deal Created' },
  { value: 'deal_stage_changed', label: 'Stage Changed' },
  { value: 'deal_won', label: 'Deal Won' },
  { value: 'deal_lost', label: 'Deal Lost' },
  { value: 'form_submitted', label: 'Form Submitted' },
  { value: 'feedback_received', label: 'Feedback' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'manual', label: 'Manual' },
];

// =============================================================================
// Component
// =============================================================================

export function AutomationList({
  automations,
  isLoading = false,
  onCreateNew,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onRun,
  onClick,
  className,
}: AutomationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter automations
  const filteredAutomations = useMemo(() => {
    return automations.filter((automation) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = automation.name.toLowerCase().includes(query);
        const matchesDescription = automation.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && automation.status !== statusFilter) {
        return false;
      }

      // Trigger filter
      if (triggerFilter !== 'all' && automation.trigger_type !== triggerFilter) {
        return false;
      }

      return true;
    });
  }, [automations, searchQuery, statusFilter, triggerFilter]);

  // Group by status for summary
  const statusCounts = useMemo(() => {
    return {
      all: automations.length,
      active: automations.filter((a) => a.status === 'active').length,
      paused: automations.filter((a) => a.status === 'paused').length,
      draft: automations.filter((a) => a.status === 'draft').length,
      archived: automations.filter((a) => a.status === 'archived').length,
    };
  }, [automations]);

  // =========================================================================
  // Loading State
  // =========================================================================
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // =========================================================================
  // Empty State (no automations at all)
  // =========================================================================
  if (automations.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Zap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-4">
          Create your first automation to start streamlining your workflows.
          Automations run automatically when triggered by events.
        </p>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Trigger Filter */}
        <Select
          value={triggerFilter}
          onValueChange={(value) => setTriggerFilter(value as TriggerFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by trigger" />
          </SelectTrigger>
          <SelectContent>
            {triggerOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>

        {/* Create Button */}
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({statusCounts.active})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({statusCounts.paused})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({statusCounts.draft})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({statusCounts.archived})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Empty State (filtered results empty) */}
      {filteredAutomations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/30">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">No automations found</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            {searchQuery
              ? `No automations match "${searchQuery}"`
              : 'No automations match the selected filters'}
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTriggerFilter('all');
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Automation Grid/List */}
      {filteredAutomations.length > 0 && (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          )}
        >
          {filteredAutomations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              variant={viewMode === 'list' ? 'compact' : 'default'}
              onEdit={() => onEdit?.(automation)}
              onDelete={() => onDelete?.(automation)}
              onDuplicate={() => onDuplicate?.(automation)}
              onStatusChange={(status) => onStatusChange?.(automation, status)}
              onRun={() => onRun?.(automation)}
              onClick={() => onClick?.(automation)}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredAutomations.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredAutomations.length} of {automations.length} automation
          {automations.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
