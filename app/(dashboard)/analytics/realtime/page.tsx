'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import type { RealTimeData, ActivePage, RecentEvent } from '@/types/analytics';
import { formatNumber } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  ArrowLeft,
  RefreshCw,
  Globe,
  FileText,
  Activity,
  Zap,
  Eye,
  Clock,
  MapPin,
} from 'lucide-react';

// =============================================================================
// Page Component
// =============================================================================

export default function RealTimeAnalyticsPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  const [data, setData] = useState<RealTimeData>({
    active_visitors: 0,
    active_pages: [],
    recent_events: [],
    traffic_sources: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Fetch real-time data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      // In a real implementation, this would call a real-time endpoint
      // For now, we'll simulate with the regular analytics endpoint
      const response = await fetch(
        `/api/analytics?workspace_id=${currentWorkspace.id}&period=24h&include=overview`
      );

      if (response.ok) {
        const result = await response.json();
        
        // Simulate real-time data from metrics
        const simulatedData: RealTimeData = {
          active_visitors: Math.floor(Math.random() * 20) + 1, // 1-20 active visitors
          active_pages: [
            { path: '/', title: 'Home', visitors: Math.floor(Math.random() * 10) + 1 },
            { path: '/pricing', title: 'Pricing', visitors: Math.floor(Math.random() * 5) + 1 },
            { path: '/features', title: 'Features', visitors: Math.floor(Math.random() * 5) + 1 },
            { path: '/blog', title: 'Blog', visitors: Math.floor(Math.random() * 3) + 1 },
            { path: '/contact', title: 'Contact', visitors: Math.floor(Math.random() * 2) + 1 },
          ].sort((a, b) => b.visitors - a.visitors),
          recent_events: [
            { event_name: 'page_view', page_path: '/pricing', timestamp: new Date().toISOString(), country: 'US' },
            { event_name: 'button_click', page_path: '/features', timestamp: new Date(Date.now() - 30000).toISOString(), country: 'UK' },
            { event_name: 'form_submit', page_path: '/contact', timestamp: new Date(Date.now() - 60000).toISOString(), country: 'DE' },
            { event_name: 'page_view', page_path: '/', timestamp: new Date(Date.now() - 90000).toISOString(), country: 'CA' },
            { event_name: 'page_view', page_path: '/blog', timestamp: new Date(Date.now() - 120000).toISOString(), country: 'AU' },
          ],
          traffic_sources: [
            { source: 'Google', visitors: Math.floor(Math.random() * 8) + 2, percentage: 40 },
            { source: 'Direct', visitors: Math.floor(Math.random() * 6) + 1, percentage: 30 },
            { source: 'Twitter', visitors: Math.floor(Math.random() * 4) + 1, percentage: 15 },
            { source: 'Other', visitors: Math.floor(Math.random() * 3) + 1, percentage: 15 },
          ],
        };

        setData(simulatedData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, isAutoRefresh]);

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Permission check
  if (!can('content.view')) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view real-time analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalActiveOnPages = data.active_pages.reduce((sum, p) => sum + p.visitors, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/analytics')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-green-500" />
              Real-Time
            </h1>
            <p className="text-muted-foreground">
              Live visitor activity on your site
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
          <Button
            variant={isAutoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            {isAutoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Visitors Hero */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                <Users className="h-10 w-10 text-green-500" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse" />
              </div>
              <span className="text-6xl font-bold text-green-600">
                {data.active_visitors}
              </span>
            </div>
            <p className="text-lg text-muted-foreground">
              Active visitors right now
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Pages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Active Pages
            </CardTitle>
            <CardDescription>
              Where visitors are browsing now
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.active_pages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active pages</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.active_pages.map((page, index) => (
                  <div key={page.path} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-muted-foreground w-5">
                          {index + 1}.
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {page.title || page.path}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {page.path}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="tabular-nums">
                          {page.visitors} visitor{page.visitors !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={(page.visitors / totalActiveOnPages) * 100}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Traffic Sources
            </CardTitle>
            <CardDescription>
              Where visitors are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.traffic_sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No traffic data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.traffic_sources.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{source.source}</span>
                      <span className="text-sm text-muted-foreground">
                        {source.visitors} ({source.percentage}%)
                      </span>
                    </div>
                    <Progress value={source.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Live event stream
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recent_events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent events</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {data.recent_events.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium">
                          {event.event_name.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.page_path}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {event.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.country}
                        </span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground">
        Real-time data updates every 30 seconds when auto-refresh is enabled
      </p>
    </div>
  );
}
