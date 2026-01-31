import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPeriodDays } from '@/types/analytics';
import type { AnalyticsPeriod } from '@/types/analytics';
import type {
  InsightsResponse,
  OverviewInsights,
  RevenueInsights,
  GrowthInsights,
  ProductivityInsights,
  ActivityInsights,
  InsightsTimePoint,
  DealPipelineStage,
  StatusCount,
  SourceCount,
  PriorityCount,
  LandingPageStat,
} from '@/types/insights';

// =============================================================================
// GET - Fetch Insights Data
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
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Calculate date ranges
    const days = getPeriodDays(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    // Fetch sections in parallel
    const response: InsightsResponse = {};
    const promises: Promise<void>[] = [];
    const all = include.includes('all');

    if (all || include.includes('overview')) {
      promises.push(
        fetchOverview(supabase, workspaceId, startDate, endDate, prevStartDate, prevEndDate)
          .then((d) => { response.overview = d; })
      );
    }
    if (all || include.includes('revenue')) {
      promises.push(
        fetchRevenue(supabase, workspaceId, startDate, endDate)
          .then((d) => { response.revenue = d; })
      );
    }
    if (all || include.includes('growth')) {
      promises.push(
        fetchGrowth(supabase, workspaceId, startDate, endDate)
          .then((d) => { response.growth = d; })
      );
    }
    if (all || include.includes('productivity')) {
      promises.push(
        fetchProductivity(supabase, workspaceId, startDate, endDate)
          .then((d) => { response.productivity = d; })
      );
    }
    if (all || include.includes('activity')) {
      promises.push(
        fetchActivity(supabase, workspaceId)
          .then((d) => { response.activity = d; })
      );
    }

    await Promise.all(promises);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Insights GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper: Group items by date
// =============================================================================

function groupByDate(
  items: Array<{ date: string | null; value: number }>
): InsightsTimePoint[] {
  const grouped = new Map<string, number>();
  items.forEach((item) => {
    const date = item.date?.split('T')[0];
    if (date) grouped.set(date, (grouped.get(date) || 0) + item.value);
  });
  return Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// =============================================================================
// Fetch Overview
// =============================================================================

type SupabaseClient = ReturnType<typeof createClient> extends Promise<infer T> ? T : never;

async function fetchOverview(
  supabase: SupabaseClient,
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date
): Promise<OverviewInsights> {
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();
  const prevStartISO = prevStartDate.toISOString();
  const prevEndISO = prevEndDate.toISOString();

  // Parallel queries
  const [invoicesRes, prevInvoicesRes, dealsRes, contactsRes, prevContactsRes, tasksRes, prevTasksRes] =
    await Promise.all([
      // Current period paid invoices
      (supabase.from('invoices') as any)
        .select('amount_paid, paid_date')
        .eq('workspace_id', workspaceId)
        .eq('status', 'paid')
        .gte('paid_date', startISO)
        .lte('paid_date', endISO),
      // Previous period paid invoices
      (supabase.from('invoices') as any)
        .select('amount_paid')
        .eq('workspace_id', workspaceId)
        .eq('status', 'paid')
        .gte('paid_date', prevStartISO)
        .lt('paid_date', startISO),
      // Active deals
      (supabase.from('deals') as any)
        .select('value')
        .eq('workspace_id', workspaceId)
        .eq('status', 'open'),
      // Current period contacts
      (supabase.from('contacts') as any)
        .select('id, created_at')
        .eq('workspace_id', workspaceId),
      // Previous period contacts
      (supabase.from('contacts') as any)
        .select('id')
        .eq('workspace_id', workspaceId)
        .lt('created_at', startISO),
      // Current period completed tasks
      (supabase.from('tasks') as any)
        .select('id, completed_at')
        .eq('workspace_id', workspaceId)
        .eq('status', 'done')
        .gte('completed_at', startISO)
        .lte('completed_at', endISO),
      // Previous period completed tasks
      (supabase.from('tasks') as any)
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'done')
        .gte('completed_at', prevStartISO)
        .lt('completed_at', startISO),
    ]);

  const invoices = invoicesRes.data || [];
  const prevInvoices = prevInvoicesRes.data || [];
  const deals = dealsRes.data || [];
  const contacts = contactsRes.data || [];
  const prevContacts = prevContactsRes.data || [];
  const tasks = tasksRes.data || [];
  const prevTasks = prevTasksRes.data || [];

  const totalRevenue = invoices.reduce((sum: number, i: any) => sum + (i.amount_paid || 0), 0);
  const prevRevenue = prevInvoices.reduce((sum: number, i: any) => sum + (i.amount_paid || 0), 0);

  const currentContactCount = contacts.length;
  const prevContactCount = prevContacts.length;

  // Revenue trend
  const revenueTrend = groupByDate(
    invoices.map((i: any) => ({ date: i.paid_date, value: i.amount_paid || 0 }))
  );

  return {
    total_revenue: totalRevenue,
    total_revenue_change: calcChange(totalRevenue, prevRevenue),
    active_deals_value: deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0),
    active_deals_count: deals.length,
    total_contacts: currentContactCount,
    total_contacts_change: calcChange(currentContactCount, prevContactCount),
    tasks_completed: tasks.length,
    tasks_completed_change: calcChange(tasks.length, prevTasks.length),
    revenue_trend: revenueTrend,
  };
}

