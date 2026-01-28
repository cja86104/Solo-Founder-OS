// ============================================================================
// Solo Founder OS - CRM Types
// Deals, Pipeline, and Sales Management
// ============================================================================

export type DealStatus = 'open' | 'won' | 'lost';

export type DealActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'task'
  | 'stage_change'
  | 'value_change';

export interface PipelineStage {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  workspace_id: string;
  name: string;
  value: number;
  currency: string;
  stage_id: string | null;
  probability: number;
  contact_id: string | null;
  company: string | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  owner_id: string | null;
  status: DealStatus;
  lost_reason: string | null;
  description: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DealWithRelations extends Deal {
  stage?: PipelineStage | null;
  contact?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  owner?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  workspace_id: string;
  user_id: string;
  activity_type: DealActivityType;
  title: string | null;
  description: string | null;
  from_stage_id: string | null;
  to_stage_id: string | null;
  old_value: number | null;
  new_value: number | null;
  scheduled_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DealActivityWithUser extends DealActivity {
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  from_stage?: PipelineStage | null;
  to_stage?: PipelineStage | null;
}

// Input types
export interface CreateDealInput {
  name: string;
  value?: number;
  currency?: string;
  stage_id?: string;
  probability?: number;
  contact_id?: string;
  company?: string;
  expected_close_date?: string;
  owner_id?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDealInput {
  name?: string;
  value?: number;
  currency?: string;
  stage_id?: string;
  probability?: number;
  contact_id?: string;
  company?: string;
  expected_close_date?: string;
  actual_close_date?: string;
  owner_id?: string;
  status?: DealStatus;
  lost_reason?: string;
  description?: string;
  tags?: string[];
  position?: number;
}

export interface CreateDealActivityInput {
  activity_type: DealActivityType;
  title?: string;
  description?: string;
  scheduled_at?: string;
}

export interface CreateStageInput {
  name: string;
  color?: string;
  position?: number;
  is_won?: boolean;
  is_lost?: boolean;
}

// Filter types
export interface DealFilters {
  search?: string;
  status?: DealStatus | DealStatus[];
  stage_id?: string | string[];
  owner_id?: string;
  contact_id?: string;
  min_value?: number;
  max_value?: number;
  expected_close_from?: string;
  expected_close_to?: string;
  tags?: string[];
}

// Stats types
export interface CRMStats {
  total_deals: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  pipeline_value: number;
  won_value: number;
  avg_deal_size: number;
  won_last_30_days: number;
  revenue_last_30_days: number;
  win_rate: number;
}

export interface PipelineStats {
  stage_id: string;
  stage_name: string;
  deal_count: number;
  total_value: number;
}

// Kanban board types
export interface KanbanColumn {
  stage: PipelineStage;
  deals: DealWithRelations[];
  totalValue: number;
}

// Utility functions
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getStatusColor(status: DealStatus): string {
  const colors: Record<DealStatus, string> = {
    open: 'bg-blue-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
  };
  return colors[status];
}

export function getStatusLabel(status: DealStatus): string {
  const labels: Record<DealStatus, string> = {
    open: 'Open',
    won: 'Won',
    lost: 'Lost',
  };
  return labels[status];
}

export function getActivityIcon(type: DealActivityType): string {
  const icons: Record<DealActivityType, string> = {
    note: '📝',
    call: '📞',
    email: '✉️',
    meeting: '📅',
    task: '✅',
    stage_change: '➡️',
    value_change: '💰',
  };
  return icons[type];
}

export function getActivityLabel(type: DealActivityType): string {
  const labels: Record<DealActivityType, string> = {
    note: 'Note',
    call: 'Call',
    email: 'Email',
    meeting: 'Meeting',
    task: 'Task',
    stage_change: 'Stage Change',
    value_change: 'Value Change',
  };
  return labels[type];
}

export function calculateWeightedValue(deal: Deal): number {
  return deal.value * (deal.probability / 100);
}

export function calculateWinRate(won: number, lost: number): number {
  const total = won + lost;
  if (total === 0) return 0;
  return Math.round((won / total) * 100);
}
