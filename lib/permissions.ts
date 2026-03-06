// ============================================================================
// Founders Helm - Permissions System
// Centralized permission checking and role-based access control
// ============================================================================

import {
  ROLE_HIERARCHY,
  type WorkspaceRole,
  type ProductPermissions,
} from '@/types/workspace';

// ============================================================================
// Permission Types
// ============================================================================

export type Permission =
  // Workspace permissions
  | 'workspace.view'
  | 'workspace.settings'
  | 'workspace.members'
  | 'workspace.billing'
  | 'workspace.delete'
  // Product permissions
  | 'landing_pages.view'
  | 'landing_pages.create'
  | 'landing_pages.edit'
  | 'landing_pages.delete'
  | 'code_vault.view'
  | 'code_vault.create'
  | 'code_vault.edit'
  | 'code_vault.delete'
  | 'crm.view'
  | 'crm.create'
  | 'crm.edit'
  | 'crm.delete'
  | 'content.view'
  | 'content.create'
  | 'content.edit'
  | 'content.delete'
  | 'feedback.view'
  | 'feedback.create'
  | 'feedback.edit'
  | 'feedback.delete'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'command.view'
  | 'advisor.view'
  | 'advisor.chat'
  | 'analytics.view'
  | 'automations.view'
  | 'automations.create'
  | 'automations.edit'
  | 'automations.delete';

export type ProductKey = keyof ProductPermissions;

// ============================================================================
// Role Permission Mappings
// ============================================================================

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    // Owners have all permissions
    'workspace.view',
    'workspace.settings',
    'workspace.members',
    'workspace.billing',
    'workspace.delete',
    'landing_pages.view',
    'landing_pages.create',
    'landing_pages.edit',
    'landing_pages.delete',
    'code_vault.view',
    'code_vault.create',
    'code_vault.edit',
    'code_vault.delete',
    'crm.view',
    'crm.create',
    'crm.edit',
    'crm.delete',
    'content.view',
    'content.create',
    'content.edit',
    'content.delete',
    'feedback.view',
    'feedback.create',
    'feedback.edit',
    'feedback.delete',
    'projects.view',
    'projects.create',
    'projects.edit',
    'projects.delete',
    'command.view',
    'advisor.view',
    'advisor.chat',
    'analytics.view',
    'automations.view',
    'automations.create',
    'automations.edit',
    'automations.delete',
  ],
  admin: [
    'workspace.view',
    'workspace.settings',
    'workspace.members',
    'landing_pages.view',
    'landing_pages.create',
    'landing_pages.edit',
    'landing_pages.delete',
    'code_vault.view',
    'code_vault.create',
    'code_vault.edit',
    'code_vault.delete',
    'crm.view',
    'crm.create',
    'crm.edit',
    'crm.delete',
    'content.view',
    'content.create',
    'content.edit',
    'content.delete',
    'feedback.view',
    'feedback.create',
    'feedback.edit',
    'feedback.delete',
    'projects.view',
    'projects.create',
    'projects.edit',
    'projects.delete',
    'command.view',
    'advisor.view',
    'advisor.chat',
    'analytics.view',
    'automations.view',
    'automations.create',
    'automations.edit',
    'automations.delete',
  ],
  editor: [
    'workspace.view',
    'landing_pages.view',
    'landing_pages.create',
    'landing_pages.edit',
    'code_vault.view',
    'code_vault.create',
    'code_vault.edit',
    'crm.view',
    'crm.create',
    'crm.edit',
    'content.view',
    'content.create',
    'content.edit',
    'feedback.view',
    'feedback.create',
    'feedback.edit',
    'projects.view',
    'projects.create',
    'projects.edit',
    'command.view',
    'advisor.view',
    'advisor.chat',
    'analytics.view',
    'automations.view',
  ],
  viewer: [
    'workspace.view',
    'landing_pages.view',
    'code_vault.view',
    'crm.view',
    'content.view',
    'feedback.view',
    'projects.view',
    'command.view',
    'advisor.view',
    'analytics.view',
    'automations.view',
  ],
};

