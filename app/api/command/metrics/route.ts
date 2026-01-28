import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  MRRMetrics,
  MRRHistory,
  Customer,
  MetricPeriod,
  ChurnAnalysis,
} from '@/types/command';

// ============================================================================
// GET /api/command/metrics - Get MRR and revenue metrics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const period = (searchParams.get('period') || 'monthly') as MetricPeriod;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeCustomers = searchParams.get('include_customers') === 'true';
    const includeChurnAnalysis = searchParams.get('include_churn') === 'true';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get current metrics
    const metrics = await getCurrentMetrics(supabase, workspaceId);

    // Get MRR history
    const history = await getMRRHistory(supabase, workspaceId, period, startDate, endDate);

    // Optionally include customer list
    let customers: Customer[] | undefined;
    if (includeCustomers) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('mrr', { ascending: false })
        .limit(100);
      customers = data as Customer[];
    }

    // Optionally include churn analysis
    let churnAnalysis: ChurnAnalysis | undefined;
    if (includeChurnAnalysis) {
      churnAnalysis = await getChurnAnalysis(supabase, workspaceId);
    }

    return NextResponse.json({
      metrics,
      history,
      period,
      customers,
      churn_analysis: churnAnalysis,
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getCurrentMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string
): Promise<MRRMetrics> {
  // Get all customers
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (!customers || customers.length === 0) {
    return getEmptyMetrics();
  }

  type CustomerRow = { status: string; mrr: number };
  type EventRow = { event_type: string; mrr_impact: number };

  // Current MRR from active customers
  const activeCustomers = customers.filter(
    (c: CustomerRow) => c.status === 'active' || c.status === 'new' || c.status === 'at_risk'
  );
  const currentMRR = activeCustomers.reduce((sum: number, c: CustomerRow) => sum + Number(c.mrr || 0), 0);
  const currentARR = currentMRR * 12;

  // Get previous month's MRR for comparison
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const { data: previousRecord } = await supabase
    .from('mrr_history')
    .select('mrr')
    .eq('workspace_id', workspaceId)
    .eq('period_type', 'daily')
    .lte('period_date', lastMonthStr)
    .order('period_date', { ascending: false })
    .limit(1)
    .single();

  const previousMRR = previousRecord?.mrr || 0;
  const mrrChange = currentMRR - previousMRR;
  const mrrChangePercent = previousMRR > 0 ? (mrrChange / previousMRR) * 100 : 0;

  // Get revenue events for breakdown
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: revenueEvents } = await supabase
    .from('revenue_events')
    .select('event_type, mrr_impact')
    .eq('workspace_id', workspaceId)
    .gte('event_date', thirtyDaysAgo.toISOString());

  const eventTotals = {
    new: 0,
    expansion: 0,
    contraction: 0,
    churn: 0,
    reactivation: 0,
  };

  revenueEvents?.forEach((event: EventRow) => {
    const type = event.event_type as keyof typeof eventTotals;
    if (type in eventTotals) {
      eventTotals[type] += Math.abs(Number(event.mrr_impact || 0));
    }
  });

  // Customer counts
  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c: CustomerRow) => c.status === 'new').length;
  const churnedCustomers = customers.filter((c: CustomerRow) => c.status === 'churned').length;
  const atRiskCustomers = customers.filter((c: CustomerRow) => c.status === 'at_risk').length;

  // Rates
  const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;
  const growthRate = previousMRR > 0 ? mrrChangePercent : 0;
  const expansionRate = currentMRR > 0 ? (eventTotals.expansion / currentMRR) * 100 : 0;

  // Averages
  const arpu = activeCustomers.length > 0 ? currentMRR / activeCustomers.length : 0;
  const ltv = churnRate > 0 ? arpu / (churnRate / 100) : arpu * 60; // 5 year cap if no churn

  return {
    current_mrr: currentMRR,
    previous_mrr: previousMRR,
    mrr_change: mrrChange,
    mrr_change_percent: mrrChangePercent,
    current_arr: currentARR,
    new_mrr: eventTotals.new,
    expansion_mrr: eventTotals.expansion,
    contraction_mrr: eventTotals.contraction,
    churned_mrr: eventTotals.churn,
    reactivation_mrr: eventTotals.reactivation,
    net_new_mrr: eventTotals.new + eventTotals.expansion + eventTotals.reactivation - eventTotals.contraction - eventTotals.churn,
    total_customers: totalCustomers,
    new_customers: newCustomers,
    churned_customers: churnedCustomers,
    at_risk_customers: atRiskCustomers,
    churn_rate: churnRate,
    growth_rate: growthRate,
    expansion_rate: expansionRate,
    arpu,
    ltv,
  };
}

