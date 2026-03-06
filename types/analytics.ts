// =============================================================================
// Analytics Types
// =============================================================================

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------

export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d' | '12m' | 'ytd' | 'all';
export type MetricType = 'count' | 'currency' | 'percentage' | 'duration' | 'rate';
export type TrendDirection = 'up' | 'down' | 'neutral';
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'funnel';

// -----------------------------------------------------------------------------
// Page Views & Sessions
// -----------------------------------------------------------------------------

export interface PageView {
  id: string;
  workspace_id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  duration_seconds: number;
  scroll_depth: number;
  created_at: string;
}

export interface Session {
  id: string;
  workspace_id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string | null;
  page_views: number;
  duration_seconds: number;
  entry_page: string;
  exit_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string | null;
  os: string | null;
  country: string | null;
  is_bounce: boolean;
  converted: boolean;
  conversion_value: number;
}

export interface Visitor {
  id: string;
  workspace_id: string;
  first_seen: string;
  last_seen: string;
  total_sessions: number;
  total_page_views: number;
  total_duration_seconds: number;
  country: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet';
  is_returning: boolean;
  lifetime_value: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Events & Conversions
// -----------------------------------------------------------------------------

export interface AnalyticsEvent {
  id: string;
  workspace_id: string;
  session_id: string | null;
  visitor_id: string | null;
  event_name: string;
  event_category: string;
  event_value: number | null;
  properties: Record<string, unknown>;
  page_path: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  goal_type: 'page_view' | 'event' | 'duration' | 'pages_per_session';
  target_value: string; // page path, event name, or numeric threshold
  target_operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  conversion_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversion {
  id: string;
  workspace_id: string;
  goal_id: string;
  session_id: string;
  visitor_id: string;
  conversion_value: number;
  converted_at: string;
  attribution_source: string | null;
  attribution_medium: string | null;
  attribution_campaign: string | null;
}

// -----------------------------------------------------------------------------
// Funnel Analysis
// -----------------------------------------------------------------------------

export interface Funnel {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  steps: FunnelStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FunnelStep {
  id: string;
  order: number;
  name: string;
  step_type: 'page_view' | 'event';
  target_value: string;
  is_required: boolean;
}

export interface FunnelAnalysis {
  funnel: Funnel;
  period: AnalyticsPeriod;
  total_entries: number;
  total_completions: number;
  conversion_rate: number;
  steps: FunnelStepAnalysis[];
}

export interface FunnelStepAnalysis {
  step: FunnelStep;
  visitors: number;
  conversion_rate: number;
  drop_off_rate: number;
  avg_time_to_next: number | null;
}

// -----------------------------------------------------------------------------
// Metrics & Aggregations
// -----------------------------------------------------------------------------

export interface AnalyticsMetrics {
  period: AnalyticsPeriod;
  start_date: string;
  end_date: string;
  
  // Traffic
  total_visitors: number;
  unique_visitors: number;
  new_visitors: number;
  returning_visitors: number;
  total_sessions: number;
  total_page_views: number;
  
  // Engagement
  avg_session_duration: number;
  avg_pages_per_session: number;
  bounce_rate: number;
  avg_scroll_depth: number;
  
  // Conversions
  total_conversions: number;
  conversion_rate: number;
  total_conversion_value: number;
  