// ============================================================================
// Permission Checking Functions
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(
  role: WorkspaceRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a user has a specific permission based on their role
 * and product-specific permissions override
 */
export function hasPermission(
  role: WorkspaceRole,
  permission: Permission,
  productPermissions?: ProductPermissions
): boolean {
  // Owners and admins always have full access
  if (role === 'owner' || role === 'admin') {
    return roleHasPermission(role, permission);
  }

  // Check if this is a product-specific permission
  const productKey = getProductKeyFromPermission(permission);
  
  if (productKey && productPermissions) {
    // If product access is explicitly disabled, deny
    if (productPermissions[productKey] === false) {
      return false;
    }
  }

  // Fall back to role-based permission
  return roleHasPermission(role, permission);
}

/**
 * Extract the product key from a permission string
 */
function getProductKeyFromPermission(permission: Permission): ProductKey | null {
  const productMap: Record<string, ProductKey> = {
    landing_pages: 'landing_pages',
    code_vault: 'code_vault',
    crm: 'crm',
    content: 'content',
    feedback: 'feedback',
    projects: 'projects',
    command: 'command',
    advisor: 'advisor',
    analytics: 'analytics',
    automations: 'automations',
  };

  const prefix = permission.split('.')[0];
  return productMap[prefix] || null;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: WorkspaceRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Check if one role is higher than another in the hierarchy
 */
export function isHigherRole(role1: WorkspaceRole, role2: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Check if one role is equal or higher than another
 */
export function isEqualOrHigherRole(role1: WorkspaceRole, role2: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
}

/**
 * Get assignable roles for a given role (roles they can assign to others)
 */
export function getAssignableRoles(role: WorkspaceRole): WorkspaceRole[] {
  switch (role) {
    case 'owner':
      return ['admin', 'editor', 'viewer'];
    case 'admin':
      return ['editor', 'viewer'];
    default:
      return [];
  }
}

/**
 * Check if a user can modify another user based on roles
 */
export function canModifyMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean {
  // Owners can modify anyone except other owners
  if (actorRole === 'owner') {
    return targetRole !== 'owner';
  }
  
  // Admins can modify editors and viewers
  if (actorRole === 'admin') {
    return targetRole === 'editor' || targetRole === 'viewer';
  }
  
  return false;
}

/**
 * Check if a user can remove a member
 */
export function canRemoveMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
  isSelf: boolean
): boolean {
  // Anyone can remove themselves (leave workspace), except owner
  if (isSelf && actorRole !== 'owner') {
    return true;
  }
  
  // Otherwise, check if they can modify
  return canModifyMember(actorRole, targetRole);
}

// ============================================================================
// Permission Groupings for UI
// ============================================================================

export interface PermissionGroup {
  name: string;
  description: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Workspace',
    description: 'Manage workspace settings and team',
    permissions: [
      'workspace.view',
      'workspace.settings',
      'workspace.members',
      'workspace.billing',
      'workspace.delete',
    ],
  },
  {
    name: 'Landing Pages',
    description: 'Create and manage landing pages',
    permissions: [
      'landing_pages.view',
      'landing_pages.create',
      'landing_pages.edit',
      'landing_pages.delete',
    ],
  },
  {
    name: 'Code Vault',
    description: 'Store and manage code snippets',
    permissions: [
      'code_vault.view',
      'code_vault.create',
      'code_vault.edit',
      'code_vault.delete',
    ],
  },
  {
    name: 'CRM',
    description: 'Manage contacts and deals',
    permissions: ['crm.view', 'crm.create', 'crm.edit', 'crm.delete'],
  },
  {
    name: 'Content',
    description: 'Create and schedule content',
    permissions: [
      'content.view',
      'content.create',
      'content.edit',
      'content.delete',
    ],
  },
  {
    name: 'Feedback',
    description: 'Collect and manage feedback',
    permissions: [
      'feedback.view',
      'feedback.create',
      'feedback.edit',
      'feedback.delete',
    ],
  },
  {
    name: 'Projects',
    description: 'Track projects and time',
    permissions: [
      'projects.view',
      'projects.create',
      'projects.edit',
      'projects.delete',
    ],
  },
  {
    name: 'Command Center',
    description: 'View business metrics',
    permissions: ['command.view'],
  },
  {
    name: 'AI Advisor',
    description: 'Get AI-powered insights',
    permissions: ['advisor.view', 'advisor.chat'],
  },
  {
    name: 'Insights',
    description: 'View business insights',
    permissions: ['analytics.view'],
  },
  {
    name: 'Automations',
    description: 'Create workflow automations',
    permissions: [
      'automations.view',
      'automations.create',
      'automations.edit',
      'automations.delete',
    ],
  },
];

/**
 * Get human-readable label for a permission
 */
export function getPermissionLabel(permission: Permission): string {
  const [, action] = permission.split('.');
  return action.charAt(0).toUpperCase() + action.slice(1);
}

/**
 * Get human-readable label for a product
 */
export function getProductLabel(product: ProductKey): string {
  const labels: Record<ProductKey, string> = {
    landing_pages: 'Landing Pages',
    code_vault: 'Code Vault',
    crm: 'CRM',
    content: 'Content Engine',
    feedback: 'Feedback Widget',
    projects: 'Project Tracker',
    command: 'Command Center',
    advisor: 'AI Advisor',
    analytics: 'Insights',
    automations: 'Automations',
  };
  return labels[product];
}
