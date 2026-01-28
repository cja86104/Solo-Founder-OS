'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Activity,
  Search,
  CalendarIcon,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  Zap,
  Shield,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import {
  ActivityWithActor,
  ActivityCategory,
  AuditLog,
  getCategoryLabel,
  getCategoryIcon,
  getSeverityColor,
} from '@/types/activity';
import { cn } from '@/lib/utils';

export default function ActivityPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { isOwner, isAdmin } = usePermissions();

  // Activity state
  const [activities, setActivities] = useState<ActivityWithActor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 30,
    total: 0,
    totalPages: 0,
  });

  // Summary state
  const [summary, setSummary] = useState<{
    total: number;
    todayCount: number;
    weekCount: number;
    byCategory: Record<string, number>;
  } | null>(null);

  // Audit logs state (for owners/admins)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Fetch activities
  const fetchActivities = useCallback(async (loadMore = false) => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        workspace_id: currentWorkspace.id,
        page: loadMore ? (pagination.page + 1).toString() : '1',
        pageSize: pagination.pageSize.toString(),
      });

      if (search) params.set('search', search);
      if (dateRange.from) {
        params.set('date_from', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange.to) {
        params.set('date_to', endOfDay(dateRange.to).toISOString());
      }

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activities');

      const data = await response.json();

      if (loadMore) {
        setActivities((prev) => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, pagination.page, pagination.pageSize, search, dateRange]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch(
        `/api/activity?workspace_id=${currentWorkspace.id}&summary=true`
      );
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, [currentWorkspace]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    if (!currentWorkspace || (!isOwner && !isAdmin)) return;

    setAuditLoading(true);
    try {
      const response = await fetch(
        `/api/audit?workspace_id=${currentWorkspace.id}&pageSize=20`
      );
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [currentWorkspace, isOwner, isAdmin]);

  useEffect(() => {
    fetchActivities();
    fetchSummary();
  }, [fetchActivities, fetchSummary]);

  useEffect(() => {
    if (isOwner || isAdmin) {
      fetchAuditLogs();
    }
  }, [fetchAuditLogs, isOwner, isAdmin]);

  const handleRefresh = () => {
    fetchActivities();
    fetchSummary();
    if (isOwner || isAdmin) {
      fetchAuditLogs();
    }
  };

  const handleLoadMore = () => {
    fetchActivities(true);
  };

  if (workspaceLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
            <p className="text-muted-foreground">
              Please select a workspace to view activity.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Activity
          </h1>
          <p className="text-muted-foreground">
            Track all activity across your workspace
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{summary.todayCount}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{summary.weekCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contacts</p>
                  <p className="text-2xl font-bold">
                    {summary.byCategory.contacts || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pages</p>
                  <p className="text-2xl font-bold">
                    {summary.byCategory.landing_pages || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Feed
          </TabsTrigger>
          {(isOwner || isAdmin) && (
            <TabsTrigger value="audit" className="gap-2">
              <Shield className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          )}
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activity..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Date Range */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'MMM d')} -{' '}
                            {format(dateRange.to, 'MMM d')}
                          </>
                        ) : (
                          format(dateRange.from, 'MMM d, yyyy')
                        )
                      ) : (
                        'Pick dates'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={dateRange as any}
                      onSelect={(range: any) => setDateRange(range || {})}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                workspaceId={currentWorkspace.id}
                activities={activities}
                isLoading={isLoading}
                error={error}
                showFilters={true}
                showRefresh={false}
                maxHeight="600px"
                variant="default"
                groupByDate={true}
                onRefresh={handleRefresh}
                onLoadMore={handleLoadMore}
                hasMore={pagination.page < pagination.totalPages}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        {(isOwner || isAdmin) && (
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  Security and compliance events for your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No audit events yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full mt-2 shrink-0',
                              getSeverityColor(log.severity)
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {log.event_type.replace(/_/g, ' ')}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {log.event_category.replace(/_/g, ' ')}
                              </Badge>
                              <Badge
                                variant={
                                  log.severity === 'critical'
                                    ? 'destructive'
                                    : log.severity === 'warning'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {log.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{log.user_email || 'System'}</span>
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                              <span>
                                {format(new Date(log.created_at), 'PPpp')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