async function getMRRHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  period: MetricPeriod,
  startDate?: string | null,
  endDate?: string | null
): Promise<MRRHistory[]> {
  let query = supabase
    .from('mrr_history')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('period_type', period)
    .order('period_date', { ascending: true });

  if (startDate) {
    query = query.gte('period_date', startDate);
  } else {
    // Default to last 12 months
    const defaultStart = new Date();
    defaultStart.setMonth(defaultStart.getMonth() - 12);
    query = query.gte('period_date', defaultStart.toISOString().split('T')[0]);
  }

  if (endDate) {
    query = query.lte('period_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching MRR history:', error);
    return [];
  }

  return (data as MRRHistory[]) || [];
}

async function getChurnAnalysis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string
): Promise<ChurnAnalysis> {
  // Get at-risk customers
  const { data: atRiskCustomers } = await supabase
    .from('customers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'at_risk')
    .order('churn_risk_score', { ascending: false })
    .limit(10);

  // Get recently churned customers (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentlyChurned } = await supabase
    .from('customers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'churned')
    .gte('canceled_at', thirtyDaysAgo.toISOString())
    .order('canceled_at', { ascending: false })
    .limit(10);

  // Calculate current churn rate
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('status')
    .eq('workspace_id', workspaceId);

  const total = allCustomers?.length || 0;
  const churned = allCustomers?.filter((c: { status: string }) => c.status === 'churned').length || 0;
  const currentChurnRate = total > 0 ? (churned / total) * 100 : 0;

  // Get previous month churn rate
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const { data: previousRecord } = await supabase
    .from('mrr_history')
    .select('churn_rate')
    .eq('workspace_id', workspaceId)
    .lte('period_date', lastMonthStr)
    .order('period_date', { ascending: false })
    .limit(1)
    .single();

  const previousChurnRate = previousRecord?.churn_rate || 0;

  // Determine trend
  let churnTrend: 'improving' | 'stable' | 'worsening' = 'stable';
  const rateChange = currentChurnRate - previousChurnRate;
  if (rateChange < -1) {
    churnTrend = 'improving';
  } else if (rateChange > 1) {
    churnTrend = 'worsening';
  }

  // Analyze churn reasons from revenue events
  const { data: churnEvents } = await supabase
    .from('revenue_events')
    .select('description')
    .eq('workspace_id', workspaceId)
    .eq('event_type', 'churn')
    .gte('event_date', thirtyDaysAgo.toISOString());

  const reasonCounts: Record<string, number> = {};
  churnEvents?.forEach((event: { description: string | null }) => {
    const reason = event.description || 'Unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const churnReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    current_churn_rate: currentChurnRate,
    previous_churn_rate: previousChurnRate,
    churn_trend: churnTrend,
    at_risk_customers: (atRiskCustomers as Customer[]) || [],
    recently_churned: (recentlyChurned as Customer[]) || [],
    churn_reasons: churnReasons,
  };
}

function getEmptyMetrics(): MRRMetrics {
  return {
    current_mrr: 0,
    previous_mrr: 0,
    mrr_change: 0,
    mrr_change_percent: 0,
    current_arr: 0,
    new_mrr: 0,
    expansion_mrr: 0,
    contraction_mrr: 0,
    churned_mrr: 0,
    reactivation_mrr: 0,
    net_new_mrr: 0,
    total_customers: 0,
    new_customers: 0,
    churned_customers: 0,
    at_risk_customers: 0,
    churn_rate: 0,
    growth_rate: 0,
    expansion_rate: 0,
    arpu: 0,
    ltv: 0,
  };
}
