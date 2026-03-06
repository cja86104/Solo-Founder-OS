// ============================================================================
// AUTOMATIONS ENGINE TYPES
// Founders Helm - Workflow Automation System
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type AutomationStatus = 'active' | 'paused' | 'draft' | 'archived';

export type AutomationTriggerType =
  | 'new_contact'
  | 'contact_updated'
  | 'contact_tagged'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'form_submitted'
  | 'feedback_received'
  | 'task_completed'
  | 'task_created'
  | 'scheduled'
  | 'webhook'
  | 'manual';

export type AutomationActionType =
  | 'send_email'
  | 'create_task'
  | 'update_contact'
  | 'add_tag'
  | 'remove_tag'
  | 'move_deal'
  | 'create_deal'
  | 'update_deal'
  | 'webhook'
  | 'delay'
  | 'condition';

export type AutomationRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type AutomationLogLevel = 'info' | 'warning' | 'error' | 'debug';

// ============================================================================
// TRIGGER CONFIGURATIONS
// ============================================================================

export interface TriggerConfigNewContact {
  source_filter?: string[]; // Filter by contact source
  tag_filter?: string[]; // Only trigger if contact has these tags
}

export interface TriggerConfigContactUpdated {
  fields_to_watch?: string[]; // Only trigger when these fields change
}

export interface TriggerConfigContactTagged {
  tags: string[]; // Which tags to watch for
  match_mode: 'any' | 'all'; // Match any tag or all tags
}

export interface TriggerConfigDealCreated {
  pipeline_id?: string; // Filter by pipeline
  stage_id?: string; // Filter by initial stage
  min_value?: number; // Minimum deal value
}

export interface TriggerConfigDealStageChanged {
  from_stage_id?: string; // Previous stage (null = any)
  to_stage_id?: string; // New stage (null = any)
  pipeline_id?: string; // Filter by pipeline
}

export interface TriggerConfigDealWonLost {
  pipeline_id?: string; // Filter by pipeline
  min_value?: number; // Minimum deal value
}

export interface TriggerConfigFormSubmitted {
  landing_page_id?: string; // Specific landing page (null = any)
}

export interface TriggerConfigFeedbackReceived {
  widget_id?: string; // Specific feedback widget (null = any)
  min_rating?: number; // Minimum rating (1-5)
  max_rating?: number; // Maximum rating (1-5)
}

export interface TriggerConfigTaskCompleted {
  project_id?: string; // Filter by project
  priority_filter?: string[]; // Filter by priority
}

export interface TriggerConfigScheduled {
  cron_expression: string; // Cron expression
  timezone: string; // Timezone for cron
}

