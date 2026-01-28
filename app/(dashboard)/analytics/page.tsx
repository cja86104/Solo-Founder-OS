'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import type {
  AnalyticsMetrics,
  TimeSeriesDataPoint,
  TopPage,
  TopReferrer,
  DeviceBreakdown,
  GeoBreakdown,
  AnalyticsPeriod,
} from '@/types/analytics';
import { getPeriodLabel } from '@/types/analytics';
import {
  AnalyticsStatsGrid,
  TrafficStats,
  EngagementStats,
  ConversionStats,
  VisitorChart,
  TrafficTrendChart,
  TopPagesList,
  TopReferrersList,
  DeviceBreakdownChart,
  DeviceBreakdownList,
  GeoBreakdownChart,
} from '@/components/analytics';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  BarChart3,
  Users,
  Globe,
  Target,
  Download,
  RefreshCw,
  Settings,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface AnalyticsData {
  metrics: AnalyticsMetrics | null;
  timeSeries: TimeSeriesDataPoint[];
  topPages: TopPage[];
  topReferrers: TopReferrer[];
  deviceBreakdown: DeviceBreakdown[];
  geoBreakdown: GeoBreakdown[];
}

// =============================================================================
// Page Component
// =============================================================================

export default function AnalyticsPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [data, setData] = useState<AnalyticsData>({
    metrics: null,
    timeSeries: [],
    topPages: [],
    topReferrers: [],
    deviceBreakdown: [],
    geoBreakdown: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [trendMetric, setTrendMetric] = useState<string>('visitors');

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const includes = ['overview', 'timeseries', 'pages', 'referrers', 'devices', 'geo'];
      const response = await fetch(
        `/api/analytics?workspace_id=${currentWorkspace.id}&period=${period}&include=${includes.join(',')}`
      );

      if (response.ok) {
        const result = await response.json();
        setData({
          metrics: result.metrics || null,
          timeSeries: result.time_series || [],
          topPages: result.top_pages || [],
          topReferrers: result.top_referrers || [],
          deviceBreakdown: result.device_breakdown || [],
          geoBreakdown: result.geo_breakdown || [],
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle export
  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  // Handle settings
  const handleSettings = () => {
    router.push('/settings/analytics');
  };

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Permission check
  if (!can('content.view')) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LineChart className="h-6 w-6" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your website performance and visitor behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <AnalyticsStatsGrid metrics={data.metrics} isLoading={isLoading} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="traffic" className="gap-2">
            <Users className="h-4 w-4" />
            Traffic
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="geo" className="gap-2">
            <Globe className="h-4 w-4" />
            Geography
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Main Chart */}
          <TrafficTrendChart
            data={data.timeSeries}
            period={period}
            metric={trendMetric as 'visitors' | 'sessions' | 'page_views' | 'conversions'}
            onMetricChange={setTrendMetric}
          />

          {/* Secondary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPagesList
              pages={data.topPages}
              maxItems={5}
              onViewAll={() => setActiveTab('engagement')}
            />
            <TopReferrersList
              referrers={data.topReferrers}
              maxItems={5}
              onViewAll={() => setActiveTab('traffic')}
            />
          </div>

          {/* Third Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DeviceBreakdownChart data={data.deviceBreakdown} />
            <GeoBreakdownChart data={data.geoBreakdown} maxItems={5} />
            <ConversionStats metrics={data.metrics} />
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6 mt-6">
          {/* Traffic Stats */}
          <TrafficStats metrics={data.metrics} />

          {/* Visitor Chart */}
          <VisitorChart
            data={data.timeSeries}
            period={period}
            chartType="area"
          />

          {/* Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopReferrersList
              referrers={data.topReferrers}
              maxItems={10}
              showViewAll={false}
            />
            <DeviceBreakdownList data={data.deviceBreakdown} />
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6 mt-6">
          {/* Engagement Stats */}
          <EngagementStats metrics={data.metrics} />

          {/* Top Pages */}
          <TopPagesList
            pages={data.topPages}
            maxItems={15}
            showViewAll={false}
          />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisitorChart
              data={data.timeSeries}
              period={period}
              chartType="bar"
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Conversion Goals
                </CardTitle>
                <CardDescription>
                  Track your conversion goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionStats metrics={data.metrics} />
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/analytics/goals')}
                  >
                    Manage Goals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geo" className="space-y-6 mt-6">
          {/* Geo Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GeoBreakdownChart
              data={data.geoBreakdown}
              maxItems={15}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>
                  Where your visitors are located
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.geoBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No geographic data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold">
                          {data.geoBreakdown.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Countries</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold">
                          {data.geoBreakdown[0]?.country || '-'}
                        </p>
                        <p className="text-sm text-muted-foreground">Top Country</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.geoBreakdown[0]?.percentage.toFixed(1)}% of traffic comes from{' '}
                      {data.geoBreakdown[0]?.country}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device by Country Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeviceBreakdownChart data={data.deviceBreakdown} />
            <DeviceBreakdownList data={data.deviceBreakdown} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Period Label */}
      <div className="text-center text-sm text-muted-foreground">
        Showing data for {getPeriodLabel(period).toLowerCase()}
      </div>
    </div>
  );
}
