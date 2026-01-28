// ============================================================================
// Solo Founder OS - Command Center Types
// MRR Tracking, Customer Management, and Revenue Metrics
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid'
  | 'paused';

export type CustomerStatus = 'active' | 'churned' | 'at_risk' | 'new';

export type MetricPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type RevenueEventType =
  | 'new'
  | 'expansion'
  | 'contraction'
  | 'churn'
  | 'reactivation'
  | 'payment';

export type SyncType =
  | 'full'
  | 'incremental'
  | 'customers'
  | 'subscriptions'
  | 'invoices';

export type SyncStatus = 'started' | 'completed' | 'failed';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Customer {
  id: string;
  workspace_id: string;

  // Stripe identifiers
  stripe_customer_id: string;
  stripe_subscription_id: string | null;

  // Customer info
  email: string;
  name: string | null;
  company: string | null;

  // Subscription details
  status: CustomerStatus;
  subscription_status: SubscriptionStatus | null;
  plan_name: string | null;
  plan_id: string | null;

  // Financial
  mrr: number;
  currency: string;
  lifetime_value: number;

  // Dates
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  trial_end_date: string | null;
  canceled_at: string | null;

  // Engagement
  last_payment_date: string | null;
  last_invoice_date: string | null;
  payment_count: number;
  failed_payment_count: number;

  // Churn risk
  churn_risk_score: number;
  days_until_renewal: number | null;

  // Metadata
  created_at: string;
  updated_at: string;
  synced_at: string;
  metadata: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  workspace_id: string;
  customer_id: string;

  // Stripe identifiers
  stripe_subscription_id: string;
  stripe_customer_id: string;

  // Subscription details
  status: SubscriptionStatus;
  plan_name: string | null;
  plan_id: string | null;
  price_id: string | null;

  // Financial
  amount: number;
  currency: string;
  interval: string | null;
  interval_count: number;
  mrr: number;

  // Dates
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  ended_at: string | null;

  // Billing
  billing_cycle_anchor: string | null;
  collection_method: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
  synced_at: string;
  metadata: Record<string, unknown>;
}

export interface MRRHistory {
  id: string;
  workspace_id: string;

  // Period
  period_date: string;
  period_type: MetricPeriod;

  // MRR metrics
  mrr: number;
  mrr_new: number;
  mrr_expansion: number;
  mrr_contraction: number;
  mrr_churned: number;
  mrr_reactivation: number;

  // Net MRR movement
  net_mrr_change: number;

  // Customer counts
  total_customers: number;
  new_customers: number;
  churned_customers: number;
  reactivated_customers: number;

  // ARR
  arr: number;

  // Rates
  churn_rate: number;
  growth_rate: number;

  // Metadata
  created_at: string;
}

export interface RevenueEvent {
  id: string;
  workspace_id: string;
  customer_id: string | null;
  subscription_id: string | null;

  // Stripe identifiers
  stripe_event_id: string | null;
  stripe_invoice_id: string | null;
  stripe_charge_id: string | null;

  // Event type
  event_type: RevenueEventType;

  // Financial
  amount: number;
  currency: string;
  mrr_impact: number;

  // Details
  description: string | null;
  plan_from: string | null;
  plan_to: string | null;

  // Status
  status: string | null;
  failure_reason: string | null;