export interface TriggerConfigWebhook {
  require_signature: boolean;
  allowed_ips?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TriggerConfigManual {
  // No config needed for manual triggers
}

export type TriggerConfig =
  | TriggerConfigNewContact
  | TriggerConfigContactUpdated
  | TriggerConfigContactTagged
  | TriggerConfigDealCreated
  | TriggerConfigDealStageChanged
  | TriggerConfigDealWonLost
  | TriggerConfigFormSubmitted
  | TriggerConfigFeedbackReceived
  | TriggerConfigTaskCompleted
  | TriggerConfigScheduled
  | TriggerConfigWebhook
  | TriggerConfigManual;

// ============================================================================
// ACTION CONFIGURATIONS
// ============================================================================

export interface ActionConfigSendEmail {
  to: 'trigger_contact' | 'custom' | 'workspace_owner';
  custom_email?: string;
  subject: string;
  body: string; // Supports {{variable}} placeholders
  reply_to?: string;
}

export interface ActionConfigCreateTask {
  project_id?: string; // null = default project or inbox
  title: string; // Supports {{variable}} placeholders
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_in_days?: number; // Days from now
  assignee_id?: string;
}

export interface ActionConfigUpdateContact {
  fields: Record<string, string | number | boolean>; // Field name -> value (supports {{variable}})
}

export interface ActionConfigAddTag {
  tags: string[]; // Tags to add
}

export interface ActionConfigRemoveTag {
  tags: string[]; // Tags to remove
}

export interface ActionConfigMoveDeal {
  stage_id: string; // Target stage
}

export interface ActionConfigCreateDeal {
  name: string; // Supports {{variable}} placeholders
  pipeline_id: string;
  stage_id: string;
  value?: number;
  contact_field?: string; // Field from trigger data to link contact
}

export interface ActionConfigUpdateDeal {
  fields: Record<string, string | number | boolean>;
}

export interface ActionConfigWebhook {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: string; // JSON template with {{variable}} support
  timeout_seconds?: number;
}

export interface ActionConfigDelay {
  delay_seconds?: number;
  delay_minutes?: number;
  delay_hours?: number;
  delay_days?: number;
}

export interface ActionConfigCondition {
  field: string; // Field to check from trigger data
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: string | number | boolean;
}

export type ActionConfig =
  | ActionConfigSendEmail
  | ActionConfigCreateTask
  | ActionConfigUpdateContact
  | ActionConfigAddTag
  | ActionConfigRemoveTag
  | ActionConfigMoveDeal
  | ActionConfigCreateDeal
  | ActionConfigUpdateDeal
  | ActionConfigWebhook
  | ActionConfigDelay
  | ActionConfigCondition;

// ============================================================================
// FILTER CONDITIONS
// ============================================================================

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in';
  value: string | number | boolean | string[] | number[];
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface Automation {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  trigger_type: AutomationTriggerType;
  trigger_config: TriggerConfig;
  filter_conditions: FilterCondition[];
  run_limit: number | null;
  cooldown_seconds: number;
  last_run_at: string | null;
  run_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  id: string;
  automation_id: string;
  action_type: AutomationActionType;
  action_config: ActionConfig;
  position: number;
  parent_action_id: string | null;
  branch_condition: string | null; // 'true' | 'false' for condition branches
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  workspace_id: string;
  status: AutomationRunStatus;
  trigger_type: AutomationTriggerType;
  trigger_data: Record<string, unknown>;
  actions_executed: number;
  actions_failed: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AutomationRunLog {
  id: string;
  run_id: string;
  action_id: string | null;
  level: AutomationLogLevel;
  message: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AutomationSchedule {
  id: string;
  automation_id: string;
  cron_expression: string;
  timezone: string;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationWebhook {
  id: string;
  automation_id: string;
  workspace_id: string;
  webhook_key: string;
  secret_key: string;
  allowed_ips: string[] | null;
  require_signature: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export interface AutomationWithActions extends Automation {
  actions: AutomationAction[];
}

export interface AutomationWithRelations extends Automation {
  actions: AutomationAction[];
  schedule?: AutomationSchedule | null;
  webhook?: AutomationWebhook | null;
  recent_runs?: AutomationRun[];
}

export interface AutomationRunWithLogs extends AutomationRun {
  logs: AutomationRunLog[];
  automation?: Pick<Automation, 'id' | 'name'>;
}

// ============================================================================
// INPUT TYPES (for API)
// ============================================================================

export interface CreateAutomationInput {
  name: string;
  description?: string;
  trigger_type: AutomationTriggerType;
  trigger_config: TriggerConfig;
  filter_conditions?: FilterCondition[];
  run_limit?: number | null;
  cooldown_seconds?: number;
  status?: AutomationStatus;
}

export interface UpdateAutomationInput {
  name?: string;
  description?: string | null;
  trigger_type?: AutomationTriggerType;
  trigger_config?: TriggerConfig;
  filter_conditions?: FilterCondition[];
  run_limit?: number | null;
  cooldown_seconds?: number;
  status?: AutomationStatus;
}

export interface CreateAutomationActionInput {
  action_type: AutomationActionType;
  action_config: ActionConfig;
  position: number;
  parent_action_id?: string | null;
  branch_condition?: string | null;
}

export interface UpdateAutomationActionInput {
  action_type?: AutomationActionType;
  action_config?: ActionConfig;
  position?: number;
  parent_action_id?: string | null;
  branch_condition?: string | null;
}

// ============================================================================
// TRIGGER DATA TYPES (passed to automation execution)
// ============================================================================

export interface TriggerDataContact {
  contact_id: string;
  email: string;
  name?: string;
  company?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface TriggerDataDeal {
  deal_id: string;
  name: string;
  value: number;
  stage_id: string;
  stage_name?: string;
  previous_stage_id?: string;
  contact_id?: string;
  [key: string]: unknown;
}

export interface TriggerDataForm {
  landing_page_id: string;
  lead_id: string;
  email: string;
  name?: string;
  form_data: Record<string, unknown>;
}

export interface TriggerDataFeedback {
  widget_id: string;
  submission_id: string;
  rating?: number;
  message?: string;
  email?: string;
}

export interface TriggerDataTask {
  task_id: string;
  title: string;
  project_id?: string;
  priority?: string;
  status?: string;
}

export interface TriggerDataScheduled {
  scheduled_time: string;
  cron_expression: string;
}

export interface TriggerDataWebhook {
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
}

export interface TriggerDataManual {
  triggered_by: string;
  custom_data?: Record<string, unknown>;
}

export type TriggerData =
  | TriggerDataContact
  | TriggerDataDeal
  | TriggerDataForm
  | TriggerDataFeedback
  | TriggerDataTask
  | TriggerDataScheduled
  | TriggerDataWebhook
  | TriggerDataManual;

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export interface TriggerTypeInfo {
  type: AutomationTriggerType;
  label: string;
  description: string;
  icon: string;
  category: 'contacts' | 'deals' | 'content' | 'projects' | 'system';
  configFields: string[];
}

export interface ActionTypeInfo {
  type: AutomationActionType;
  label: string;
  description: string;
  icon: string;
  category: 'communication' | 'data' | 'integration' | 'flow';
  configFields: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRIGGER_TYPES: TriggerTypeInfo[] = [
  { type: 'new_contact', label: 'New Contact', description: 'When a new contact is created', icon: 'UserPlus', category: 'contacts', configFields: ['source_filter', 'tag_filter'] },
  { type: 'contact_updated', label: 'Contact Updated', description: 'When a contact is modified', icon: 'UserCog', category: 'contacts', configFields: ['fields_to_watch'] },
  { type: 'contact_tagged', label: 'Contact Tagged', description: 'When a tag is added to a contact', icon: 'Tag', category: 'contacts', configFields: ['tags', 'match_mode'] },
  { type: 'deal_created', label: 'Deal Created', description: 'When a new deal is created', icon: 'Handshake', category: 'deals', configFields: ['pipeline_id', 'stage_id', 'min_value'] },
  { type: 'deal_stage_changed', label: 'Deal Stage Changed', description: 'When a deal moves to a different stage', icon: 'ArrowRightLeft', category: 'deals', configFields: ['from_stage_id', 'to_stage_id', 'pipeline_id'] },
  { type: 'deal_won', label: 'Deal Won', description: 'When a deal is marked as won', icon: 'Trophy', category: 'deals', configFields: ['pipeline_id', 'min_value'] },
  { type: 'deal_lost', label: 'Deal Lost', description: 'When a deal is marked as lost', icon: 'XCircle', category: 'deals', configFields: ['pipeline_id', 'min_value'] },
  { type: 'form_submitted', label: 'Form Submitted', description: 'When a landing page form is submitted', icon: 'FileInput', category: 'content', configFields: ['landing_page_id'] },
  { type: 'feedback_received', label: 'Feedback Received', description: 'When feedback is submitted', icon: 'MessageSquare', category: 'content', configFields: ['widget_id', 'min_rating', 'max_rating'] },
  { type: 'task_completed', label: 'Task Completed', description: 'When a task is marked complete', icon: 'CheckSquare', category: 'projects', configFields: ['project_id', 'priority_filter'] },
  { type: 'task_created', label: 'Task Created', description: 'When a new task is created', icon: 'ListPlus', category: 'projects', configFields: ['project_id'] },
  { type: 'scheduled', label: 'Scheduled', description: 'Run on a schedule (cron)', icon: 'Clock', category: 'system', configFields: ['cron_expression', 'timezone'] },
  { type: 'webhook', label: 'Webhook', description: 'Triggered by external webhook', icon: 'Webhook', category: 'system', configFields: ['require_signature', 'allowed_ips'] },
  { type: 'manual', label: 'Manual', description: 'Triggered manually by user', icon: 'Play', category: 'system', configFields: [] },
];

export const ACTION_TYPES: ActionTypeInfo[] = [
  { type: 'send_email', label: 'Send Email', description: 'Send an email notification', icon: 'Mail', category: 'communication', configFields: ['to', 'subject', 'body'] },
  { type: 'create_task', label: 'Create Task', description: 'Create a new project task', icon: 'ListPlus', category: 'data', configFields: ['title', 'project_id', 'priority', 'due_in_days'] },
  { type: 'update_contact', label: 'Update Contact', description: 'Update contact fields', icon: 'UserCog', category: 'data', configFields: ['fields'] },
  { type: 'add_tag', label: 'Add Tag', description: 'Add tags to a contact', icon: 'TagPlus', category: 'data', configFields: ['tags'] },
  { type: 'remove_tag', label: 'Remove Tag', description: 'Remove tags from a contact', icon: 'TagMinus', category: 'data', configFields: ['tags'] },
  { type: 'move_deal', label: 'Move Deal', description: 'Move a deal to a different stage', icon: 'ArrowRight', category: 'data', configFields: ['stage_id'] },
  { type: 'create_deal', label: 'Create Deal', description: 'Create a new deal', icon: 'Handshake', category: 'data', configFields: ['name', 'pipeline_id', 'stage_id', 'value'] },
  { type: 'update_deal', label: 'Update Deal', description: 'Update deal fields', icon: 'Pencil', category: 'data', configFields: ['fields'] },
  { type: 'webhook', label: 'Call Webhook', description: 'Send data to an external URL', icon: 'Webhook', category: 'integration', configFields: ['url', 'method', 'body_template'] },
  { type: 'delay', label: 'Delay', description: 'Wait before continuing', icon: 'Timer', category: 'flow', configFields: ['delay_minutes', 'delay_hours', 'delay_days'] },
  { type: 'condition', label: 'Condition', description: 'Branch based on a condition', icon: 'GitBranch', category: 'flow', configFields: ['field', 'operator', 'value'] },
];

export const AUTOMATION_STATUS_COLORS: Record<AutomationStatus, string> = {
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  draft: 'bg-gray-500',
  archived: 'bg-red-500',
};

export const AUTOMATION_STATUS_LABELS: Record<AutomationStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  draft: 'Draft',
  archived: 'Archived',
};

export const RUN_STATUS_COLORS: Record<AutomationRunStatus, string> = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-yellow-500',
};

export const RUN_STATUS_LABELS: Record<AutomationRunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTriggerTypeInfo(type: AutomationTriggerType): TriggerTypeInfo | undefined {
  return TRIGGER_TYPES.find((t) => t.type === type);
}

export function getActionTypeInfo(type: AutomationActionType): ActionTypeInfo | undefined {
  return ACTION_TYPES.find((a) => a.type === type);
}

export function formatRunDuration(durationMs: number | null): string {
  if (!durationMs) return '-';
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${(durationMs / 60000).toFixed(1)}m`;
}

export function getStatusColor(status: AutomationStatus): string {
  return AUTOMATION_STATUS_COLORS[status] || 'bg-gray-500';
}

export function getRunStatusColor(status: AutomationRunStatus): string {
  return RUN_STATUS_COLORS[status] || 'bg-gray-500';
}
