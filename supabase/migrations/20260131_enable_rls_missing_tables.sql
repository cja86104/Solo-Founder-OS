-- ============================================================================
-- Enable Row Level Security on 12 Tables Missing RLS
-- Fully idempotent: safe to run multiple times
-- ============================================================================

-- ============================================================================
-- 1. WORKSPACES
-- ============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view workspaces they belong to
DROP POLICY IF EXISTS "Members can view their workspaces" ON workspaces;
CREATE POLICY "Members can view their workspaces" ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Any authenticated user can create a workspace
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON workspaces;
CREATE POLICY "Authenticated users can create workspaces" ON workspaces
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only owner or admin members
DROP POLICY IF EXISTS "Owners and admins can update workspaces" ON workspaces;
CREATE POLICY "Owners and admins can update workspaces" ON workspaces
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- DELETE: Only owner
DROP POLICY IF EXISTS "Only owners can delete workspaces" ON workspaces;
CREATE POLICY "Only owners can delete workspaces" ON workspaces
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- 2. WORKSPACE_MEMBERS
-- ============================================================================

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view members of workspaces they belong to
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
CREATE POLICY "Members can view workspace members" ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Admins/owners can add members
DROP POLICY IF EXISTS "Admins and owners can add members" ON workspace_members;
CREATE POLICY "Admins and owners can add members" ON workspace_members
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- UPDATE: Admins/owners can update members
DROP POLICY IF EXISTS "Admins and owners can update members" ON workspace_members;
CREATE POLICY "Admins and owners can update members" ON workspace_members
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- DELETE: Admins/owners can remove members. Users can remove themselves.
DROP POLICY IF EXISTS "Admins owners or self can remove members" ON workspace_members;
CREATE POLICY "Admins owners or self can remove members" ON workspace_members
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 3. LANDING_PAGES
-- ============================================================================

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view landing pages in their workspaces
DROP POLICY IF EXISTS "Members can view landing pages" ON landing_pages;
CREATE POLICY "Members can view landing pages" ON landing_pages
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Editors+ can create
DROP POLICY IF EXISTS "Editors and above can create landing pages" ON landing_pages;
CREATE POLICY "Editors and above can create landing pages" ON landing_pages
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- UPDATE: Editors+ can update
DROP POLICY IF EXISTS "Editors and above can update landing pages" ON landing_pages;
CREATE POLICY "Editors and above can update landing pages" ON landing_pages
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: Admins+ can delete
DROP POLICY IF EXISTS "Admins and above can delete landing pages" ON landing_pages;
CREATE POLICY "Admins and above can delete landing pages" ON landing_pages
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 4. LANDING_PAGE_LEADS
-- ============================================================================

ALTER TABLE landing_page_leads ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view leads in their workspaces
DROP POLICY IF EXISTS "Members can view landing page leads" ON landing_page_leads;
CREATE POLICY "Members can view landing page leads" ON landing_page_leads
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Anyone can insert (leads come from public landing pages)
DROP POLICY IF EXISTS "Anyone can insert landing page leads" ON landing_page_leads;
CREATE POLICY "Anyone can insert landing page leads" ON landing_page_leads
  FOR INSERT
  WITH CHECK (true);

-- DELETE: Admins+ can delete
DROP POLICY IF EXISTS "Admins and above can delete landing page leads" ON landing_page_leads;
CREATE POLICY "Admins and above can delete landing page leads" ON landing_page_leads
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 5. LANDING_PAGE_ANALYTICS
-- ============================================================================