  // Metadata
  event_date: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface StripeSyncLog {
  id: string;
  workspace_id: string;

  // Sync details
  sync_type: SyncType;
  status: SyncStatus;

  // Results
  records_synced: number;
  records_created: number;
  records_updated: number;
  records_failed: number;

  // Error tracking
  error_message: string | null;
  error_details: Record<string, unknown> | null;

  // Timing
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;

  // Metadata
  triggered_by: string | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// EXTENDED INTERFACES
// ============================================================================

export interface CustomerWithSubscription extends Customer {
  subscription?: Subscription;
}

export interface MRRSummary {
  total_mrr: number;
  total_arr: number;
  total_customers: number;
  active_customers: number;
  churned_customers: number;
  at_risk_customers: number;
  avg_mrr_per_customer: number;
  churn_rate: number;
}

export interface MRRMetrics {
  current_mrr: number;
  previous_mrr: number;
  mrr_change: number;
  mrr_change_percent: number;
  current_arr: number;
  
  // Breakdown
  new_mrr: number;
  expansion_mrr: number;
  contraction_mrr: number;
  churned_mrr: number;
  reactivation_mrr: number;
  net_new_mrr: number;
  
  // Customer metrics
  total_customers: number;
  new_customers: number;
  churned_customers: number;
  at_risk_customers: number;
  
  // Rates
  churn_rate: number;
  growth_rate: number;
  expansion_rate: number;
  
  // Averages
  arpu: number; // Average Revenue Per User
  ltv: number; // Lifetime Value estimate
}

export interface ChurnAnalysis {
  current_churn_rate: number;
  previous_churn_rate: number;
  churn_trend: 'improving' | 'stable' | 'worsening';
  at_risk_customers: Customer[];
  recently_churned: Customer[];
  churn_reasons: { reason: string; count: number }[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface SyncCustomerInput {
  stripe_customer_id: string;
  email: string;
  name?: string;
  company?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncSubscriptionInput {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  plan_name?: string;
  plan_id?: string;
  price_id?: string;
  amount: number;
  currency?: string;
  interval?: string;
  interval_count?: number;
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  canceled_at?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordRevenueEventInput {
  customer_id?: string;
  subscription_id?: string;
  stripe_event_id?: string;
  stripe_invoice_id?: string;
  stripe_charge_id?: string;
  event_type: RevenueEventType;
  amount: number;
  currency?: string;
  mrr_impact?: number;
  description?: string;
  plan_from?: string;
  plan_to?: string;
  status?: string;
  failure_reason?: string;
  event_date?: string;
}

export interface MetricsFilterInput {
  period?: MetricPeriod;
  start_date?: string;
  end_date?: string;
  compare_previous?: boolean;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  sync_id: string;
  records_synced: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: string[];
  duration_ms: number;
}

export interface MetricsResponse {
  metrics: MRRMetrics;
  history: MRRHistory[];
  period: MetricPeriod;
  start_date: string;
  end_date: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getCustomerStatusColor(status: CustomerStatus): string {
  const colors: Record<CustomerStatus, string> = {
    active: 'bg-green-500',
    churned: 'bg-gray-500',
    at_risk: 'bg-red-500',
    new: 'bg-blue-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function getCustomerStatusLabel(status: CustomerStatus): string {
  const labels: Record<CustomerStatus, string> = {
    active: 'Active',
    churned: 'Churned',
    at_risk: 'At Risk',
    new: 'New',
  };
  return labels[status] || status;
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    active: 'bg-green-500',
    past_due: 'bg-yellow-500',
    canceled: 'bg-gray-500',
    incomplete: 'bg-orange-500',
    incomplete_expired: 'bg-red-500',
    trialing: 'bg-blue-500',
    unpaid: 'bg-red-500',
    paused: 'bg-gray-400',
  };
  return colors[status] || 'bg-gray-500';
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Active',
    past_due: 'Past Due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    trialing: 'Trial',
    unpaid: 'Unpaid',
    paused: 'Paused',
  };
  return labels[status] || status;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatMRR(amount: number, currency: string = 'USD'): string {
  return `${formatCurrency(amount, currency)}/mo`;
}

export function formatARR(amount: number, currency: string = 'USD'): string {
  return `${formatCurrency(amount, currency)}/yr`;
}

export function calculateMRR(
  amount: number,
  interval: string,
  intervalCount: number = 1
): number {
  switch (interval) {
    case 'month':
      return amount / intervalCount;
    case 'year':
      return amount / (12 * intervalCount);
    case 'week':
      return (amount * 52) / (12 * intervalCount);
    case 'day':
      return (amount * 365) / (12 * intervalCount);
    default:
      return amount;
  }
}

export function calculateChurnRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export function getChurnRiskColor(score: number): string {
  const level = calculateChurnRiskLevel(score);
  const colors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[level];
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function getDaysUntilRenewal(periodEnd: string | null): number | null {
  if (!periodEnd) return null;
  const end = new Date(periodEnd);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isAtRisk(customer: Customer): boolean {
  return customer.status === 'at_risk' || customer.churn_risk_score >= 50;
}

export function sortCustomersByRisk(customers: Customer[]): Customer[] {
  return [...customers].sort((a, b) => b.churn_risk_score - a.churn_risk_score);
}

export function filterActiveCustomers(customers: Customer[]): Customer[] {
  return customers.filter(
    (c) => c.status === 'active' || c.status === 'new' || c.status === 'at_risk'
  );
}

export function calculateLTV(mrr: number, churnRate: number): number {
  if (churnRate <= 0) return mrr * 60; // 5 year cap if no churn
  return mrr / (churnRate / 100);
}
