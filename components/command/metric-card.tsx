'use client';

import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/types/command';
import {
  Card,
  CardContent,
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
  Info,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type MetricTrend = 'up' | 'down' | 'neutral';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: React.ElementType;
  trend?: MetricTrend;
  trendValue?: number;
  trendLabel?: string;
  previousValue?: string | number;
  format?: 'currency' | 'percentage' | 'number' | 'none';
  currency?: string;
  decimals?: number;
  invertTrendColors?: boolean;
  isLoading?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatValue(
  value: string | number,
  format: 'currency' | 'percentage' | 'number' | 'none',
  currency: string,
  decimals: number
): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return formatCurrency(value, currency);
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    case 'number':
      return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    case 'none':
    default:
      return String(value);
  }
}

function getTrendIcon(trend: MetricTrend) {
  switch (trend) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    default:
      return Minus;
  }
}

function getTrendColor(trend: MetricTrend, invert: boolean): string {
  if (trend === 'neutral') return 'text-muted-foreground';

  const isPositive = invert ? trend === 'down' : trend === 'up';
  return isPositive ? 'text-green-600' : 'text-red-600';
}

function getTrendBgColor(trend: MetricTrend, invert: boolean): string {
  if (trend === 'neutral') return 'bg-muted/50';

  const isPositive = invert ? trend === 'down' : trend === 'up';
  return isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
}

// =============================================================================
// Main Component
// =============================================================================

export function MetricCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  trend = 'neutral',
  trendValue,
  trendLabel,
  previousValue,
  format = 'none',
  currency = 'USD',
  decimals = 0,
  invertTrendColors = false,
  isLoading = false,
  className,
  size = 'default',
}: MetricCardProps) {
  const TrendIcon = getTrendIcon(trend);
  const trendColor = getTrendColor(trend, invertTrendColors);
  const trendBgColor = getTrendBgColor(trend, invertTrendColors);

  const formattedValue = formatValue(value, format, currency, decimals);
  const formattedPreviousValue = previousValue
    ? formatValue(previousValue, format, currency, decimals)
    : null;

  // Size variants
  const sizeStyles = {
    sm: {
      value: 'text-xl font-bold',
      title: 'text-xs',
      icon: 'h-4 w-4',
      iconContainer: 'w-8 h-8',
      padding: 'p-3',
    },
    default: {
      value: 'text-2xl font-bold',
      title: 'text-sm',
      icon: 'h-5 w-5',
      iconContainer: 'w-10 h-10',
      padding: 'p-4',
    },
    lg: {
      value: 'text-3xl font-bold',
      title: 'text-base',
      icon: 'h-6 w-6',
      iconContainer: 'w-12 h-12',
      padding: 'p-6',
    },
  };

  const styles = sizeStyles[size];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className={cn(styles.padding, 'space-y-3')}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className={cn('rounded-lg', styles.iconContainer)} />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className={cn(styles.padding, 'space-y-2')}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium text-muted-foreground', styles.title)}>
              {title}
            </span>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'flex items-center justify-center rounded-lg bg-primary/10',
                styles.iconContainer
              )}
            >
              <Icon className={cn('text-primary', styles.icon)} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className={cn(styles.value, 'tracking-tight')}>{formattedValue}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Trend */}
        {(trend !== 'neutral' || trendValue !== undefined) && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                trendBgColor,
                trendColor
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trendValue !== undefined && (
                <span>{formatPercentage(trendValue)}</span>
              )}
            </div>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
            {formattedPreviousValue && !trendLabel && (
              <span className="text-xs text-muted-foreground">
                vs {formattedPreviousValue}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Compact Metric Display (inline variant)
// =============================================================================

export interface CompactMetricProps {
  label: string;
  value: string | number;
  trend?: MetricTrend;
  trendValue?: number;
  format?: 'currency' | 'percentage' | 'number' | 'none';
  currency?: string;
  invertTrendColors?: boolean;
  className?: string;
}

export function CompactMetric({
  label,
  value,
  trend = 'neutral',
  trendValue,
  format = 'none',
  currency = 'USD',
  invertTrendColors = false,
  className,
}: CompactMetricProps) {
  const formattedValue = formatValue(value, format, currency, 0);
  const trendColor = getTrendColor(trend, invertTrendColors);

  return (
    <div className={cn('flex items-center justify-between py-2', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{formattedValue}</span>
        {trendValue !== undefined && trend !== 'neutral' && (
          <span className={cn('text-xs font-medium', trendColor)}>
            {trend === 'up' ? (
              <ArrowUpRight className="inline h-3 w-3" />
            ) : (
              <ArrowDownRight className="inline h-3 w-3" />
            )}
            {Math.abs(trendValue).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Metric Grid (layout helper)
// =============================================================================

export interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function MetricGrid({ children, columns = 4, className }: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
