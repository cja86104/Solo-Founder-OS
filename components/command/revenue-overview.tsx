'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatPercentage,
  type MRRMetrics,
  type Customer,
  type RevenueEvent,
} from '@/types/command';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CreditCard,
  Calendar,
  Target,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface RevenueOverviewProps {
  metrics: MRRMetrics | null;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export interface RevenueByPlanProps {
  customers: Customer[];
  isLoading?: boolean;
  currency?: string;
  maxPlans?: number;
  className?: string;
}

export interface RecentRevenueEventsProps {
  events: RevenueEvent[];
  isLoading?: boolean;
  currency?: string;
  maxEvents?: number;
  className?: string;
}

export interface MonthlyTargetProps {
  currentMrr: number;
  targetMrr: number;
  previousMrr: number;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

// =============================================================================
// Revenue Overview Card
// =============================================================================

export function RevenueOverview({
  metrics,
  isLoading = false,
  currency = 'USD',
  className,
}: RevenueOverviewProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No revenue data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const netNewMrr =
    metrics.new_mrr +
    metrics.expansion_mrr +
    (metrics.reactivation_mrr || 0) -
    metrics.churned_mrr -
    metrics.contraction_mrr;

  const isGrowing = netNewMrr >= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Overview
        </CardTitle>
        <CardDescription>Current period breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main MRR Display */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current MRR</p>
            <p className="text-3xl font-bold">
              {formatCurrency(metrics.current_mrr, currency)}
            </p>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isGrowing ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isGrowing ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {formatPercentage(metrics.mrr_change_percent)}
            </div>
            <p className="text-xs text-muted-foreground">vs last period</p>
          </div>
        </div>

        <Separator />

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">MRR Movement</h4>

          {/* Positive */}
          <div className="space-y-2">
            <RevenueLineItem
              label="New"
              value={metrics.new_mrr}
              currency={currency}
              type="positive"
            />
            <RevenueLineItem
              label="Expansion"
              value={metrics.expansion_mrr}
              currency={currency}
              type="positive"
            />
            {(metrics.reactivation_mrr || 0) > 0 && (
              <RevenueLineItem
                label="Reactivation"
                value={metrics.reactivation_mrr || 0}
                currency={currency}
                type="positive"
              />
            )}
          </div>

          {/* Negative */}
          <div className="space-y-2">
            <RevenueLineItem
              label="Contraction"
              value={metrics.contraction_mrr}
              currency={currency}
              type="negative"
            />
            <RevenueLineItem
              label="Churned"
              value={metrics.churned_mrr}
              currency={currency}
              type="negative"
            />
          </div>

          {/* Net */}
          <div className="pt-2 border-t">
            <RevenueLineItem
              label="Net New MRR"
              value={netNewMrr}
              currency={currency}
              type={netNewMrr >= 0 ? 'positive' : 'negative'}
              highlight
            />
          </div>
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ARR</p>
            <p className="text-lg font-semibold">
              {formatCurrency(metrics.current_arr, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ARPU</p>
            <p className="text-lg font-semibold">
              {formatCurrency(metrics.arpu, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Growth Rate</p>
            <p
              className={cn(
                'text-lg font-semibold',
                metrics.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatPercentage(metrics.growth_rate)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Churn Rate</p>
            <p
              className={cn(
                'text-lg font-semibold',
                metrics.churn_rate <= 5 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {metrics.churn_rate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Revenue Line Item
// =============================================================================

interface RevenueLineItemProps {
  label: string;
  value: number;
  currency: string;
  type: 'positive' | 'negative' | 'neutral';
  highlight?: boolean;
}

function RevenueLineItem({
  label,
  value,
  currency,
  type,
  highlight = false,
}: RevenueLineItemProps) {
  const prefix = type === 'positive' ? '+' : type === 'negative' ? '-' : '';
  const color =
    type === 'positive'
      ? 'text-green-600'
      : type === 'negative'
      ? 'text-red-600'
      : 'text-foreground';

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        highlight && 'font-semibold'
      )}
    >
      <span className={cn('text-sm', highlight ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span className={cn('text-sm', color)}>
        {prefix}
        {formatCurrency(Math.abs(value), currency)}
      </span>
    </div>
  );
}

// =============================================================================
// Revenue by Plan Chart
// =============================================================================

const PLAN_COLORS = [
  'hsl(var(--primary))',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
  '#ec4899',
];

export function RevenueByPlan({
  customers,
  isLoading = false,
  currency = 'USD',
  maxPlans = 6,
  className,
}: RevenueByPlanProps) {
  const planData = useMemo(() => {
    const planMap = new Map<string, { mrr: number; count: number }>();

    customers.forEach((customer) => {
      const plan = customer.plan_name || 'Unknown';
      const existing = planMap.get(plan) || { mrr: 0, count: 0 };
      planMap.set(plan, {
        mrr: existing.mrr + customer.mrr,
        count: existing.count + 1,
      });
    });

    const sorted = Array.from(planMap.entries())
      .map(([name, data]) => ({
        name,
        mrr: data.mrr,
        count: data.count,
      }))
      .sort((a, b) => b.mrr - a.mrr);

    // Group small plans into "Other"
    if (sorted.length > maxPlans) {
      const top = sorted.slice(0, maxPlans - 1);
      const other = sorted.slice(maxPlans - 1).reduce(
        (acc, plan) => ({
          name: 'Other',
          mrr: acc.mrr + plan.mrr,
          count: acc.count + plan.count,
        }),
        { name: 'Other', mrr: 0, count: 0 }
      );
      return [...top, other];
    }

    return sorted;
  }, [customers, maxPlans]);

  const totalMrr = planData.reduce((sum, p) => sum + p.mrr, 0);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (planData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Revenue by Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No plan data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Revenue by Plan
        </CardTitle>
        <CardDescription>MRR distribution across plans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chart */}
          <div className="h-48 w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  dataKey="mrr"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {planData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PLAN_COLORS[index % PLAN_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {planData.map((plan, index) => {
              const percent = totalMrr > 0 ? (plan.mrr / totalMrr) * 100 : 0;
              return (
                <div key={plan.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
                    />
                    <span className="text-sm">{plan.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {plan.count}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {formatCurrency(plan.mrr, currency)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({percent.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Recent Revenue Events
// =============================================================================

export function RecentRevenueEvents({
  events,
  isLoading = false,
  currency = 'USD',
  maxEvents = 5,
  className,
}: RecentRevenueEventsProps) {
  const eventTypeConfig: Record<
    string,
    { icon: React.ElementType; color: string; label: string }
  > = {
    new: { icon: Users, color: 'text-green-600', label: 'New Customer' },
    expansion: { icon: TrendingUp, color: 'text-blue-600', label: 'Expansion' },
    contraction: { icon: TrendingDown, color: 'text-orange-600', label: 'Contraction' },
    churn: { icon: Users, color: 'text-red-600', label: 'Churn' },
    reactivation: { icon: Users, color: 'text-purple-600', label: 'Reactivation' },
    payment: { icon: CreditCard, color: 'text-green-600', label: 'Payment' },
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayEvents = events.slice(0, maxEvents);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Revenue Events
        </CardTitle>
        <CardDescription>Latest MRR-impacting events</CardDescription>
      </CardHeader>
      <CardContent>
        {displayEvents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No recent events
          </div>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event) => {
              const config = eventTypeConfig[event.event_type] || {
                icon: Minus,
                color: 'text-muted-foreground',
                label: event.event_type,
              };
              const Icon = config.icon;
              const isPositive = ['new', 'expansion', 'reactivation', 'payment'].includes(
                event.event_type
              );

              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full bg-muted',
                        config.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        isPositive ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {isPositive ? '+' : '-'}
                      {formatCurrency(Math.abs(event.amount), currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Monthly Target Progress
// =============================================================================

export function MonthlyTarget({
  currentMrr,
  targetMrr,
  previousMrr: _previousMrr,
  isLoading = false,
  currency = 'USD',
  className,
}: MonthlyTargetProps) {
  const progress = targetMrr > 0 ? (currentMrr / targetMrr) * 100 : 0;
  const remaining = Math.max(0, targetMrr - currentMrr);
  const isAhead = currentMrr >= targetMrr;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Monthly Target
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.min(100, progress).toFixed(0)}%</span>
          </div>
          <Progress
            value={Math.min(100, progress)}
            className="h-3"
            indicatorClassName={isAhead ? 'bg-green-500' : undefined}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-semibold">{formatCurrency(currentMrr, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-lg font-semibold">{formatCurrency(targetMrr, currency)}</p>
          </div>
        </div>

        {/* Remaining or exceeded */}
        <div
          className={cn(
            'p-3 rounded-lg text-center',
            isAhead ? 'bg-green-500/10' : 'bg-muted'
          )}
        >
          {isAhead ? (
            <p className="text-sm font-medium text-green-600">
              🎉 Target exceeded by {formatCurrency(currentMrr - targetMrr, currency)}!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {formatCurrency(remaining, currency)} to go
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