// =============================================================================
// Fetch Revenue
// =============================================================================

async function fetchRevenue(
  supabase: SupabaseClient,
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueInsights> {
  const [invoicesRes, dealsRes, stagesRes] = await Promise.all([
    // All invoices (not just paid) for status breakdown
    (supabase.from('invoices') as any)
      .select('status, total, amount_paid, due_date, paid_date')
      .eq('workspace_id', workspaceId),
    // Open deals with stage
    (supabase.from('deals') as any)
      .select('value, status, stage_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'open'),
    // Pipeline stages
    (supabase.from('pipeline_stages') as any)
      .select('id, name, position, is_won, is_lost')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true }),
  ]);

  const invoices = invoicesRes.data || [];
  const deals = dealsRes.data || [];
  const stages = stagesRes.data || [];

  const now = new Date();
  const totalInvoiced = invoices.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
  const totalPaid = invoices
    .filter((i: any) => i.status === 'paid')
    .reduce((sum: number, i: any) => sum + (i.amount_paid || 0), 0);
  const overdue = invoices.filter(
    (i: any) => ['sent', 'viewed'].includes(i.status) && i.due_date && new Date(i.due_date) < now
  );
  const totalOverdue = overdue.reduce((sum: number, i: any) => sum + (i.total - (i.amount_paid || 0)), 0);
  const totalOutstanding = invoices
    .filter((i: any) => ['sent', 'viewed', 'overdue'].includes(i.status))
    .reduce((sum: number, i: any) => sum + (i.total - (i.amount_paid || 0)), 0);

  // Revenue trend (paid invoices by date)
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid' && i.paid_date);
  const revenueTrend = groupByDate(
    paidInvoices.map((i: any) => ({ date: i.paid_date, value: i.amount_paid || 0 }))
  );

  // Deal pipeline
  const stageMap = new Map(stages.map((s: any) => [s.id, s]));
  const pipelineMap = new Map<string, { count: number; value: number }>();
  deals.forEach((d: any) => {
    const existing = pipelineMap.get(d.stage_id) || { count: 0, value: 0 };
    existing.count++;
    existing.value += d.value || 0;
    pipelineMap.set(d.stage_id, existing);
  });

  const dealPipeline: DealPipelineStage[] = stages.map((s: any) => {
    const stats = pipelineMap.get(s.id) || { count: 0, value: 0 };
    return {
      stage_name: s.name,
      stage_position: s.position,
      deal_count: stats.count,
      total_value: stats.value,
      is_won: s.is_won || false,
      is_lost: s.is_lost || false,
    };
  });

  // Invoice status breakdown
  const statusCounts = new Map<string, number>();
  invoices.forEach((i: any) => {
    statusCounts.set(i.status, (statusCounts.get(i.status) || 0) + 1);
  });
  const invoiceStatusBreakdown: StatusCount[] = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }));

  return {
    total_invoiced: totalInvoiced,
    total_paid: totalPaid,
    total_outstanding: totalOutstanding,
    total_overdue: totalOverdue,
    invoice_count: invoices.length,
    paid_count: invoices.filter((i: any) => i.status === 'paid').length,
    overdue_count: overdue.length,
    revenue_trend: revenueTrend,
    deal_pipeline: dealPipeline,
    invoice_status_breakdown: invoiceStatusBreakdown,
  };
}

// =============================================================================
// Fetch Growth
// =============================================================================

