'use client';

import { useCallback, useMemo } from 'react';
import { useWorkspace } from '@/lib/workspace-context';

export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

export type Permission = 
  | 'workspace.settings'
  | 'workspace.members'
  | 'workspace.billing'
  | 'workspace.export'
  | 'workspace.invite'
  | 'workspace.delete'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'products.view'
  | 'contacts.create'
  | 'contacts.update'
  | 'contacts.delete'
  | 'contacts.view'
  | 'deals.create'
  | 'deals.update'
  | 'deals.delete'
  | 'deals.view'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'content.view'
  | 'projects.create'
  | 'projects.update'
  | 'projects.delete'
  | 'projects.view'
  | 'feedback.view'
  | 'feedback.respond'
  | 'feedback.manage'
  | 'automations.view'
  | 'automations.create'
  | 'automations.update'
  | 'automations.delete';

export interface UsePermissionsReturn {
  role: Role | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
  canInvite: boolean;
  canInviteMembers: boolean;
  canExport: boolean;
  hasPermission: (permission: string) => boolean;
  can: (action: string, resource?: string) => boolean;
  getAssignableRoles: () => Role[];
  canModifyMember: (targetRole: Role) => boolean;
  canRemoveMember: (targetRole: Role, isSelf: boolean) => boolean;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: ['*'],
  admin: [
    'workspace.settings',
    'workspace.members',
    'workspace.billing',
    'workspace.export',
    'workspace.invite',
    'products.*',
    'contacts.*',
    'deals.*',
    'content.*',
    'projects.*',
    'feedback.*',
    'automations.*',
  ],
  editor: [
    'products.create',
    'products.update',
    'products.delete',
    'products.view',
    'contacts.create',
    'contacts.update',
    'contacts.view',
    'deals.create',
    'deals.update',
    'deals.view',
    'content.create',
    'content.update',
    'content.view',
    'projects.create',
    'projects.update',
    'projects.view',
    'feedback.view',
    'feedback.respond',
    'automations.view',
    'automations.create',
    'automations.update',
  ],
  viewer: [
    'products.view',
    'contacts.view',
    'deals.view',
    'content.view',
    'projects.view',
    'feedback.view',
    'automations.view',
  ],
};

export function usePermissions(): UsePermissionsReturn {
  const { currentWorkspace } = useWorkspace();
  const role = (currentWorkspace?.role as Role) || null;

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';
  const isViewer = role === 'viewer';

  const canEdit = useMemo(() => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.editor;
  }, [role]);

  const canDelete = useMemo(() => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
  }, [role]);

  const canManageMembers = useMemo(() => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
  }, [role]);

  const canManageSettings = useMemo(() => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
  }, [role]);

  const canManageTeam = useMemo(() => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
  }, [role]);

  const canManageBilling = useMemo(() => {
    return isOwner;
  }, [isOwner]);

  const canInvite = useMemo(() => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
  }, [role]);

  const canExport = useMemo(() => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
  }, [role]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!role) return false;
      const permissions = ROLE_PERMISSIONS[role];
      
      // Owner has all permissions
      if (permissions.includes('*')) return true;
      
      // Check exact match
      if (permissions.includes(permission)) return true;
      
      // Check wildcard match (e.g., 'products.*' matches 'products.create')
      const parts = permission.split('.');
      if (parts.length >= 2) {
        const wildcardPermission = `${parts[0]}.*`;
        if (permissions.includes(wildcardPermission)) return true;
      }
      
      return false;
    },
    [role]
  );

  // Convenience method: can('create', 'contacts') or can('contacts.create')
  const can = useCallback(
    (action: string, resource?: string): boolean => {
      if (resource) {
        return hasPermission(`${resource}.${action}`);
      }
      return hasPermission(action);
    },
    [hasPermission]
  );

  const canInviteMembers = canManageTeam;

  const getAssignableRoles = useCallback((): Role[] => {
    if (!role) return [];
    if (role === 'owner') return ['admin', 'editor', 'viewer'];
    if (role === 'admin') return ['editor', 'viewer'];
    return [];
  }, [role]);

  const canModifyMember = useCallback(
    (targetRole: Role): boolean => {
      if (!role) return false;
      return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[targetRole];
    },
    [role]
  );

  const canRemoveMember = useCallback(
    (targetRole: Role, isSelf: boolean): boolean => {
      if (!role) return false;
      if (isSelf && role !== 'owner') return true;
      return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[targetRole];
    },
    [role]
  );

  return {
    role,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    canEdit,
    canDelete,
    canManageMembers,
    canManageSettings,
    canManageTeam,
    canManageBilling,
    canInvite,
    canInviteMembers,
    canExport,
    hasPermission,
    can,
    getAssignableRoles,
    canModifyMember,
    canRemoveMember,
  };
}
