-- ============================================================================
-- FIX: user_workspaces view — SECURITY DEFINER → SECURITY INVOKER
--
-- Supabase lint flagged public.user_workspaces as a Security Definer View.
-- In PostgreSQL 15+, views without security_invoker = true default to running
-- with the view owner's privileges, bypassing RLS on the underlying tables.
--
-- Both workspaces and workspace_members have proper RLS policies. This view
-- should execute as the calling user so those policies are enforced.
--
-- Impact: Zero — no application code queries this view directly.
--         workspace-context.tsx queries workspace_members with explicit
--         .eq('user_id', user.id) instead of using this view.
--
-- Idempotent: DROP IF EXISTS + CREATE ensures safe re-runs.
-- ============================================================================

-- Drop the existing view (no dependents in app code or other DB objects)
DROP VIEW IF EXISTS public.user_workspaces;

-- Recreate with security_invoker = true so RLS is applied as the calling user
CREATE VIEW public.user_workspaces
WITH (security_invoker = true)
AS
SELECT
  w.*,
  wm.role,
  wm.permissions,
  wm.joined_at
FROM workspaces w
INNER JOIN workspace_members wm ON w.id = wm.workspace_id;

-- Grant SELECT to authenticated users (view is read-only, RLS handles filtering)
GRANT SELECT ON public.user_workspaces TO authenticated;

-- Explicitly revoke from anon — no anonymous access to workspace data
REVOKE ALL ON public.user_workspaces FROM anon;
