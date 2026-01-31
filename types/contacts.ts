// ============================================================================
// Founders Helm - Contact Types
// Unified contact system across all products
// ============================================================================

export type ContactSource =
  | 'manual'
  | 'landing_page'
  | 'crm'
  | 'feedback'
  | 'import'
  | 'api'
  | 'form';

export type ContactStatus =
  | 'active'
  | 'unsubscribed'
  | 'bounced'
  | 'spam'
  | 'archived';

export interface Contact {
  id: string;
  workspace_id: string;
  
  // Core fields
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  
  // Source tracking
  source: ContactSource;
  source_id: string | null;
  source_url: string | null;
  
  // Organization
  tags: string[];
  lists: string[];
  
  // Status
  status: ContactStatus;
  
  // Engagement
  last_seen_at: string | null;
  last_contacted_at: string | null;
  total_visits: number;
  total_emails_sent: number;
  total_emails_opened: number;
  total_emails_clicked: number;
  
  // Custom data
  metadata: Record<string, unknown>;
  custom_fields: Record<string, unknown>;
  
  // External IDs
  stripe_customer_id: string | null;
  external_id: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  workspace_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactTag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
}

export interface ContactList {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  is_dynamic: boolean;
  filters: Record<string, unknown>;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ContactWithNotes extends Contact {
  notes: ContactNote[];
}

export interface ContactNoteWithUser extends ContactNote {
  user: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Form types
export interface CreateContactInput {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  source?: ContactSource;
  source_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateContactInput {
  email?: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  tags?: string[];
  lists?: string[];
  status?: ContactStatus;
  metadata?: Record<string, unknown>;
  custom_fields?: Record<string, unknown>;
}

export interface CreateContactNoteInput {
  content: string;
  is_pinned?: boolean;
}

export interface CreateContactTagInput {
  name: string;
  color?: string;
  description?: string;
}

export interface CreateContactListInput {
  name: string;
  description?: string;
  is_dynamic?: boolean;
  filters?: Record<string, unknown>;
}

// Filter types
export interface ContactFilters {
  search?: string;
  status?: ContactStatus | ContactStatus[];
  source?: ContactSource | ContactSource[];
  tags?: string[];
  lists?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  lastSeenAfter?: string;
  lastSeenBefore?: string;
}

export interface ContactSortOptions {
  field: 'name' | 'email' | 'company' | 'created_at' | 'updated_at' | 'last_seen_at';
  direction: 'asc' | 'desc';
}

export interface ContactPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Bulk action types
export type ContactBulkAction =
  | { type: 'add_tags'; tags: string[] }
  | { type: 'remove_tags'; tags: string[] }
  | { type: 'add_to_list'; listId: string }
  | { type: 'remove_from_list'; listId: string }
  | { type: 'update_status'; status: ContactStatus }
  | { type: 'delete' };

// Import types
export interface ContactImportRow {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  tags?: string;
  [key: string]: string | undefined;
}

export interface ContactImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; email: string; error: string }[];
}

// Export types
export type ContactExportFormat = 'csv' | 'json';

export interface ContactExportOptions {
  format: ContactExportFormat;
  filters?: ContactFilters;
  fields?: (keyof Contact)[];
  includeMetadata?: boolean;
}

// Stats types
export interface ContactStats {
  total: number;
  active: number;
  unsubscribed: number;
  bySource: Record<ContactSource, number>;
  byTag: { tag: string; count: number }[];
  recentlyAdded: number; // Last 7 days
  recentlyActive: number; // Last 30 days
}

// Utility functions
export function getContactDisplayName(contact: Contact): string {
  return contact.name || contact.email.split('@')[0];
}

export function getContactInitials(contact: Contact): string {
  const name = getContactDisplayName(contact);
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getSourceLabel(source: ContactSource): string {
  const labels: Record<ContactSource, string> = {
    manual: 'Manual Entry',
    landing_page: 'Landing Page',
    crm: 'CRM',
    feedback: 'Feedback Widget',
    import: 'Import',
    api: 'API',
    form: 'Form',
  };
  return labels[source];
}

export function getStatusColor(status: ContactStatus): string {
  const colors: Record<ContactStatus, string> = {
    active: 'bg-green-500',
    unsubscribed: 'bg-yellow-500',
    bounced: 'bg-red-500',
    spam: 'bg-red-700',
    archived: 'bg-gray-500',
  };
  return colors[status];
}

export function getStatusLabel(status: ContactStatus): string {
  const labels: Record<ContactStatus, string> = {
    active: 'Active',
    unsubscribed: 'Unsubscribed',
    bounced: 'Bounced',
    spam: 'Spam',
    archived: 'Archived',
  };
  return labels[status];
}

export function calculateEngagementScore(contact: Contact): number {
  let score = 0;
  
  // Base score for having contact info
  if (contact.name) score += 10;
  if (contact.phone) score += 10;
  if (contact.company) score += 10;
  
  // Engagement metrics
  score += Math.min(contact.total_visits * 2, 20);
  score += Math.min(contact.total_emails_opened * 5, 25);
  score += Math.min(contact.total_emails_clicked * 10, 25);
  
  // Recency bonus
  if (contact.last_seen_at) {
    const daysSinceLastSeen = Math.floor(
      (Date.now() - new Date(contact.last_seen_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastSeen < 7) score += 20;
    else if (daysSinceLastSeen < 30) score += 10;
  }
  
  return Math.min(score, 100);
}
