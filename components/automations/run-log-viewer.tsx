'use client';

import { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  AutomationRunLog,
  AutomationLogLevel,
  AutomationRun,
} from '@/types/automations';
import { RunStatusBadge } from './automation-status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface RunLogViewerProps {
  run: AutomationRun;
  logs: (AutomationRunLog & { action?: { action_type: string; position: number } | null })[];
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

type LogLevelFilter = 'all' | AutomationLogLevel;

// =============================================================================
// Log Level Config
// =============================================================================

const logLevelConfig: Record<AutomationLogLevel, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    label: 'Info',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    label: 'Warning',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    label: 'Error',
  },
  debug: {
    icon: Bug,
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/10',
    label: 'Debug',
  },
};

// =============================================================================
// Single Log Entry Component
// =============================================================================

interface LogEntryProps {
  log: AutomationRunLog & { action?: { action_type: string; position: number } | null };
  isFirst: boolean;
}

function LogEntry({ log, isFirst }: LogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = logLevelConfig[log.level];
  const Icon = config.icon;
  const hasDetails = log.details && Object.keys(log.details).length > 0;

  return (
    <div className={cn('relative pl-6', !isFirst && 'pt-2')}>
      {/* Timeline line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
      
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center',
          config.bgColor,
          isFirst ? 'top-0' : 'top-2'
        )}
      >
        <div className={cn('w-2 h-2 rounded-full', config.color.replace('text-', 'bg-'))} />
      </div>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            'rounded-lg border p-3',
            log.level === 'error' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20',
            log.level === 'warning' && 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20'
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  {config.label}
                </Badge>
                
                {log.action && (
                  <Badge variant="secondary" className="text-xs">
                    Step {log.action.position + 1}: {log.action.action_type}
                  </Badge>
                )}
                
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(log.created_at), 'HH:mm:ss.SSS')}
                </span>
              </div>
              
              <p className="text-sm mt-1">{log.message}</p>
              
              {hasDetails && (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 mt-1 text-xs"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 mr-1" />
                    )}
                    {isExpanded ? 'Hide' : 'Show'} details
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </div>

          <CollapsibleContent>
            {hasDetails && (
              <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

// =============================================================================
// Main RunLogViewer Component
// =============================================================================

export function RunLogViewer({
  run,
  logs,
  onRefresh,
  isLoading = false,
  className,
}: RunLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Level filter
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesMessage = log.message.toLowerCase().includes(query);
        const matchesDetails = JSON.stringify(log.details).toLowerCase().includes(query);
        if (!matchesMessage && !matchesDetails) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, levelFilter]);

  // Log level counts
  const levelCounts = useMemo(() => {
    return {
      all: logs.length,
      info: logs.filter((l) => l.level === 'info').length,
      warning: logs.filter((l) => l.level === 'warning').length,
      error: logs.filter((l) => l.level === 'error').length,
      debug: logs.filter((l) => l.level === 'debug').length,
    };
  }, [logs]);

  // Export logs as JSON
  const handleExport = () => {
    const exportData = {
      run: {
        id: run.id,
        status: run.status,
        started_at: run.started_at,
        completed_at: run.completed_at,
        duration_ms: run.duration_ms,
      },
      logs: filteredLogs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-run-${run.id}-logs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Run Logs
              <RunStatusBadge status={run.status} size="sm" />
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {run.started_at
                  ? formatDistanceToNow(new Date(run.started_at), { addSuffix: true })
                  : 'Not started'}
              </span>
              {run.duration_ms && (
                <span>Duration: {run.duration_ms}ms</span>
              )}
              <span>
                {run.actions_executed} executed, {run.actions_failed} failed
              </span>
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={levelFilter}
            onValueChange={(value) => setLevelFilter(value as LogLevelFilter)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels ({levelCounts.all})</SelectItem>
              <SelectItem value="info">Info ({levelCounts.info})</SelectItem>
              <SelectItem value="warning">Warning ({levelCounts.warning})</SelectItem>
              <SelectItem value="error">Error ({levelCounts.error})</SelectItem>
              <SelectItem value="debug">Debug ({levelCounts.debug})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error Summary */}
        {run.error_message && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Run Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {run.error_message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Log Entries */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {logs.length === 0 ? (
              <p>No logs recorded for this run.</p>
            ) : (
              <p>No logs match the current filters.</p>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredLogs.map((log, index) => (
              <LogEntry key={log.id} log={log} isFirst={index === 0} />
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredLogs.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Showing {filteredLogs.length} of {logs.length} log entries
          </p>
        )}
      </CardContent>
    </Card>
  );
}
