'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency, type MRRHistory } from '@/types/command';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface MRRChartProps {
  data: MRRHistory[];
  title?: string;
  description?: string;
  showBreakdown?: boolean;
  showARR?: boolean;
  chartType?: 'area' | 'line';
  height?: number;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  formattedDate: string;
  mrr: number;
  arr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  reactivationMrr: number;
  netChange: number;
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
    payload?: ChartDataPoint;
  }>;
  label?: string;
  currency: string;
  showBreakdown: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
  showBreakdown,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as ChartDataPoint;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="text-sm font-medium mb-2">{data?.formattedDate || label}</p>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">MRR</span>
          <span className="text-sm font-semibold">
            {formatCurrency(data?.mrr || 0, currency)}
          </span>
        </div>

        {showBreakdown && data && (
          <>
            <div className="border-t my-2" />
            {data.newMrr > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-600">+ New</span>
                <span className="text-xs font-medium text-green-600">
                  {formatCurrency(data.newMrr, currency)}
                </span>
              </div>
            )}
            {data.expansionMrr > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600">+ Expansion</span>
                <span className="text-xs font-medium text-blue-600">
                  {formatCurrency(data.expansionMrr, currency)}
                </span>
              </div>
            )}
            {data.reactivationMrr > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-purple-600">+ Reactivation</span>
                <span className="text-xs font-medium text-purple-600">
                  {formatCurrency(data.reactivationMrr, currency)}
                </span>
              </div>
            )}
            {data.contractionMrr > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-orange-600">- Contraction</span>
                <span className="text-xs font-medium text-orange-600">
                  -{formatCurrency(data.contractionMrr, currency)}
                </span>
              </div>
            )}
            {data.churnedMrr > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-600">- Churned</span>
                <span className="text-xs font-medium text-red-600">
                  -{formatCurrency(data.churnedMrr, currency)}
                </span>
              </div>
            )}
            <div className="border-t my-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Net Change</span>
              <span
                className={cn(
                  'text-xs font-semibold',
                  data.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {data.netChange >= 0 ? '+' : ''}
                {formatCurrency(data.netChange, currency)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MRRChart({
  data,
  title = 'Monthly Recurring Revenue',
  description,
  showBreakdown = false,
  showARR = false,
  chartType = 'area',
  height = 350,
  isLoading = false,
  currency = 'USD',
  className,
}: MRRChartProps) {
  // Transform data for chart
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data.map((item) => ({
      date: item.period_date,
      formattedDate: format(parseISO(item.period_date), 'MMM d, yyyy'),
      mrr: item.mrr,
      arr: item.arr,
      newMrr: item.mrr_new,
      expansionMrr: item.mrr_expansion,
      contractionMrr: item.mrr_contraction,
      churnedMrr: item.mrr_churned,
      reactivationMrr: item.mrr_reactivation,
      netChange: item.net_mrr_change,
    }));
  }, [data]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (chartData.length < 2) return null;

    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    const first = chartData[0];

    const change = current.mrr - previous.mrr;
    const changePercent = previous.mrr > 0 ? (change / previous.mrr) * 100 : 0;
    const totalGrowth = first.mrr > 0 ? ((current.mrr - first.mrr) / first.mrr) * 100 : 0;

    return {
      currentMrr: current.mrr,
      change,
      changePercent,
      totalGrowth,
      trend: change >= 0 ? 'up' : 'down',
    };
  }, [chartData]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            <p>No MRR data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {stats && (
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatCurrency(stats.currentMrr, currency)}
              </p>
              <div className="flex items-center justify-end gap-1">
                {stats.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    stats.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {stats.changePercent >= 0 ? '+' : ''}
                  {stats.changePercent.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={chartData}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM d')}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency,
                }).format(value)
              }
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip
              content={
                <CustomTooltip
                  currency={currency}
                  showBreakdown={showBreakdown}
                />
              }
            />
            {showARR && <Legend />}
            {chartType === 'area' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="mrr"
                  name="MRR"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#mrrGradient)"
                />
                {showARR && (
                  <Area
                    type="monotone"
                    dataKey="arr"
                    name="ARR"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#arrGradient)"
                  />
                )}
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="mrr"
                  name="MRR"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                {showARR && (
                  <Line
                    type="monotone"
                    dataKey="arr"
                    name="ARR"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>

        {/* MRR Breakdown Legend */}
        {showBreakdown && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <Badge variant="outline" className="gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              New
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Expansion
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Reactivation
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Contraction
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Churn
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MRR Breakdown Bar Chart
// =============================================================================

export interface MRRBreakdownChartProps {
  data: MRRHistory[];
  height?: number;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export function MRRBreakdownChart({
  data,
  height = 300,
  isLoading = false,
  currency = 'USD',
  className,
}: MRRBreakdownChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: item.period_date,
      formattedDate: format(parseISO(item.period_date), 'MMM d'),
      new: item.mrr_new,
      expansion: item.mrr_expansion,
      reactivation: item.mrr_reactivation,
      contraction: -item.mrr_contraction,
      churn: -item.mrr_churned,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>MRR Movement</CardTitle>
        <CardDescription>Breakdown of MRR changes by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  style: 'currency',
                  currency,
                }).format(value)
              }
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(Math.abs(value), currency)}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="new" name="New" stackId="positive" fill="#22c55e" />
            <Bar dataKey="expansion" name="Expansion" stackId="positive" fill="#3b82f6" />
            <Bar dataKey="reactivation" name="Reactivation" stackId="positive" fill="#8b5cf6" />
            <Bar dataKey="contraction" name="Contraction" stackId="negative" fill="#f97316" />
            <Bar dataKey="churn" name="Churn" stackId="negative" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
