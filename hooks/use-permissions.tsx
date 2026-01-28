'use client';

import { useMemo } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import {
  Permission,
  ProductKey,
  hasPermission,
  roleHasPermission,
  getAssignableRoles,
  canModifyMember,
  canRemoveMember,
  getPermissionsForRole,
} from '@/lib/permissions';
import { WorkspaceRole } from '@/types/workspace';

// ============================================================================
// usePermissions Hook
// ============================================================================

interface UsePermissionsReturn {
  // Current user's role
  role: WorkspaceRole | null;
  
  // Permission checks
  can: (permission: Permission) => boolean;
  canAny: (...permissions: Permission[]) => boolean;
  canAll: (...permissions: Permission[]) => boolean;
  
  // Product access checks
  hasProductAccess: (product: ProductKey) => boolean;
  
  // Role-based checks
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isAtLeast: (role: WorkspaceRole) => boolean;
  
  // Team management checks
  canManageTeam: boolean;
  canInviteMembers: boolean;
  getAssignableRoles: () => WorkspaceRole[];
  canModifyMember: (targetRole: WorkspaceRole) => boolean;
  canRemoveMember: (targetRole: WorkspaceRole, isSelf: boolean) => boolean;
  
  // Common permission shortcuts
  canViewWorkspace: boolean;
  canEditWorkspace: boolean;
  canManageBilling: boolean;
  canDeleteWorkspace: boolean;
  
  // All permissions for current role
  permissions: Permission[];
}

export function usePermissions(): UsePermissionsReturn {
  const { currentWorkspace } = useWorkspace();
  
  const role = currentWorkspace?.role ?? null;
  const productPermissions = currentWorkspace?.permissions;

  return useMemo(() => {
    // Permission check function
    const can = (permission: Permission): boolean => {
      if (!role) return false;
      return hasPermission(role, permission, productPermissions);
    };

    // Check if user has any of the given permissions
    const canAny = (...permissions: Permission[]): boolean => {
      return permissions.some(can);
    };

    // Check if user has all of the given permissions
    const canAll = (...permissions: Permission[]): boolean => {
      return permissions.every(can);
    };

    // Check product access
    const hasProductAccess = (product: ProductKey): boolean => {
      if (!role) return false;
      if (role === 'owner' || role === 'admin') return true;
      return productPermissions?.[product] ?? true;
    };

    // Role checks
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin';
    const isEditor = role === 'editor';
    const isViewer = role === 'viewer';

    const isAtLeast = (targetRole: WorkspaceRole): boolean => {
      if (!role) return false;
      const hierarchy: Record<WorkspaceRole, number> = {
        owner: 4,
        admin: 3,
        editor: 2,
        viewer: 1,
      };
      return hierarchy[role] >= hierarchy[targetRole];
    };

    // Team management
    const canManageTeam = role === 'owner' || role === 'admin';
    const canInviteMembers = canManageTeam;

    const getAssignableRolesForUser = (): WorkspaceRole[] => {
      if (!role) return [];
      return getAssignableRoles(role);
    };

    const canModifyMemberCheck = (targetRole: WorkspaceRole): boolean => {
      if (!role) return false;
      return canModifyMember(role, targetRole);
    };

    const canRemoveMemberCheck = (
      targetRole: WorkspaceRole,
      isSelf: boolean
    ): boolean => {
      if (!role) return false;
      return canRemoveMember(role, targetRole, isSelf);
    };

    // Common shortcuts
    const canViewWorkspace = can('workspace.view');
    const canEditWorkspace = can('workspace.settings');
    const canManageBilling = can('workspace.billing');
    const canDeleteWorkspace = can('workspace.delete');

    // All permissions for current role
    const permissions = role ? getPermissionsForRole(role) : [];

    return {
      role,
      can,
      canAny,
      canAll,
      hasProductAccess,
      isOwner,
      isAdmin,
      isEditor,
      isViewer,
      isAtLeast,
      canManageTeam,
      canInviteMembers,
      getAssignableRoles: getAssignableRolesForUser,
      canModifyMember: canModifyMemberCheck,
      canRemoveMember: canRemoveMemberCheck,
      canViewWorkspace,
      canEditWorkspace,
      canManageBilling,
      canDeleteWorkspace,
      permissions,
    };
  }, [role, productPermissions]);
}

// ============================================================================
// useRequirePermission Hook
// Throws/redirects if user doesn't have required permission
// ============================================================================

interface UseRequirePermissionOptions {
  permission: Permission;
  redirectTo?: string;
}

export function useRequirePermission({
  permission,
}: UseRequirePermissionOptions): {
  hasPermission: boolean;
  isLoading: boolean;
} {
  const { currentWorkspace, isLoading } = useWorkspace();
  const { can } = usePermissions();

  const hasRequiredPermission = can(permission);

  return {
    hasPermission: hasRequiredPermission,
    isLoading: isLoading || !currentWorkspace,
  };
}

// ============================================================================
// PermissionGate Component
// Conditionally render children based on permission
// ============================================================================

interface PermissionGateProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  mode = 'any',
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions();

  const hasAccess = Array.isArray(permission)
    ? mode === 'all'
      ? canAll(...permission)
      : canAny(...permission)
    : can(permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// ProductGate Component
// Conditionally render children based on product access
// ============================================================================

interface ProductGateProps {
  product: ProductKey | ProductKey[];
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ProductGate({
  product,
  mode = 'any',
  fallback = null,
  children,
}: ProductGateProps) {
  const { hasProductAccess } = usePermissions();

  const products = Array.isArray(product) ? product : [product];
  
  const hasAccess =
    mode === 'all'
      ? products.every(hasProductAccess)
      : products.some(hasProductAccess);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
