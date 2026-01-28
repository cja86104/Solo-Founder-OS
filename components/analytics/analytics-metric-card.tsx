'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TrendDirection, MetricType, AnalyticsMetrics } from '@/types/analytics';
import {
  formatNumber,
  formatPercentage,
  formatDuration,
  getTrendDirection,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Eye,
  Clock,
  MousePointerClick,
  Target,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsMetricCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  type?: MetricType;
  icon?: React.ElementType;
  description?: string;
  isLoading?: boolean;
  compact?: boolean;
  invertTrend?: boolean; // For metrics where down is good (bounce rate)
  currency?: string;
  className?: string;
}

export interface AnalyticsStatsGridProps {
  metrics: AnalyticsMetrics | null;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

export interface TrafficStatsProps {
  metrics: AnalyticsMetrics | null;
  isLoading?: boolean;
  className?: string;
}

export interface EngagementStatsProps {
  metrics: AnalyticsMetrics | null;
  isLoading?: boolean;
  className?: string;
}

export interface ConversionStatsProps {
  metrics: AnalyticsMetrics | null;
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

function TrendIndicator({
  change,
  invertTrend = false,
  showLabel = true,
  size = 'default',
}: {
  change: number;
  invertTrend?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'default';
}) {
  const direction = getTrendDirection(change);
  const isPositive = invertTrend ? direction === 'down' : direction === 'up';
  const isNegative = invertTrend ? direction === 'up' : direction === 'down';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        isPositive && 'text-green-600',
        isNegative && 'text-red-600',
        direction === 'neutral' && 'text-muted-foreground'
      )}
    >
      {direction === 'up' && <ArrowUpRight className={iconSize} />}
      {direction === 'down' && <ArrowDownRight className={iconSize} />}
      {direction === 'neutral' && <Minus className={iconSize} />}
      {showLabel && (
        <span className={cn('font-medium', textSize)}>
          {Math.abs(change).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Analytics Metric Card
// =============================================================================

export function AnalyticsMetricCard({
  title,
  value,
  change,
  changeLabel,
  type = 'count',
  icon: Icon,
  description,
  isLoading = false,
  compact = false,
  invertTrend = false,
  currency = 'USD',
  className,
}: AnalyticsMetricCardProps) {
  const formattedValue = useMemo(() => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return formatPercentage(value);
      case 'duration':
        return formatDuration(value);
      case 'rate':
        return formatPercentage(value);
      default:
        return formatNumber(value, value >= 10000);
    }
  }, [value, type, currency]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className={cn('pt-6', compact && 'p-4')}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn('p-4 rounded-lg bg-muted/30', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          {change !== undefined && (
            <TrendIndicator change={change} invertTrend={invertTrend} size="sm" />
          )}
        </div>
        <p className="text-2xl font-bold mt-1">{formattedValue}</p>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{formattedValue}</p>
            {change !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator change={change} invertTrend={invertTrend} />
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Analytics Stats Grid
// =============================================================================

export function AnalyticsStatsGrid({
  metrics,
  isLoading = false,
  currency = 'USD',
  className,
}: AnalyticsStatsGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <AnalyticsMetricCard
        title="Unique Visitors"
        value={metrics?.unique_visitors || 0}
        change={metrics?.visitors_change}
        changeLabel="vs previous period"
        icon={Users}
        description="Number of unique visitors"
      />
      <AnalyticsMetricCard
        title="Page Views"
        value={metrics?.total_page_views || 0}
        change={metrics?.page_views_change}
        changeLabel="vs previous period"
        icon={Eye}
        description="Total page views"
      />
      <AnalyticsMetricCard
        title="Bounce Rate"
        value={metrics?.bounce_rate || 0}
        change={metrics?.bounce_rate_change}
        changeLabel="vs previous period"
        type="percentage"
        icon={Activity}
        invertTrend={true}
        description="Percentage of single-page sessions"
      />
      <AnalyticsMetricCard
        title="Avg. Duration"
        value={metrics?.avg_session_duration || 0}
        type="duration"
        icon={Clock}
        description="Average session duration"
      />
    </div>
  );
}

// =============================================================================
// Traffic Stats
// =============================================================================

export function TrafficStats({
  metrics,
  isLoading = false,
  className,
}: TrafficStatsProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Traffic Overview
        </CardTitle>
        <CardDescription>Visitor breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnalyticsMetricCard
            title="Total Visitors"
            value={metrics?.total_visitors || 0}
            icon={Users}
            compact
          />
          <AnalyticsMetricCard
            title="Unique Visitors"
            value={metrics?.unique_visitors || 0}
            change={metrics?.visitors_change}
            icon={Users}
            compact
          />
          <AnalyticsMetricCard
            title="New Visitors"
            value={metrics?.new_visitors || 0}
            icon={Users}
            compact
          />
          <AnalyticsMetricCard
            title="Returning"
            value={metrics?.returning_visitors || 0}
            icon={Users}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Engagement Stats
// =============================================================================

export function EngagementStats({
  metrics,
  isLoading = false,
  className,
}: EngagementStatsProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Engagement
        </CardTitle>
        <CardDescription>How users interact with your site</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnalyticsMetricCard
            title="Sessions"
            value={metrics?.total_sessions || 0}
            change={metrics?.sessions_change}
            icon={Activity}
            compact
          />
          <AnalyticsMetricCard
            title="Pages/Session"
            value={metrics?.avg_pages_per_session || 0}
            type="count"
            icon={Eye}
            compact
          />
          <AnalyticsMetricCard
            title="Avg. Duration"
            value={metrics?.avg_session_duration || 0}
            type="duration"
            icon={Clock}
            compact
          />
          <AnalyticsMetricCard
            title="Bounce Rate"
            value={metrics?.bounce_rate || 0}
            change={metrics?.bounce_rate_change}
            type="percentage"
            invertTrend
            icon={Activity}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Conversion Stats
// =============================================================================

export function ConversionStats({
  metrics,
  isLoading = false,
  currency = 'USD',
  className,
}: ConversionStatsProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Conversions
        </CardTitle>
        <CardDescription>Goal completions and value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <AnalyticsMetricCard
            title="Conversions"
            value={metrics?.total_conversions || 0}
            icon={Target}
            compact
          />
          <AnalyticsMetricCard
            title="Conv. Rate"
            value={metrics?.conversion_rate || 0}
            change={metrics?.conversion_rate_change}
            type="percentage"
            icon={MousePointerClick}
            compact
          />
          <AnalyticsMetricCard
            title="Value"
            value={metrics?.total_conversion_value || 0}
            type="currency"
            currency={currency}
            icon={DollarSign}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
