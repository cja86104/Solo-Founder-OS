// ============================================================================
// Solo Founder OS - Workspace Types
// ============================================================================

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type WorkspacePlan = 'free' | 'pro' | 'lifetime';

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
  currency: string;
}

export interface WorkspacePlanLimits {
  landing_pages: number;
  contacts: number;
  page_views: number;
  vault_items: number;
  team_members: number;
}

export interface ProductPermissions {
  landing_pages: boolean;
  code_vault: boolean;
  crm: boolean;
  content: boolean;
  feedback: boolean;
  projects: boolean;
  command: boolean;
  advisor: boolean;
  analytics: boolean;
  automations: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  settings: WorkspaceSettings;
  plan: WorkspacePlan;
  plan_limits: WorkspacePlanLimits;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  permissions: ProductPermissions;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>;
  permissions: Partial<ProductPermissions>;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// Extended types with joined data
export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
  permissions: ProductPermissions;
  joined_at: string;
}

export interface WorkspaceMemberDetails extends WorkspaceMember {
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

// Form types
export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
  logo_url?: string | null;
  settings?: Partial<WorkspaceSettings>;
}

export interface InviteMemberInput {
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>;
  permissions?: Partial<ProductPermissions>;
}

export interface UpdateMemberInput {
  role?: Exclude<WorkspaceRole, 'owner'>;
  permissions?: Partial<ProductPermissions>;
}

// Permission helpers
export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  owner: 'Full access including billing and deletion',
  admin: 'Manage settings, members, and all products',
  editor: 'Create, edit, and delete content',
  viewer: 'View-only access to all content',
};

export const DEFAULT_PERMISSIONS: ProductPermissions = {
  landing_pages: true,
  code_vault: true,
  crm: true,
  content: true,
  feedback: true,
  projects: true,
  command: true,
  advisor: true,
  analytics: true,
  automations: true,
};

export const PLAN_LIMITS: Record<WorkspacePlan, WorkspacePlanLimits> = {
  free: {
    landing_pages: 3,
    contacts: 100,
    page_views: 1000,
    vault_items: 5,
    team_members: 0,
  },
  pro: {
    landing_pages: -1, // Unlimited
    contacts: 10000,
    page_views: 100000,
    vault_items: -1,
    team_members: 5,
  },
  lifetime: {
    landing_pages: -1,
    contacts: -1,
    page_views: -1,
    vault_items: -1,
    team_members: -1,
  },
};

// Utility functions
export function canManageMembers(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageSettings(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageBilling(role: WorkspaceRole): boolean {
  return role === 'owner';
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner';
}

export function canEditContent(role: WorkspaceRole): boolean {
  return role !== 'viewer';
}

export function hasHigherOrEqualRole(userRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

export function canAssignRole(userRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  // Users can only assign roles lower than their own
  // Owners can assign any role except owner
  if (userRole === 'owner') {
    return targetRole !== 'owner';
  }
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

export function formatLimit(limit: number): string {
  return isUnlimited(limit) ? 'Unlimited' : limit.toLocaleString();
}