ALTER TABLE landing_page_analytics ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view analytics for pages in their workspaces (join through landing_pages)
DROP POLICY IF EXISTS "Members can view landing page analytics" ON landing_page_analytics;
CREATE POLICY "Members can view landing page analytics" ON landing_page_analytics
  FOR SELECT
  USING (
    page_id IN (
      SELECT lp.id FROM landing_pages lp
      WHERE lp.workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Anyone can insert (analytics events from public pages)
DROP POLICY IF EXISTS "Anyone can insert landing page analytics" ON landing_page_analytics;
CREATE POLICY "Anyone can insert landing page analytics" ON landing_page_analytics
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 6. VAULT_COLLECTIONS
-- ============================================================================

ALTER TABLE vault_collections ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view collections in their workspaces
DROP POLICY IF EXISTS "Members can view vault collections" ON vault_collections;
CREATE POLICY "Members can view vault collections" ON vault_collections
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Members can create collections
DROP POLICY IF EXISTS "Members can create vault collections" ON vault_collections;
CREATE POLICY "Members can create vault collections" ON vault_collections
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Owner of collection can update
DROP POLICY IF EXISTS "Collection owners can update vault collections" ON vault_collections;
CREATE POLICY "Collection owners can update vault collections" ON vault_collections
  FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Owner of collection can delete
DROP POLICY IF EXISTS "Collection owners can delete vault collections" ON vault_collections;
CREATE POLICY "Collection owners can delete vault collections" ON vault_collections
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 7. VAULT_ITEMS
-- ============================================================================

ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view items in their workspaces
DROP POLICY IF EXISTS "Members can view vault items" ON vault_items;
CREATE POLICY "Members can view vault items" ON vault_items
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Members can create items
DROP POLICY IF EXISTS "Members can create vault items" ON vault_items;
CREATE POLICY "Members can create vault items" ON vault_items
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Owner of item can update
DROP POLICY IF EXISTS "Item owners can update vault items" ON vault_items;
CREATE POLICY "Item owners can update vault items" ON vault_items
  FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Owner of item can delete
DROP POLICY IF EXISTS "Item owners can delete vault items" ON vault_items;
CREATE POLICY "Item owners can delete vault items" ON vault_items
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 8. CONTENT_POSTS
-- ============================================================================

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view posts in their workspaces
DROP POLICY IF EXISTS "Members can view content posts" ON content_posts;
CREATE POLICY "Members can view content posts" ON content_posts
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Editors+ can create
DROP POLICY IF EXISTS "Editors and above can create content posts" ON content_posts;
CREATE POLICY "Editors and above can create content posts" ON content_posts
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- UPDATE: Editors+ can update
DROP POLICY IF EXISTS "Editors and above can update content posts" ON content_posts;
CREATE POLICY "Editors and above can update content posts" ON content_posts
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: Admins+ can delete
DROP POLICY IF EXISTS "Admins and above can delete content posts" ON content_posts;
CREATE POLICY "Admins and above can delete content posts" ON content_posts
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 9. PROJECTS
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view projects in their workspaces
DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Members can view projects" ON projects
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Editors+ can create
DROP POLICY IF EXISTS "Editors and above can create projects" ON projects;
CREATE POLICY "Editors and above can create projects" ON projects
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- UPDATE: Editors+ can update
DROP POLICY IF EXISTS "Editors and above can update projects" ON projects;
CREATE POLICY "Editors and above can update projects" ON projects
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: Admins+ can delete
DROP POLICY IF EXISTS "Admins and above can delete projects" ON projects;
CREATE POLICY "Admins and above can delete projects" ON projects
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 10. TASKS
-- ============================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view tasks in their workspaces
DROP POLICY IF EXISTS "Members can view tasks" ON tasks;
CREATE POLICY "Members can view tasks" ON tasks
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Members can create tasks
DROP POLICY IF EXISTS "Members can create tasks" ON tasks;
CREATE POLICY "Members can create tasks" ON tasks
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Members can update tasks in their workspaces
DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
CREATE POLICY "Members can update tasks" ON tasks
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- DELETE: Owner of task or admins can delete
DROP POLICY IF EXISTS "Task owners or admins can delete tasks" ON tasks;
CREATE POLICY "Task owners or admins can delete tasks" ON tasks
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 11. TIME_ENTRIES
-- ============================================================================

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view time entries in their workspaces
DROP POLICY IF EXISTS "Members can view time entries" ON time_entries;
CREATE POLICY "Members can view time entries" ON time_entries
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Members can create time entries
DROP POLICY IF EXISTS "Members can create time entries" ON time_entries;
CREATE POLICY "Members can create time entries" ON time_entries
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Owner of entry can update
DROP POLICY IF EXISTS "Entry owners can update time entries" ON time_entries;
CREATE POLICY "Entry owners can update time entries" ON time_entries
  FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Owner of entry can delete
DROP POLICY IF EXISTS "Entry owners can delete time entries" ON time_entries;
CREATE POLICY "Entry owners can delete time entries" ON time_entries
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 12. ACTIVITIES
-- ============================================================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view activities in their workspaces
DROP POLICY IF EXISTS "Members can view activities" ON activities;
CREATE POLICY "Members can view activities" ON activities
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: System can insert
DROP POLICY IF EXISTS "System can insert activities" ON activities;
CREATE POLICY "System can insert activities" ON activities
  FOR INSERT
  WITH CHECK (true);
