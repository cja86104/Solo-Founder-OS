// ============================================================================
// Solo Founder OS - Activity & Audit Types
// ============================================================================

export type ActorType = 'user' | 'system' | 'api' | 'automation';

export type ActivityCategory =
  | 'general'
  | 'auth'
  | 'billing'
  | 'contacts'
  | 'landing_pages'
  | 'code_vault'
  | 'crm'
  | 'content'
  | 'feedback'
  | 'projects'
  | 'analytics'
  | 'automations'
  | 'settings';

export type AuditEventCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'settings_change'
  | 'billing'
  | 'security';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface Activity {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  actor_type: ActorType;
  action: string;
  type: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  contact_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  changes: Record<string, { old: unknown; new: unknown }>;
  is_public: boolean;
  is_system: boolean;
  category: ActivityCategory;
  created_at: string;
}

export interface ActivityWithActor extends Activity {
  actor?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
}

export interface AuditLog {
  id: string;
  workspace_id: string | null;
  user_id: string | null;
  user_email: string | null;
  event_type: string;
  event_category: AuditEventCategory;
  resource_type: string | null;
  resource_id: string | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  severity: AuditSeverity;
  created_at: string;
}

// Input types
export interface CreateActivityInput {
  workspace_id: string;
  actor_id?: string;
  actor_type?: ActorType;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  contact_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  category?: ActivityCategory;
  is_system?: boolean;
}

export interface CreateAuditLogInput {
  workspace_id?: string;
  user_id?: string;
  user_email?: string;
  event_type: string;
  event_category: AuditEventCategory;
  description: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  severity?: AuditSeverity;
}

// Filter types
export interface ActivityFilters {
  category?: ActivityCategory | ActivityCategory[];
  resource_type?: string;
  actor_id?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditLogFilters {
  event_category?: AuditEventCategory | AuditEventCategory[];
  event_type?: string;
  user_id?: string;
  severity?: AuditSeverity | AuditSeverity[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Utility functions
export function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    created: '➕',
    updated: '✏️',
    deleted: '🗑️',
    published: '🚀',
    unpublished: '📥',
    sent: '📤',
    joined: '👋',
    left: '👋',
    role_changed: '🔄',
    logged_in: '🔐',
    logged_out: '🚪',
    exported: '📦',
    imported: '📥',
  };
  return icons[action] || '📌';
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    published: 'Published',
    unpublished: 'Unpublished',
    sent: 'Sent',
    joined: 'Joined',
    left: 'Left',
    role_changed: 'Role Changed',
    logged_in: 'Logged In',
    logged_out: 'Logged Out',
    exported: 'Exported',
    imported: 'Imported',
  };
  return labels[action] || action.charAt(0).toUpperCase() + action.slice(1);
}

export function getCategoryIcon(category: ActivityCategory): string {
  const icons: Record<ActivityCategory, string> = {
    general: '📌',
    auth: '🔐',
    billing: '💳',
    contacts: '👥',
    landing_pages: '📄',
    code_vault: '💾',
    crm: '🤝',
    content: '📝',
    feedback: '💬',
    projects: '📁',
    analytics: '📊',
    automations: '⚡',
    settings: '⚙️',
  };
  return icons[category];
}

export function getCategoryLabel(category: ActivityCategory): string {
  const labels: Record<ActivityCategory, string> = {
    general: 'General',
    auth: 'Authentication',
    billing: 'Billing',
    contacts: 'Contacts',
    landing_pages: 'Landing Pages',
    code_vault: 'Code Vault',
    crm: 'CRM',
    content: 'Content',
    feedback: 'Feedback',
    projects: 'Projects',
    analytics: 'Analytics',
    automations: 'Automations',
    settings: 'Settings',
  };
  return labels[category];
}

export function getCategoryColor(category: ActivityCategory): string {
  const colors: Record<ActivityCategory, string> = {
    general: 'bg-gray-500',
    auth: 'bg-purple-500',
    billing: 'bg-green-500',
    contacts: 'bg-blue-500',
    landing_pages: 'bg-orange-500',
    code_vault: 'bg-indigo-500',
    crm: 'bg-pink-500',
    content: 'bg-yellow-500',
    feedback: 'bg-teal-500',
    projects: 'bg-red-500',
    analytics: 'bg-cyan-500',
    automations: 'bg-violet-500',
    settings: 'bg-slate-500',
  };
  return colors[category];
}

export function getSeverityColor(severity: AuditSeverity): string {
  const colors: Record<AuditSeverity, string> = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  };
  return colors[severity];
}

export function formatResourceType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
