'use client';

import { useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import {
  formatNumber,
  formatDuration,
  formatPercentage,
  type TimeSeriesDataPoint,
  type AnalyticsPeriod,
} from '@/types/analytics';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  Eye,
  Activity,
  TrendingUp,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface VisitorChartProps {
  data: TimeSeriesDataPoint[];
  period?: AnalyticsPeriod;
  chartType?: 'line' | 'area' | 'bar';
  showLegend?: boolean;
  isLoading?: boolean;
  className?: string;
}

export interface SessionChartProps {
  data: TimeSeriesDataPoint[];
  period?: AnalyticsPeriod;
  isLoading?: boolean;
  className?: string;
}

export interface PageViewChartProps {
  data: TimeSeriesDataPoint[];
  period?: AnalyticsPeriod;
  isLoading?: boolean;
  className?: string;
}

export interface TrafficTrendChartProps {
  data: TimeSeriesDataPoint[];
  period?: AnalyticsPeriod;
  isLoading?: boolean;
  metric?: 'visitors' | 'sessions' | 'page_views' | 'conversions';
  onMetricChange?: (metric: string) => void;
  className?: string;
}

// =============================================================================
// Custom Tooltip
// =============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-sm font-medium mb-2">
        {label && isValid(parseISO(label)) ? format(parseISO(label), 'MMM d, yyyy') : label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {entry.name.replace('_', ' ')}
              </span>
            </div>
            <span className="text-xs font-medium">
              {entry.dataKey === 'bounce_rate'
                ? formatPercentage(entry.value)
                : entry.dataKey === 'avg_duration'
                ? formatDuration(entry.value)
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Visitor Chart
// =============================================================================

export function VisitorChart({
  data,
  period = '30d',
  chartType = 'area',
  showLegend = true,
  isLoading = false,
  className,
}: VisitorChartProps) {
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      dateLabel: format(parseISO(d.date), period === '24h' ? 'HH:mm' : 'MMM d'),
    }));
  }, [data, period]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Visitors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'line' ? LineChart : AreaChart;
  const _DataComponent = chartType === 'bar' ? Bar : chartType === 'line' ? Line : Area;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Visitors Over Time
        </CardTitle>
        <CardDescription>
          Unique and returning visitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                tickFormatter={(v) => formatNumber(v, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {chartType === 'area' ? (
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ) : chartType === 'line' ? (
                <Line
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                <Bar
                  dataKey="visitors"
                  name="Visitors"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Session Chart
// =============================================================================

export function SessionChart({
  data,
  period = '30d',
  isLoading = false,
  className,
}: SessionChartProps) {
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      dateLabel: format(parseISO(d.date), period === '24h' ? 'HH:mm' : 'MMM d'),
    }));
  }, [data, period]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Sessions
        </CardTitle>
        <CardDescription>Total sessions over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNumber(v, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="sessions"
                name="Sessions"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Page View Chart
// =============================================================================

export function PageViewChart({
  data,
  period = '30d',
  isLoading = false,
  className,
}: PageViewChartProps) {
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      dateLabel: format(parseISO(d.date), period === '24h' ? 'HH:mm' : 'MMM d'),
    }));
  }, [data, period]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Page Views
        </CardTitle>
        <CardDescription>Total page views over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNumber(v, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="page_views"
                name="Page Views"
                stroke="hsl(var(--chart-3))"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Traffic Trend Chart (Configurable)
// =============================================================================

export function TrafficTrendChart({
  data,
  period = '30d',
  isLoading = false,
  metric = 'visitors',
  onMetricChange,
  className,
}: TrafficTrendChartProps) {
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      dateLabel: format(parseISO(d.date), period === '24h' ? 'HH:mm' : 'MMM d'),
    }));
  }, [data, period]);

  const metricConfig = {
    visitors: { label: 'Visitors', color: 'hsl(var(--primary))', icon: Users },
    sessions: { label: 'Sessions', color: 'hsl(var(--chart-2))', icon: Activity },
    page_views: { label: 'Page Views', color: 'hsl(var(--chart-3))', icon: Eye },
    conversions: { label: 'Conversions', color: 'hsl(var(--chart-4))', icon: TrendingUp },
  };

  const config = metricConfig[metric];
  const Icon = config.icon;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          Traffic Trend
        </CardTitle>
        {onMetricChange && (
          <Select value={metric} onValueChange={onMetricChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visitors">Visitors</SelectItem>
              <SelectItem value="sessions">Sessions</SelectItem>
              <SelectItem value="page_views">Page Views</SelectItem>
              <SelectItem value="conversions">Conversions</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNumber(v, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={metric}
                name={config.label}
                stroke={config.color}
                fill="url(#colorMetric)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
