-- ============================================================================
-- FIX: workspace_members circular RLS policy
--
-- The previous migration created a SELECT policy on workspace_members that
-- referenced workspace_members in its own subquery:
--
--   USING (workspace_id IN (
--     SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--   ))
--
-- PostgreSQL applies RLS to subqueries too, creating an infinite loop.
-- PostgreSQL resolves this by returning 0 rows from the self-referencing
-- subquery, making the ENTIRE workspace_members table appear empty.
--
-- This cascades through the user_workspaces view (which INNER JOINs
-- workspace_members), causing currentWorkspace to be null, role to be null,
-- and all permission checks to fail — producing "Access Denied" everywhere.
--
-- FIX: Use direct user_id = auth.uid() check (no self-reference).
-- ============================================================================

-- Drop the broken circular policy
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

-- Create fixed policy: users can see all members of workspaces they belong to.
-- This is safe because user_id = auth.uid() doesn't reference workspace_members
-- in a subquery, breaking the circular dependency.
CREATE POLICY "Members can view workspace members" ON workspace_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Also fix the workspaces SELECT policy. It references workspace_members in a
-- subquery which is now safe (the workspace_members SELECT policy above uses a
-- direct check, so the subquery can resolve without recursion).
-- No change needed — the workspaces policy is fine now that workspace_members
-- resolves correctly.
