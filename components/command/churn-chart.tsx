'use client';

import { useMemo } from 'react';
import {
  Area,
  BarChart,
  Bar,
  ComposedChart,
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
import {
  formatCurrency,
  calculateChurnRiskLevel,
  type MRRHistory,
  type Customer,
  type ChurnAnalysis,
} from '@/types/command';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Users,
  UserMinus,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface ChurnChartProps {
  data: MRRHistory[];
  title?: string;
  description?: string;
  height?: number;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export interface ChurnRateChartProps {
  data: MRRHistory[];
  height?: number;
  isLoading?: boolean;
  showTarget?: boolean;
  targetRate?: number;
  className?: string;
}

export interface AtRiskCustomersCardProps {
  customers: Customer[];
  maxDisplay?: number;
  isLoading?: boolean;
  onViewCustomer?: (customer: Customer) => void;
  className?: string;
}

export interface ChurnSummaryCardProps {
  analysis: ChurnAnalysis;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

// =============================================================================
// Churn Rate Chart
// =============================================================================

export function ChurnRateChart({
  data,
  height = 300,
  isLoading = false,
  showTarget = true,
  targetRate = 5,
  className,
}: ChurnRateChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: item.period_date,
      formattedDate: format(parseISO(item.period_date), 'MMM d'),
      churnRate: item.churn_rate,
      growthRate: item.growth_rate,
      churnedCustomers: item.churned_customers,
    }));
  }, [data]);

  // Calculate current vs target
  const currentRate = chartData.length > 0 ? chartData[chartData.length - 1].churnRate : 0;
  const isAboveTarget = currentRate > targetRate;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Churn Rate
            </CardTitle>
            <CardDescription>Monthly customer churn percentage</CardDescription>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-2xl font-bold',
                isAboveTarget ? 'text-red-600' : 'text-green-600'
              )}
            >
              {currentRate.toFixed(1)}%
            </p>
            {showTarget && (
              <p className="text-xs text-muted-foreground">
                Target: {targetRate}%
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="rate"
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12 }}
              domain={[0, 'auto']}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 12 }}
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === 'churnRate' ? `${value.toFixed(2)}%` : value
              }
            />
            <Legend />
            {showTarget && (
              <ReferenceLine
                yAxisId="rate"
                y={targetRate}
                stroke="#f97316"
                strokeDasharray="5 5"
                label={{ value: 'Target', position: 'right', fontSize: 10 }}
              />
            )}
            <Area
              yAxisId="rate"
              type="monotone"
              dataKey="churnRate"
              name="Churn Rate"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#churnGradient)"
            />
            <Bar
              yAxisId="count"
              dataKey="churnedCustomers"
              name="Churned Customers"
              fill="#fca5a5"
              opacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Churn vs Growth Chart
// =============================================================================

export interface ChurnGrowthComparisonProps {
  data: MRRHistory[];
  height?: number;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export function ChurnGrowthComparison({
  data,
  height = 300,
  isLoading = false,
  currency = 'USD',
  className,
}: ChurnGrowthComparisonProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: item.period_date,
      formattedDate: format(parseISO(item.period_date), 'MMM d'),
      newMrr: item.mrr_new + item.mrr_expansion + item.mrr_reactivation,
      lostMrr: item.mrr_churned + item.mrr_contraction,
      netMrr: item.net_mrr_change,
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
        <CardTitle>Revenue Movement</CardTitle>
        <CardDescription>New revenue vs lost revenue over time</CardDescription>
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
            <Bar dataKey="newMrr" name="New Revenue" fill="#22c55e" />
            <Bar dataKey="lostMrr" name="Lost Revenue" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>

        {/* Net summary */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Latest Net MRR Change
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  chartData[chartData.length - 1].netMrr >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                )}
              >
                {chartData[chartData.length - 1].netMrr >= 0 ? '+' : ''}
                {formatCurrency(chartData[chartData.length - 1].netMrr, currency)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// At-Risk Customers Card
// =============================================================================

export function AtRiskCustomersCard({
  customers,
  maxDisplay = 5,
  isLoading = false,
  onViewCustomer,
  className,
}: AtRiskCustomersCardProps) {
  const sortedCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.churn_risk_score - a.churn_risk_score)
      .slice(0, maxDisplay);
  }, [customers, maxDisplay]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            At-Risk Customers
          </CardTitle>
          <CardDescription>Customers with high churn risk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm font-medium text-green-600">
              No at-risk customers!
            </p>
            <p className="text-xs text-muted-foreground">
              All customers are in good standing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              At-Risk Customers
            </CardTitle>
            <CardDescription>Customers with high churn risk</CardDescription>
          </div>
          <Badge variant="destructive">{customers.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCustomers.map((customer) => {
            const riskLevel = calculateChurnRiskLevel(customer.churn_risk_score);
            const riskColors = {
              low: 'bg-green-500',
              medium: 'bg-yellow-500',
              high: 'bg-orange-500',
              critical: 'bg-red-500',
            };

            return (
              <div
                key={customer.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  onViewCustomer && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onViewCustomer?.(customer)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {customer.name || customer.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.company || customer.email}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(customer.mrr, customer.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">MRR</p>
                  </div>
                  <div className="w-16">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Risk</span>
                      <span className="text-xs font-medium">
                        {customer.churn_risk_score}%
                      </span>
                    </div>
                    <Progress
                      value={customer.churn_risk_score}
                      className="h-1.5"
                      indicatorClassName={riskColors[riskLevel]}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {customers.length > maxDisplay && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            +{customers.length - maxDisplay} more at-risk customers
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Churn Summary Card
// =============================================================================

export function ChurnSummaryCard({
  analysis,
  isLoading = false,
  currency: _currency = 'USD',
  className,
}: ChurnSummaryCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendIcon =
    analysis.churn_trend === 'improving' ? (
      <TrendingDown className="h-4 w-4 text-green-600" />
    ) : analysis.churn_trend === 'worsening' ? (
      <TrendingUp className="h-4 w-4 text-red-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-600" />
    );

  const trendColor =
    analysis.churn_trend === 'improving'
      ? 'text-green-600'
      : analysis.churn_trend === 'worsening'
      ? 'text-red-600'
      : 'text-yellow-600';

  const trendLabel =
    analysis.churn_trend === 'improving'
      ? 'Improving'
      : analysis.churn_trend === 'worsening'
      ? 'Worsening'
      : 'Stable';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserMinus className="h-5 w-5" />
          Churn Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rate */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Current Churn Rate</p>
            <p className="text-3xl font-bold">
              {analysis.current_churn_rate.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {trendIcon}
              <span className={cn('text-sm font-medium', trendColor)}>
                {trendLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              vs {analysis.previous_churn_rate.toFixed(1)}% last period
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">At Risk</p>
            <p className="text-xl font-semibold text-yellow-600">
              {analysis.at_risk_customers.length}
            </p>
          </div>
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Recently Churned</p>
            <p className="text-xl font-semibold text-red-600">
              {analysis.recently_churned.length}
            </p>
          </div>
        </div>

        {/* Top Churn Reasons */}
        {analysis.churn_reasons.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Top Churn Reasons</p>
            <div className="space-y-2">
              {analysis.churn_reasons.slice(0, 3).map((reason, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{reason.reason}</span>
                  <Badge variant="secondary">{reason.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
