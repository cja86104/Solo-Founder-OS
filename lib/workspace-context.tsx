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
  ProductPermissions,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  generateSlug,
  canManageMembers,
  canManageSettings,
  canManageBilling,
  canDeleteWorkspace,
  canEditContent,
} from '@/types/workspace';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
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

      // Fetch workspaces with member role using the view
      const { data, error: fetchError } = await supabase
        .from('user_workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const workspaceList = (data || []) as WorkspaceWithRole[];
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
  }, [supabase]);

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

      // Use the helper function to create workspace with owner
      const { data: workspaceId, error: createError } = await supabase
        .rpc('create_workspace_with_owner', {
          p_name: input.name,
          p_slug: slug,
          p_owner_id: user.id,
        } as any);

      if (createError) throw createError;

      // Fetch the created workspace
      const { data: workspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (fetchError) throw fetchError;

      toast.success('Workspace created successfully');
      await fetchWorkspaces();

      // Switch to the new workspace
      const newWorkspace = workspaces.find(w => w.id === workspaceId);
      if (newWorkspace) {
        setCurrentWorkspace(newWorkspace);
        setStoredWorkspaceId(workspaceId);
      }

      return workspace;
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

      const { error: updateError } = await (supabase
        .from('workspaces') as any)
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
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