  // Comparisons
  visitors_change: number;
  sessions_change: number;
  page_views_change: number;
  bounce_rate_change: number;
  conversion_rate_change: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  visitors: number;
  sessions: number;
  page_views: number;
  conversions: number;
  bounce_rate: number;
  avg_duration: number;
}

export interface TopPage {
  path: string;
  title: string | null;
  views: number;
  unique_views: number;
  avg_duration: number;
  bounce_rate: number;
  exit_rate: number;
}

export interface TopReferrer {
  source: string;
  medium: string | null;
  visitors: number;
  sessions: number;
  conversions: number;
  conversion_rate: number;
}

export interface TopCampaign {
  name: string;
  source: string;
  medium: string;
  visitors: number;
  sessions: number;
  conversions: number;
  conversion_value: number;
  conversion_rate: number;
}

export interface DeviceBreakdown {
  device_type: 'desktop' | 'mobile' | 'tablet';
  visitors: number;
  sessions: number;
  percentage: number;
  bounce_rate: number;
  avg_duration: number;
}

export interface GeoBreakdown {
  country: string;
  country_code: string;
  visitors: number;
  sessions: number;
  percentage: number;
  conversions: number;
}

export interface BrowserBreakdown {
  browser: string;
  visitors: number;
  percentage: number;
}

// -----------------------------------------------------------------------------
// Reports
// -----------------------------------------------------------------------------

export interface AnalyticsReport {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  report_type: 'overview' | 'traffic' | 'conversions' | 'funnel' | 'custom';
  config: ReportConfig;
  schedule: ReportSchedule | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportConfig {
  metrics: string[];
  dimensions: string[];
  filters: ReportFilter[];
  chart_type: ChartType;
  period: AnalyticsPeriod;
  compare_period: boolean;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  recipients: string[];
  format: 'pdf' | 'csv' | 'email';
}

// -----------------------------------------------------------------------------
// Dashboard Widgets
// -----------------------------------------------------------------------------

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'map';
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface WidgetConfig {
  metric?: string;
  chart_type?: ChartType;
  data_source?: string;
  filters?: ReportFilter[];
  limit?: number;
}

// -----------------------------------------------------------------------------
// Real-time Analytics
// -----------------------------------------------------------------------------

export interface RealTimeData {
  active_visitors: number;
  active_pages: ActivePage[];
  recent_events: RecentEvent[];
  traffic_sources: TrafficSource[];
}

export interface ActivePage {
  path: string;
  title: string | null;
  visitors: number;
}

export interface RecentEvent {
  event_name: string;
  page_path: string;
  timestamp: string;
  country: string | null;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getTrendDirection(change: number): TrendDirection {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

export function getPeriodLabel(period: AnalyticsPeriod): string {
  const labels: Record<AnalyticsPeriod, string> = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    '12m': 'Last 12 Months',
    'ytd': 'Year to Date',
    'all': 'All Time',
  };
  return labels[period];
}

export function getPeriodDays(period: AnalyticsPeriod): number {
  const days: Record<AnalyticsPeriod, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '12m': 365,
    'ytd': Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000),
    'all': 9999,
  };
  return days[period];
}

export function getComparisonPeriodLabel(period: AnalyticsPeriod): string {
  const labels: Record<AnalyticsPeriod, string> = {
    '24h': 'vs previous 24 hours',
    '7d': 'vs previous 7 days',
    '30d': 'vs previous 30 days',
    '90d': 'vs previous 90 days',
    '12m': 'vs previous 12 months',
    'ytd': 'vs same period last year',
    'all': '',
  };
  return labels[period];
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface AnalyticsOverviewResponse {
  metrics: AnalyticsMetrics;
  time_series: TimeSeriesDataPoint[];
  top_pages: TopPage[];
  top_referrers: TopReferrer[];
  device_breakdown: DeviceBreakdown[];
}

export interface TrafficAnalyticsResponse {
  metrics: Pick<AnalyticsMetrics, 
    | 'total_visitors' 
    | 'unique_visitors' 
    | 'new_visitors' 
    | 'returning_visitors'
    | 'total_sessions'
    | 'visitors_change'
    | 'sessions_change'
  >;
  time_series: TimeSeriesDataPoint[];
  top_referrers: TopReferrer[];
  top_campaigns: TopCampaign[];
  geo_breakdown: GeoBreakdown[];
  device_breakdown: DeviceBreakdown[];
  browser_breakdown: BrowserBreakdown[];
}

export interface ConversionAnalyticsResponse {
  metrics: Pick<AnalyticsMetrics,
    | 'total_conversions'
    | 'conversion_rate'
    | 'total_conversion_value'
    | 'conversion_rate_change'
  >;
  goals: GoalPerformance[];
  top_converting_pages: TopPage[];
  top_converting_sources: TopReferrer[];
  conversion_trend: TimeSeriesDataPoint[];
}

export interface GoalPerformance {
  goal: Goal;
  completions: number;
  conversion_rate: number;
  total_value: number;
  change: number;
}
