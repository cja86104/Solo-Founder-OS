'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Workspace,
  WorkspaceWithRole,
  WorkspaceRole,
  WorkspacePlan,
  ProductPermissions,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  PLAN_LIMITS,
  generateSlug,
  canManageMembers,
  canManageSettings,
  canManageBilling,
  canDeleteWorkspace,
  canEditContent,
} from '@/types/workspace';
import type { Database, Subscription, Json } from '@/types/database';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"];
type WorkspaceMemberInsert = Database["public"]["Tables"]["workspace_members"]["Insert"];
type WorkspaceUpdate = Database["public"]["Tables"]["workspaces"]["Update"];

// ============================================================================
// Context Types
// ============================================================================

interface WorkspaceContextValue {
  // State
  workspaces: WorkspaceWithRole[];
  currentWorkspace: WorkspaceWithRole | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace | null>;
  updateWorkspace: (id: string, input: UpdateWorkspaceInput) => Promise<boolean>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  switchWorkspace: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;

  // Permission checks
  canManageMembers: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canDeleteWorkspace: boolean;
  canEditContent: boolean;
  hasPermission: (product: keyof ProductPermissions) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ============================================================================
// Storage key for persisting selected workspace
// ============================================================================

const WORKSPACE_STORAGE_KEY = 'sfos_current_workspace';

function getStoredWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

function setStoredWorkspaceId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
}

// ============================================================================
// Provider Component
// ============================================================================

interface WorkspaceProviderProps {
  children: ReactNode;
  subscription?: Subscription | null;
}