async function fetchGrowth(
  supabase: SupabaseClient,
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<GrowthInsights> {
  const [contactsRes, landingPagesRes, leadsRes, contentRes] = await Promise.all([
    // All contacts
    (supabase.from('contacts') as any)
      .select('id, source, created_at')
      .eq('workspace_id', workspaceId),
    // Landing pages
    (supabase.from('landing_pages') as any)
      .select('id, title, status, view_count, conversion_count')
      .eq('workspace_id', workspaceId),
    // Landing page leads
    (supabase.from('landing_page_leads') as any)
      .select('id, created_at')
      .eq('workspace_id', workspaceId),
    // Published content
    (supabase.from('content_posts') as any)
      .select('id, published_at, created_at, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published'),
  ]);

  const contacts = contactsRes.data || [];
  const landingPages = landingPagesRes.data || [];
  const leads = leadsRes.data || [];
  const content = contentRes.data || [];

  const startISO = startDate.toISOString();
  const newContacts = contacts.filter((c: any) => c.created_at >= startISO);

  // Contact growth over time
  const contactGrowth = groupByDate(
    contacts.map((c: any) => ({ date: c.created_at, value: 1 }))
  );

  // Lead sources breakdown
  const sourceCounts = new Map<string, number>();
  contacts.forEach((c: any) => {
    const source = c.source || 'unknown';
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  });
  const total = contacts.length || 1;
  const leadSources: SourceCount[] = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Landing page stats
  const totalViews = landingPages.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0);
  const totalConversions = landingPages.reduce((sum: number, p: any) => sum + (p.conversion_count || 0), 0);

  const landingPageStats: LandingPageStat[] = landingPages
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      view_count: p.view_count || 0,
      conversion_count: p.conversion_count || 0,
      conversion_rate: p.view_count > 0 ? (p.conversion_count / p.view_count) * 100 : 0,
    }))
    .sort((a: LandingPageStat, b: LandingPageStat) => b.view_count - a.view_count);

  // Content publishing trend
  const contentTrend = groupByDate(
    content.map((c: any) => ({ date: c.published_at || c.created_at, value: 1 }))
  );

  return {
    total_contacts: contacts.length,
    new_contacts: newContacts.length,
    total_leads: leads.length,
    total_landing_page_views: totalViews,
    total_landing_page_conversions: totalConversions,
    avg_conversion_rate: totalViews > 0 ? (totalConversions / totalViews) * 100 : 0,
    contact_growth: contactGrowth,
    lead_sources: leadSources,
    landing_pages: landingPageStats,
    content_trend: contentTrend,
  };
}

// =============================================================================
// Fetch Productivity
// =============================================================================

async function fetchProductivity(
  supabase: SupabaseClient,
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<ProductivityInsights> {
  const [tasksRes, projectsRes, feedbackRes] = await Promise.all([
    (supabase.from('tasks') as any)
      .select('id, status, priority, due_date, completed_at')
      .eq('workspace_id', workspaceId),
    (supabase.from('projects') as any)
      .select('id, status')
      .eq('workspace_id', workspaceId),
    (supabase.from('feedback_submissions') as any)
      .select('id, type, status')
      .eq('workspace_id', workspaceId),
  ]);

  const tasks = tasksRes.data || [];
  const projects = projectsRes.data || [];
  const feedback = feedbackRes.data || [];

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t: any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < now
  );

  // Tasks by priority
  const priorityCounts = new Map<string, number>();
  tasks.forEach((t: any) => {
    const priority = t.priority || 'medium';
    priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1);
  });
  const tasksByPriority: PriorityCount[] = Array.from(priorityCounts.entries())
    .map(([priority, count]) => ({ priority, count }));

  // Feedback by type
  const feedbackTypeCounts = new Map<string, number>();
  feedback.forEach((f: any) => {
    const type = f.type || 'other';
    feedbackTypeCounts.set(type, (feedbackTypeCounts.get(type) || 0) + 1);
  });
  const feedbackByType: StatusCount[] = Array.from(feedbackTypeCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    tasks_total: tasks.length,
    tasks_todo: tasks.filter((t: any) => t.status === 'todo').length,
    tasks_in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
    tasks_done: tasks.filter((t: any) => t.status === 'done').length,
    tasks_overdue: overdueTasks.length,
    projects_active: projects.filter((p: any) => p.status === 'active').length,
    projects_completed: projects.filter((p: any) => p.status === 'completed').length,
    projects_on_hold: projects.filter((p: any) => p.status === 'on_hold').length,
    tasks_by_priority: tasksByPriority,
    feedback_total: feedback.length,
    feedback_new: feedback.filter((f: any) => f.status === 'new').length,
    feedback_in_progress: feedback.filter((f: any) => f.status === 'in_progress').length,
    feedback_completed: feedback.filter((f: any) => f.status === 'completed').length,
    feedback_by_type: feedbackByType,
  };
}

// =============================================================================
// Fetch Activity
// =============================================================================

async function fetchActivity(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityInsights> {
  const { data } = await (supabase.from('activities') as any)
    .select('id, action, entity_type, description, metadata, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(15);

  return {
    recent: (data || []).map((a: any) => ({
      id: a.id,
      action: a.action,
      entity_type: a.entity_type,
      description: a.description,
      metadata: a.metadata,
      created_at: a.created_at,
    })),
  };
}
