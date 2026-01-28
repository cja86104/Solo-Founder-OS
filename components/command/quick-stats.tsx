'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { MRRMetrics, MRRSummary, Customer } from '@/types/command';
import { formatCurrency, formatPercentage, calculateLTV } from '@/types/command';
import { MetricCard, MetricGrid, type MetricTrend } from './metric-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  UserMinus,
  UserPlus,
  AlertTriangle,
  Target,
  Repeat,
  Clock,
  Wallet,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface QuickStatsProps {
  metrics: MRRMetrics | null;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export interface MRRSummaryStatsProps {
  summary: MRRSummary | null;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export interface CustomerStatsProps {
  customers: Customer[];
  isLoading?: boolean;
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function determineTrend(value: number): MetricTrend {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}

// =============================================================================
// QuickStats Component (Main MRR Metrics)
// =============================================================================

export function QuickStats({
  metrics,
  isLoading = false,
  currency = 'USD',
  className,
}: QuickStatsProps) {
  if (isLoading) {
    return (
      <MetricGrid columns={4} className={className}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-28 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </MetricGrid>
    );
  }

  if (!metrics) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground border rounded-lg', className)}>
        No metrics data available. Sync with Stripe to get started.
      </div>
    );
  }

  const mrrTrend = determineTrend(metrics.mrr_change);
  const growthTrend = determineTrend(metrics.growth_rate);
  const churnTrend = determineTrend(-metrics.churn_rate); // Invert for churn (lower is better)

  return (
    <MetricGrid columns={4} className={className}>
      <MetricCard
        title="Monthly Recurring Revenue"
        value={metrics.current_mrr}
        format="currency"
        currency={currency}
        icon={DollarSign}
        trend={mrrTrend}
        trendValue={metrics.mrr_change_percent}
        trendLabel="vs last month"
        previousValue={metrics.previous_mrr}
        description="Total monthly recurring revenue from active subscriptions"
      />

      <MetricCard
        title="Annual Run Rate"
        value={metrics.current_arr}
        format="currency"
        currency={currency}
        icon={TrendingUp}
        subtitle="Projected yearly revenue"
        description="MRR × 12 = Annual recurring revenue projection"
      />

      <MetricCard
        title="Active Customers"
        value={metrics.total_customers}
        format="number"
        icon={Users}
        trend={determineTrend(metrics.new_customers - metrics.churned_customers)}
        trendValue={
          metrics.total_customers > 0
            ? ((metrics.new_customers - metrics.churned_customers) / metrics.total_customers) * 100
            : 0
        }
        trendLabel="net change"
        description="Total number of active paying customers"
      />

      <MetricCard
        title="Churn Rate"
        value={metrics.churn_rate}
        format="percentage"
        decimals={1}
        icon={UserMinus}
        trend={churnTrend}
        invertTrendColors={true}
        subtitle={`${metrics.churned_customers} churned this month`}
        description="Percentage of customers who canceled this period"
      />
    </MetricGrid>
  );
}

// =============================================================================
// Extended Stats Row
// =============================================================================

export interface ExtendedStatsProps {
  metrics: MRRMetrics | null;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export function ExtendedStats({
  metrics,
  isLoading = false,
  currency = 'USD',
  className,
}: ExtendedStatsProps) {
  if (isLoading) {
    return (
      <MetricGrid columns={5} className={className}>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </MetricGrid>
    );
  }

  if (!metrics) return null;

  return (
    <MetricGrid columns={5} className={className}>
      <MetricCard
        title="New MRR"
        value={metrics.new_mrr}
        format="currency"
        currency={currency}
        icon={UserPlus}
        size="sm"
        trend="up"
        description="Revenue from new customers"
      />

      <MetricCard
        title="Expansion MRR"
        value={metrics.expansion_mrr}
        format="currency"
        currency={currency}
        icon={TrendingUp}
        size="sm"
        trend={metrics.expansion_mrr > 0 ? 'up' : 'neutral'}
        description="Revenue growth from upgrades"
      />

      <MetricCard
        title="Churned MRR"
        value={metrics.churned_mrr}
        format="currency"
        currency={currency}
        icon={UserMinus}
        size="sm"
        trend={metrics.churned_mrr > 0 ? 'down' : 'neutral'}
        invertTrendColors={true}
        description="Revenue lost from cancellations"
      />

      <MetricCard
        title="ARPU"
        value={metrics.arpu}
        format="currency"
        currency={currency}
        icon={Wallet}
        size="sm"
        description="Average revenue per user"
      />

      <MetricCard
        title="Est. LTV"
        value={metrics.ltv}
        format="currency"
        currency={currency}
        icon={Target}
        size="sm"
        description="Estimated customer lifetime value"
      />
    </MetricGrid>
  );
}

// =============================================================================
// MRR Summary Stats (Simpler variant)
// =============================================================================

export function MRRSummaryStats({
  summary,
  isLoading = false,
  currency = 'USD',
  className,
}: MRRSummaryStatsProps) {
  if (isLoading) {
    return (
      <MetricGrid columns={4} className={className}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </MetricGrid>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <MetricGrid columns={4} className={className}>
      <MetricCard
        title="Total MRR"
        value={summary.total_mrr}
        format="currency"
        currency={currency}
        icon={DollarSign}
      />
      <MetricCard
        title="Total ARR"
        value={summary.total_arr}
        format="currency"
        currency={currency}
        icon={Repeat}
      />
      <MetricCard
        title="Active Customers"
        value={summary.active_customers}
        format="number"
        icon={Users}
      />
      <MetricCard
        title="Avg MRR/Customer"
        value={summary.avg_mrr_per_customer}
        format="currency"
        currency={currency}
        icon={Wallet}
      />
    </MetricGrid>
  );
}

// =============================================================================
// Customer Stats Card
// =============================================================================

export function CustomerStats({
  customers,
  isLoading = false,
  className,
}: CustomerStatsProps) {
  const stats = useMemo(() => {
    if (!customers.length) return null;

    const active = customers.filter((c) => c.status === 'active').length;
    const newCustomers = customers.filter((c) => c.status === 'new').length;
    const atRisk = customers.filter((c) => c.status === 'at_risk').length;
    const churned = customers.filter((c) => c.status === 'churned').length;
    const total = customers.length;

    return {
      active,
      newCustomers,
      atRisk,
      churned,
      total,
      activePercent: (active / total) * 100,
      atRiskPercent: (atRisk / total) * 100,
    };
  }, [customers]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Overview
        </CardTitle>
        <CardDescription>
          {stats.total} total customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="text-sm font-semibold text-green-600">{stats.active}</span>
            </div>
            <Progress value={stats.activePercent} className="h-2" indicatorClassName="bg-green-500" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New</span>
              <span className="text-sm font-semibold text-blue-600">{stats.newCustomers}</span>
            </div>
            <Progress
              value={(stats.newCustomers / stats.total) * 100}
              className="h-2"
              indicatorClassName="bg-blue-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">At Risk</span>
              <span className="text-sm font-semibold text-red-600">{stats.atRisk}</span>
            </div>
            <Progress value={stats.atRiskPercent} className="h-2" indicatorClassName="bg-red-500" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Churned</span>
              <span className="text-sm font-semibold text-gray-600">{stats.churned}</span>
            </div>
            <Progress
              value={(stats.churned / stats.total) * 100}
              className="h-2"
              indicatorClassName="bg-gray-500"
            />
          </div>
        </div>

        {/* At-risk alert */}
        {stats.atRisk > 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                {stats.atRisk} customer{stats.atRisk > 1 ? 's' : ''} at risk of churning
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Growth Indicators
// =============================================================================

export interface GrowthIndicatorsProps {
  metrics: MRRMetrics | null;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export function GrowthIndicators({
  metrics,
  isLoading = false,
  currency = 'USD',
  className,
}: GrowthIndicatorsProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const netNewMrr = metrics.new_mrr + metrics.expansion_mrr - metrics.churned_mrr - metrics.contraction_mrr;
  const isGrowing = netNewMrr > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {isGrowing ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          Net MRR Movement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Net change */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              <span className={isGrowing ? 'text-green-600' : 'text-red-600'}>
                {isGrowing ? '+' : ''}
                {formatCurrency(netNewMrr, currency)}
              </span>
            </span>
            <span className="text-sm text-muted-foreground">this period</span>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600">+ New</span>
              <span>{formatCurrency(metrics.new_mrr, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">+ Expansion</span>
              <span>{formatCurrency(metrics.expansion_mrr, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-600">- Contraction</span>
              <span>{formatCurrency(metrics.contraction_mrr, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">- Churn</span>
              <span>{formatCurrency(metrics.churned_mrr, currency)}</span>
            </div>
          </div>

          {/* Growth rate */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Growth Rate</span>
              <span className={cn('font-semibold', metrics.growth_rate >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatPercentage(metrics.growth_rate)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