export function WorkspaceProvider({ children, subscription }: WorkspaceProviderProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  // --------------------------------------------------------------------------
  // Fetch workspaces
  // --------------------------------------------------------------------------

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        return;
      }

      // Fetch this user's workspace memberships with joined workspace data.
      // We query workspace_members directly (with an explicit user_id filter)
      // instead of the user_workspaces view, because the view depends on RLS
      // resolving correctly on workspace_members — which can fail if the RLS
      // policy is self-referencing. The explicit .eq() filter works regardless.
      const { data: memberData, error: fetchError } = await supabase
        .from('workspace_members')
        .select('role, permissions, joined_at, workspaces(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Merge subscription plan data into workspace objects since the
      // workspaces table doesn't store plan info — it lives on subscriptions.
      const plan = (subscription?.plan as WorkspacePlan) || 'trial';
      const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;

      // Flatten the nested join result into the WorkspaceWithRole shape
      // (workspace columns at top level + role/permissions/joined_at).
      interface MemberDataRow {
        role: string;
        permissions: ProductPermissions | null;
        joined_at: string | null;
        workspaces: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          logo_url: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        } | null;
      }
      const workspaceList = ((memberData || []) as unknown as MemberDataRow[])
        .filter((m) => m.workspaces) // guard against orphaned memberships
        .map((m) => ({
          ...m.workspaces!,
          role: m.role as WorkspaceRole,
          permissions: m.permissions as ProductPermissions,
          joined_at: m.joined_at,
          plan,
          plan_limits: planLimits,
          stripe_customer_id: m.workspaces!.stripe_customer_id ?? subscription?.stripe_customer_id ?? null,
          stripe_subscription_id: m.workspaces!.stripe_subscription_id ?? subscription?.stripe_subscription_id ?? null,
        })) as WorkspaceWithRole[];
      // Auto-create a workspace if the user has none (handles the case where
      // the handle_new_user trigger failed or was skipped).
      if (workspaceList.length === 0) {
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'My';
        const slug =
          displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
          '-' +
          user.id.substring(0, 8);

        const newWorkspaceInsert: WorkspaceInsert = {
          name: `${displayName}'s Workspace`,
          slug,
          owner_id: user.id,
        };
        const { data: newWs, error: wsError } = await supabase
          .from('workspaces')
          .insert(newWorkspaceInsert)
          .select()
          .single();

        if (newWs && !wsError) {
          const memberInsert: WorkspaceMemberInsert = {
            workspace_id: newWs.id,
            user_id: user.id,
            role: 'owner',
            permissions: {
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
            },
          };
          await supabase.from('workspace_members').insert(memberInsert);

          workspaceList.push({
            ...newWs,
            role: 'owner' as WorkspaceRole,
            permissions: {
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
            },
            joined_at: new Date().toISOString(),
            plan,
            plan_limits: planLimits,
            stripe_customer_id: subscription?.stripe_customer_id ?? null,
            stripe_subscription_id: subscription?.stripe_subscription_id ?? null,
          } as unknown as WorkspaceWithRole);
        }
      }

      setWorkspaces(workspaceList);

      // Restore previously selected workspace or use first one
      const storedId = getStoredWorkspaceId();
      const restored = workspaceList.find(w => w.id === storedId);

      if (restored) {
        setCurrentWorkspace(restored);
      } else if (workspaceList.length > 0) {
        setCurrentWorkspace(workspaceList[0]);
        setStoredWorkspaceId(workspaceList[0].id);
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, subscription]);

  // Initial fetch
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // --------------------------------------------------------------------------
  // Create workspace
  // --------------------------------------------------------------------------

  const createWorkspaceAction = async (input: CreateWorkspaceInput): Promise<Workspace | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a workspace');
        return null;
      }

      // Generate slug if not provided
      const slug = input.slug || generateSlug(input.name);

      // Check if slug is available
      const { data: existing } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        toast.error('This workspace URL is already taken');
        return null;
      }

      // Create workspace
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: input.name,
          slug,
          owner_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create owner membership
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: user.id,
          role: 'owner',
          permissions: {
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
          },
        });

      if (memberError) {
        console.error('Error creating workspace membership:', memberError);
      }

      toast.success('Workspace created successfully');
      await fetchWorkspaces();

      // Switch to the new workspace
      const workspace = workspaces.find(w => w.id === newWorkspace.id);
      if (workspace) {
        setCurrentWorkspace(workspace);
        setStoredWorkspaceId(newWorkspace.id);
      }

      return newWorkspace as unknown as Workspace;
    } catch (err) {
      console.error('Error creating workspace:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create workspace');
      return null;
    }
  };

  // --------------------------------------------------------------------------
  // Update workspace
  // --------------------------------------------------------------------------

  const updateWorkspaceAction = async (id: string, input: UpdateWorkspaceInput): Promise<boolean> => {
    try {
      // Check slug availability if changing
      if (input.slug) {
        const { data: existing } = await supabase
          .from('workspaces')
          .select('id')
          .eq('slug', input.slug)
          .neq('id', id)
          .single();

        if (existing) {
          toast.error('This workspace URL is already taken');
          return false;
        }
      }

      const updateData: WorkspaceUpdate = {
        name: input.name,
        slug: input.slug,
        logo_url: input.logo_url,
        settings: input.settings ? (input.settings as unknown as Json) : undefined,
        updated_at: new Date().toISOString(),
      };
      const { error: updateError } = await supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Workspace updated successfully');
      await fetchWorkspaces();
      return true;
    } catch (err) {
      console.error('Error updating workspace:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update workspace');
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // Delete workspace
  // --------------------------------------------------------------------------

  const deleteWorkspaceAction = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Workspace deleted successfully');
      
      // Clear from storage if it was selected
      if (getStoredWorkspaceId() === id) {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }

      await fetchWorkspaces();
      router.push('/workspaces');
      return true;
    } catch (err) {
      console.error('Error deleting workspace:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete workspace');
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // Switch workspace
  // --------------------------------------------------------------------------

  const switchWorkspaceAction = (id: string) => {
    const workspace = workspaces.find(w => w.id === id);
    if (workspace) {
      setCurrentWorkspace(workspace);
      setStoredWorkspaceId(id);
      router.push('/dashboard');
    }
  };

  // --------------------------------------------------------------------------
  // Permission helpers
  // --------------------------------------------------------------------------

  const role = currentWorkspace?.role as WorkspaceRole | undefined;

  const hasPermission = (product: keyof ProductPermissions): boolean => {
    if (!currentWorkspace) return false;
    if (role === 'owner' || role === 'admin') return true;
    return currentWorkspace.permissions[product] ?? false;
  };

  // --------------------------------------------------------------------------
  // Context value
  // --------------------------------------------------------------------------

  const value: WorkspaceContextValue = {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    createWorkspace: createWorkspaceAction,
    updateWorkspace: updateWorkspaceAction,
    deleteWorkspace: deleteWorkspaceAction,
    switchWorkspace: switchWorkspaceAction,
    refreshWorkspaces: fetchWorkspaces,
    canManageMembers: role ? canManageMembers(role) : false,
    canManageSettings: role ? canManageSettings(role) : false,
    canManageBilling: role ? canManageBilling(role) : false,
    canDeleteWorkspace: role ? canDeleteWorkspace(role) : false,
    canEditContent: role ? canEditContent(role) : false,
    hasPermission,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

// Optional hook that doesn't throw (for conditional usage)
export function useWorkspaceOptional() {
  return useContext(WorkspaceContext);
}
