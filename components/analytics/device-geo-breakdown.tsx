'use client';

import { useMemo } from 'react';
import {
  formatNumber,
  formatPercentage,
  formatDuration,
  type DeviceBreakdown,
  type GeoBreakdown,
  type BrowserBreakdown,
} from '@/types/analytics';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Chrome,
  Activity,
  Clock,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface DeviceBreakdownChartProps {
  data: DeviceBreakdown[];
  isLoading?: boolean;
  className?: string;
}

export interface DeviceBreakdownListProps {
  data: DeviceBreakdown[];
  isLoading?: boolean;
  className?: string;
}

export interface GeoBreakdownChartProps {
  data: GeoBreakdown[];
  isLoading?: boolean;
  maxItems?: number;
  className?: string;
}

export interface BrowserBreakdownChartProps {
  data: BrowserBreakdown[];
  isLoading?: boolean;
  maxItems?: number;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEVICE_COLORS = {
  desktop: 'hsl(var(--chart-1))',
  mobile: 'hsl(var(--chart-2))',
  tablet: 'hsl(var(--chart-3))',
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const GEO_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 70%, 60%)',
  'hsl(280, 70%, 60%)',
  'hsl(30, 70%, 60%)',
  'hsl(160, 70%, 60%)',
  'hsl(340, 70%, 60%)',
];

// =============================================================================
// Custom Tooltip for Pie Charts
// =============================================================================

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      percentage?: number;
      visitors?: number;
      sessions?: number;
    };
  }>;
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0];

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium capitalize">{data.name}</p>
      <div className="mt-1 space-y-0.5">
        <p className="text-xs text-muted-foreground">
          {formatNumber(data.payload.visitors || data.value)} visitors
        </p>
        {data.payload.percentage !== undefined && (
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.payload.percentage)}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Device Breakdown Chart (Pie)
// =============================================================================

export function DeviceBreakdownChart({
  data,
  isLoading = false,
  className,
}: DeviceBreakdownChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      name: d.device_type,
      value: d.visitors,
      percentage: d.percentage,
      visitors: d.visitors,
      sessions: d.sessions,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-full mx-auto" style={{ maxWidth: 200 }} />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No device data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Devices
        </CardTitle>
        <CardDescription>Visitor breakdown by device type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={DEVICE_COLORS[entry.name as keyof typeof DEVICE_COLORS]}
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<PieTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-sm capitalize">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Device Breakdown List
// =============================================================================

export function DeviceBreakdownList({
  data,
  isLoading = false,
  className,
}: DeviceBreakdownListProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
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
          <Monitor className="h-5 w-5" />
          Device Breakdown
        </CardTitle>
        <CardDescription>Performance by device type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((device) => {
            const Icon = DEVICE_ICONS[device.device_type];
            const color = DEVICE_COLORS[device.device_type];

            return (
              <div key={device.device_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{device.device_type}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatNumber(device.visitors)} visitors</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {formatPercentage(device.bounce_rate)} bounce
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(device.avg_duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPercentage(device.percentage)}</p>
                  </div>
                </div>
                <Progress
                  value={device.percentage}
                  className="h-2"
                  style={{
                    // @ts-expect-error Custom CSS property
                    '--progress-background': color,
                  }}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Geo Breakdown Chart
// =============================================================================

export function GeoBreakdownChart({
  data,
  isLoading = false,
  maxItems = 10,
  className,
}: GeoBreakdownChartProps) {
  const displayData = useMemo(() => {
    return data.slice(0, maxItems);
  }, [data, maxItems]);

  const maxVisitors = useMemo(() => {
    return Math.max(...data.map((d) => d.visitors), 1);
  }, [data]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-6 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No geographic data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Top Countries
        </CardTitle>
        <CardDescription>Visitors by country</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayData.map((country, index) => (
            <div key={country.country} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg" role="img" aria-label={country.country}>
                    {getCountryFlag(country.country_code)}
                  </span>
                  <span className="text-sm font-medium">{country.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {formatNumber(country.visitors)}
                  </span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {formatPercentage(country.percentage, 1)}
                  </span>
                </div>
              </div>
              <Progress
                value={(country.visitors / maxVisitors) * 100}
                className="h-1.5"
                style={{
                  // @ts-expect-error Custom CSS property
                  '--progress-background': GEO_COLORS[index % GEO_COLORS.length],
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Browser Breakdown Chart
// =============================================================================

export function BrowserBreakdownChart({
  data,
  isLoading = false,
  maxItems = 6,
  className,
}: BrowserBreakdownChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, maxItems).map((d) => ({
      name: d.browser,
      value: d.visitors,
      percentage: d.percentage,
      visitors: d.visitors,
    }));
  }, [data, maxItems]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5" />
            Browsers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Chrome className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No browser data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Chrome className="h-5 w-5" />
          Browsers
        </CardTitle>
        <CardDescription>Visitor breakdown by browser</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => 
                  `${name} (${formatPercentage(percentage, 0)})`
                }
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={GEO_COLORS[index % GEO_COLORS.length]}
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function getCountryFlag(countryCode: string): string {
  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
