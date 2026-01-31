// =============================================================================
// Business Insights Types
// =============================================================================

// -----------------------------------------------------------------------------
// API Response
// -----------------------------------------------------------------------------

export interface InsightsResponse {
  overview?: OverviewInsights;
  revenue?: RevenueInsights;
  growth?: GrowthInsights;
  productivity?: ProductivityInsights;
  activity?: ActivityInsights;
}

// -----------------------------------------------------------------------------
// Overview
// -----------------------------------------------------------------------------

export interface OverviewInsights {
  total_revenue: number;
  total_revenue_change: number;
  active_deals_value: number;
  active_deals_count: number;
  total_contacts: number;
  total_contacts_change: number;
  tasks_completed: number;
  tasks_completed_change: number;
  revenue_trend: InsightsTimePoint[];
}

// -----------------------------------------------------------------------------
// Revenue
// -----------------------------------------------------------------------------

export interface RevenueInsights {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  invoice_count: number;
  paid_count: number;
  overdue_count: number;
  revenue_trend: InsightsTimePoint[];
  deal_pipeline: DealPipelineStage[];
  invoice_status_breakdown: StatusCount[];
}

export interface DealPipelineStage {
  stage_name: string;
  stage_position: number;
  deal_count: number;
  total_value: number;
  is_won: boolean;
  is_lost: boolean;
}

// -----------------------------------------------------------------------------
// Growth
// -----------------------------------------------------------------------------

export interface GrowthInsights {
  total_contacts: number;
  new_contacts: number;
  total_leads: number;
  total_landing_page_views: number;
  total_landing_page_conversions: number;
  avg_conversion_rate: number;
  contact_growth: InsightsTimePoint[];
  lead_sources: SourceCount[];
  landing_pages: LandingPageStat[];
  content_trend: InsightsTimePoint[];
}

export interface LandingPageStat {
  id: string;
  title: string;
  status: string;
  view_count: number;
  conversion_count: number;
  conversion_rate: number;
}

// -----------------------------------------------------------------------------
// Productivity
// -----------------------------------------------------------------------------

export interface ProductivityInsights {
  tasks_total: number;
  tasks_todo: number;
  tasks_in_progress: number;
  tasks_done: number;
  tasks_overdue: number;
  projects_active: number;
  projects_completed: number;
  projects_on_hold: number;
  tasks_by_priority: PriorityCount[];
  feedback_total: number;
  feedback_new: number;
  feedback_in_progress: number;
  feedback_completed: number;
  feedback_by_type: StatusCount[];
}

// -----------------------------------------------------------------------------
// Activity
// -----------------------------------------------------------------------------

export interface ActivityInsights {
  recent: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Shared Shapes
// -----------------------------------------------------------------------------

export interface InsightsTimePoint {
  date: string;
  value: number;
  label?: string;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface SourceCount {
  source: string;
  count: number;
  percentage: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}
