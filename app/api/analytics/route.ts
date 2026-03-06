import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getPeriodDays,
  type AnalyticsPeriod,
  type AnalyticsMetrics,
  type TimeSeriesDataPoint,
  type TopPage,
  type TopReferrer,
  type DeviceBreakdown,
  type GeoBreakdown,
  type AnalyticsOverviewResponse,
  type TrafficAnalyticsResponse,
} from '@/types/analytics';
import type { Database } from '@/types/database';

// Type aliases for database rows
type AnalyticsSessionRow = Database['public']['Tables']['analytics_sessions']['Row'];
type AnalyticsPageViewRow = Database['public']['Tables']['analytics_page_views']['Row'];

// =============================================================================
// GET - Fetch Analytics Data
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const period = (searchParams.get('period') || '30d') as AnalyticsPeriod;
    const include = searchParams.get('include')?.split(',') || ['overview'];

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Calculate date range
    const days = getPeriodDays(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Previous period for comparison
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const response: Partial<AnalyticsOverviewResponse & TrafficAnalyticsResponse> = {};

    // Fetch metrics
    if (include.includes('overview') || include.includes('metrics')) {
      const metrics = await fetchMetrics(
        supabase,
        workspaceId,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        period
      );
      response.metrics = metrics;
    }

    // Fetch time series
    if (include.includes('overview') || include.includes('timeseries')) {
      const timeSeries = await fetchTimeSeries(
        supabase,
        workspaceId,
        startDate,
        endDate,
        period
      );
      response.time_series = timeSeries;
    }

    // Fetch top pages
    if (include.includes('overview') || include.includes('pages')) {
      const topPages = await fetchTopPages(
        supabase,
        workspaceId,
        startDate,
        endDate
      );
      response.top_pages = topPages;
    }

    // Fetch top referrers
    if (include.includes('overview') || include.includes('referrers')) {
      const topReferrers = await fetchTopReferrers(
        supabase,
        workspaceId,
        startDate,
        endDate
      );
      response.top_referrers = topReferrers;
    }

    // Fetch device breakdown
    if (include.includes('overview') || include.includes('devices')) {
      const deviceBreakdown = await fetchDeviceBreakdown(
        supabase,
        workspaceId,
        startDate,
        endDate
      );
      response.device_breakdown = deviceBreakdown;
    }

    // Fetch geo breakdown
    if (include.includes('geo')) {
      const geoBreakdown = await fetchGeoBreakdown(
        supabase,
        workspaceId,
        startDate,
        endDate
      );
      response.geo_breakdown = geoBreakdown;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function fetchMetrics(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date,
  period: AnalyticsPeriod
): Promise<AnalyticsMetrics> {
  // Current period data
  const { data: currentData } = await supabase
    .from('analytics_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  // Previous period data for comparison
  const { data: prevData } = await supabase
    .from('analytics_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('started_at', prevStartDate.toISOString())
    .lte('started_at', prevEndDate.toISOString());

  const sessions: AnalyticsSessionRow[] = currentData || [];
  const prevSessions: AnalyticsSessionRow[] = prevData || [];

  // Calculate current metrics
  const uniqueVisitors = new Set(sessions.map((s) => s.visitor_id)).size;
  const prevUniqueVisitors = new Set(prevSessions.map((s) => s.visitor_id)).size;

  const returningVisitorIds = new Set(
    sessions.filter((s) => {
      const firstSession = sessions.find(
        (fs) => fs.visitor_id === s.visitor_id && fs.started_at < s.started_at
      );
      return !!firstSession;
    }).map((s) => s.visitor_id)
  );

  const totalPageViews = sessions.reduce((sum, s) => sum + (s.page_views || 0), 0);
  const prevTotalPageViews = prevSessions.reduce((sum, s) => sum + (s.page_views || 0), 0);

  const avgSessionDuration =
    sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length
      : 0;

  const avgPagesPerSession =
    sessions.length > 0
      ? totalPageViews / sessions.length
      : 0;

  const bounces = sessions.filter((s) => s.is_bounce).length;
  const bounceRate = sessions.length > 0 ? (bounces / sessions.length) * 100 : 0;
  const prevBounces = prevSessions.filter((s) => s.is_bounce).length;
  const prevBounceRate = prevSessions.length > 0 ? (prevBounces / prevSessions.length) * 100 : 0;

  const conversions = sessions.filter((s) => s.converted).length;
  const prevConversions = prevSessions.filter((s) => s.converted).length;
  const conversionRate = sessions.length > 0 ? (conversions / sessions.length) * 100 : 0;
  const prevConversionRate = prevSessions.length > 0 ? (prevConversions / prevSessions.length) * 100 : 0;

  const totalConversionValue = sessions
    .filter((s) => s.converted)
    .reduce((sum, s) => sum + (s.conversion_value || 0), 0);

  return {
    period,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    total_visitors: sessions.length,
    unique_visitors: uniqueVisitors,
    new_visitors: uniqueVisitors - returningVisitorIds.size,
    returning_visitors: returningVisitorIds.size,
    total_sessions: sessions.length,
    total_page_views: totalPageViews,
    avg_session_duration: avgSessionDuration,
    avg_pages_per_session: avgPagesPerSession,
    bounce_rate: bounceRate,
    avg_scroll_depth: 0, // Would require page_views table
    total_conversions: conversions,
    conversion_rate: conversionRate,
    total_conversion_value: totalConversionValue,
    visitors_change: calculateChange(uniqueVisitors, prevUniqueVisitors),
    sessions_change: calculateChange(sessions.length, prevSessions.length),
    page_views_change: calculateChange(totalPageViews, prevTotalPageViews),
    bounce_rate_change: bounceRate - prevBounceRate,
    conversion_rate_change: conversionRate - prevConversionRate,
  };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

async function fetchTimeSeries(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  _period: AnalyticsPeriod
): Promise<TimeSeriesDataPoint[]> {
  const { data } = await supabase
    .from('analytics_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString())
    .order('started_at', { ascending: true });

  const sessions: AnalyticsSessionRow[] = data || [];

  // Group by date
  const grouped = new Map<string, AnalyticsSessionRow[]>();

  sessions.forEach((session) => {
    const date = new Date(session.started_at).toISOString().split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(session);
  });

  // Generate all dates in range
  const result: TimeSeriesDataPoint[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const daySessions = grouped.get(dateStr) || [];

    const visitors = new Set(daySessions.map((s) => s.visitor_id)).size;
    const pageViews = daySessions.reduce((sum, s) => sum + (s.page_views || 0), 0);
    const conversions = daySessions.filter((s) => s.converted).length;
    const bounces = daySessions.filter((s) => s.is_bounce).length;
    const bounceRate = daySessions.length > 0 ? (bounces / daySessions.length) * 100 : 0;
    const avgDuration =
      daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / daySessions.length
        : 0;

    result.push({
      date: dateStr,
      visitors,
      sessions: daySessions.length,
      page_views: pageViews,
      conversions,
      bounce_rate: bounceRate,
      avg_duration: avgDuration,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

async function fetchTopPages(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  limit = 10
): Promise<TopPage[]> {
  const { data } = await supabase
    .from('analytics_page_views')
    .select('page_path, page_title, duration_seconds, session_id')
    .eq('workspace_id', workspaceId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  type PageViewPartial = Pick<AnalyticsPageViewRow, 'page_path' | 'page_title' | 'duration_seconds' | 'session_id'>;
  const pageViews: PageViewPartial[] = data || [];

  // Group by page path
  const grouped = new Map<string, {
    title: string | null;
    views: number;
    sessions: Set<string>;
    totalDuration: number;
  }>();

  pageViews.forEach((pv) => {
    if (!grouped.has(pv.page_path)) {
      grouped.set(pv.page_path, {
        title: pv.page_title,
        views: 0,
        sessions: new Set(),
        totalDuration: 0,
      });
    }
    const entry = grouped.get(pv.page_path)!;
    entry.views++;
    entry.sessions.add(pv.session_id || '');
    entry.totalDuration += pv.duration_seconds || 0;
  });

  // Convert to array and sort
  const result: TopPage[] = Array.from(grouped.entries())
    .map(([path, data]) => ({
      path,
      title: data.title,
      views: data.views,
      unique_views: data.sessions.size,
      avg_duration: data.views > 0 ? data.totalDuration / data.views : 0,
      bounce_rate: 0, // Would require more complex calculation
      exit_rate: 0, // Would require more complex calculation
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);

  return result;
}

async function fetchTopReferrers(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  limit = 10
): Promise<TopReferrer[]> {
  const { data } = await supabase
    .from('analytics_sessions')
    .select('referrer, utm_source, utm_medium, visitor_id, converted')
    .eq('workspace_id', workspaceId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  type SessionPartial = Pick<AnalyticsSessionRow, 'referrer' | 'utm_source' | 'utm_medium' | 'visitor_id' | 'converted'>;
  const sessions: SessionPartial[] = data || [];

  // Group by source
  const grouped = new Map<string, {
    medium: string | null;
    visitors: Set<string>;
    sessions: number;
    conversions: number;
  }>();

  sessions.forEach((s) => {
    const source = s.utm_source || s.referrer || 'Direct';
    if (!grouped.has(source)) {
      grouped.set(source, {
        medium: s.utm_medium,
        visitors: new Set(),
        sessions: 0,
        conversions: 0,
      });
    }
    const entry = grouped.get(source)!;
    entry.visitors.add(s.visitor_id || '');
    entry.sessions++;
    if (s.converted) entry.conversions++;
  });

  // Convert to array and sort
  const result: TopReferrer[] = Array.from(grouped.entries())
    .map(([source, data]) => ({
      source,
      medium: data.medium,
      visitors: data.visitors.size,
      sessions: data.sessions,
      conversions: data.conversions,
      conversion_rate: data.sessions > 0 ? (data.conversions / data.sessions) * 100 : 0,
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);

  return result;
}

async function fetchDeviceBreakdown(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<DeviceBreakdown[]> {
  const { data } = await supabase
    .from('analytics_sessions')
    .select('device_type, visitor_id, is_bounce, duration_seconds')
    .eq('workspace_id', workspaceId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  type SessionDevicePartial = Pick<AnalyticsSessionRow, 'device_type' | 'visitor_id' | 'is_bounce' | 'duration_seconds'>;
  const sessions: SessionDevicePartial[] = data || [];
  const total = sessions.length;

  // Group by device type
  const grouped = new Map<string, {
    visitors: Set<string>;
    sessions: number;
    bounces: number;
    totalDuration: number;
  }>();

  sessions.forEach((s) => {
    const device = s.device_type || 'desktop';
    if (!grouped.has(device)) {
      grouped.set(device, {
        visitors: new Set(),
        sessions: 0,
        bounces: 0,
        totalDuration: 0,
      });
    }
    const entry = grouped.get(device)!;
    entry.visitors.add(s.visitor_id || '');
    entry.sessions++;
    if (s.is_bounce) entry.bounces++;
    entry.totalDuration += s.duration_seconds || 0;
  });

  const result: DeviceBreakdown[] = Array.from(grouped.entries()).map(
    ([device, data]) => ({
      device_type: device as 'desktop' | 'mobile' | 'tablet',
      visitors: data.visitors.size,
      sessions: data.sessions,
      percentage: total > 0 ? (data.sessions / total) * 100 : 0,
      bounce_rate: data.sessions > 0 ? (data.bounces / data.sessions) * 100 : 0,
      avg_duration: data.sessions > 0 ? data.totalDuration / data.sessions : 0,
    })
  );

  return result.sort((a, b) => b.sessions - a.sessions);
}

async function fetchGeoBreakdown(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  limit = 10
): Promise<GeoBreakdown[]> {
  const { data } = await supabase
    .from('analytics_sessions')
    .select('country, visitor_id, converted')
    .eq('workspace_id', workspaceId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  type SessionGeoPartial = Pick<AnalyticsSessionRow, 'country' | 'visitor_id' | 'converted'>;
  const sessions: SessionGeoPartial[] = data || [];
  const total = sessions.length;

  // Group by country
  const grouped = new Map<string, {
    visitors: Set<string>;
    sessions: number;
    conversions: number;
  }>();

  sessions.forEach((s) => {
    const country = s.country || 'Unknown';
    if (!grouped.has(country)) {
      grouped.set(country, {
        visitors: new Set(),
        sessions: 0,
        conversions: 0,
      });
    }
    const entry = grouped.get(country)!;
    entry.visitors.add(s.visitor_id || '');
    entry.sessions++;
    if (s.converted) entry.conversions++;
  });

  const result: GeoBreakdown[] = Array.from(grouped.entries())
    .map(([country, data]) => ({
      country,
      country_code: country.substring(0, 2).toUpperCase(),
      visitors: data.visitors.size,
      sessions: data.sessions,
      percentage: total > 0 ? (data.sessions / total) * 100 : 0,
      conversions: data.conversions,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);

  return result;
}
