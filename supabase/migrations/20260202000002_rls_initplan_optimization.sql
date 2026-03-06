-- ============================================================================
-- RLS INITPLAN OPTIMIZATION
-- Fixes Supabase Lint: auth_rls_initplan (114 warnings across 40 tables)
--
-- Problem: Calling auth.uid() directly in RLS policies causes PostgreSQL to
-- re-evaluate the function for every row. Wrapping in (select auth.uid())
-- converts it to an InitPlan subquery evaluated once per statement.
--
-- Risk: ZERO functional change. Pure performance optimization.
-- Approach: DROP IF EXISTS + CREATE for each policy (fully idempotent).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ACTIVITIES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view activities" ON activities;
CREATE POLICY "Members can view activities" ON activities
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

-- "System can insert activities" uses WITH CHECK (true) — no auth.uid(), skip.

-- ============================================================================
-- 2. ADVISOR_CONVERSATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can view their own advisor conversations"
  ON advisor_conversations FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can create advisor conversations"
  ON advisor_conversations FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can update their own advisor conversations"
  ON advisor_conversations FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can delete their own advisor conversations"
  ON advisor_conversations FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 3. ADVISOR_MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON advisor_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON advisor_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM advisor_conversations WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON advisor_messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON advisor_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM advisor_conversations WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 4. ADVISOR_SUGGESTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view advisor suggestions" ON advisor_suggestions;
CREATE POLICY "Members can view advisor suggestions"
  ON advisor_suggestions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can manage advisor suggestions" ON advisor_suggestions;
CREATE POLICY "Members can manage advisor suggestions"
  ON advisor_suggestions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 5. AUTOMATION_ACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view automation actions" ON automation_actions;
CREATE POLICY "Members can view automation actions"
  ON automation_actions FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Editors can manage automation actions" ON automation_actions;
CREATE POLICY "Editors can manage automation actions"
  ON automation_actions FOR ALL
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = (select auth.uid())
        AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- ============================================================================
-- 6. AUTOMATION_RUN_LOGS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view automation run logs" ON automation_run_logs;
CREATE POLICY "Members can view automation run logs"
  ON automation_run_logs FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM automation_runs WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
      )
    )
  );

-- "System can insert automation run logs" uses WITH CHECK (true) — skip.

-- ============================================================================
-- 7. AUTOMATION_RUNS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view automation runs" ON automation_runs;
CREATE POLICY "Members can view automation runs"
  ON automation_runs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

-- "System can insert/update automation runs" uses WITH CHECK/USING (true) — skip.

-- ============================================================================
-- 8. AUTOMATION_SCHEDULES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view automation schedules" ON automation_schedules;
CREATE POLICY "Members can view automation schedules"
  ON automation_schedules FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Editors can manage automation schedules" ON automation_schedules;
CREATE POLICY "Editors can manage automation schedules"
  ON automation_schedules FOR ALL
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = (select auth.uid())
        AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- ============================================================================
-- 9. AUTOMATION_WEBHOOKS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view automation webhooks" ON automation_webhooks;
CREATE POLICY "Members can view automation webhooks"
  ON automation_webhooks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can manage automation webhooks" ON automation_webhooks;
CREATE POLICY "Editors can manage automation webhooks"
  ON automation_webhooks FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================================================
-- 10. AUTOMATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view automations in their workspaces" ON automations;
CREATE POLICY "Members can view automations in their workspaces"
  ON automations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can create automations" ON automations;
CREATE POLICY "Editors can create automations"
  ON automations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update automations" ON automations;
CREATE POLICY "Editors can update automations"
  ON automations FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete automations" ON automations;
CREATE POLICY "Admins can delete automations"
  ON automations FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 11. CONTACTS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view contacts in their workspaces" ON contacts;
CREATE POLICY "Members can view contacts in their workspaces"
  ON contacts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can create contacts" ON contacts;
CREATE POLICY "Editors can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update contacts" ON contacts;
CREATE POLICY "Editors can update contacts"
  ON contacts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete contacts" ON contacts;
CREATE POLICY "Admins can delete contacts"
  ON contacts FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 12. CONTENT_ENGAGEMENT
-- ============================================================================

DROP POLICY IF EXISTS "Users can view engagement for their workspace posts" ON content_engagement;
CREATE POLICY "Users can view engagement for their workspace posts"
  ON content_engagement FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_posts cp
      JOIN workspace_members wm ON cp.workspace_id = wm.workspace_id
      WHERE cp.id = content_engagement.post_id
      AND wm.user_id = (select auth.uid())
    )
  );

-- "Users can track engagement" / "Users can update engagement" use true — skip.

-- ============================================================================
-- 13. CONTENT_POSTS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view content posts" ON content_posts;
CREATE POLICY "Members can view content posts" ON content_posts
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors and above can create content posts" ON content_posts;
CREATE POLICY "Editors and above can create content posts" ON content_posts
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors and above can update content posts" ON content_posts;
CREATE POLICY "Editors and above can update content posts" ON content_posts
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and above can delete content posts" ON content_posts;
CREATE POLICY "Admins and above can delete content posts" ON content_posts
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 14. CUSTOMERS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view customers" ON customers;
CREATE POLICY "Members can view customers" ON customers
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage customers" ON customers;
CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 15. DEAL_ACTIVITIES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view deal activities in their workspaces" ON deal_activities;
CREATE POLICY "Members can view deal activities in their workspaces"
  ON deal_activities FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can create deal activities" ON deal_activities;
CREATE POLICY "Editors can create deal activities"
  ON deal_activities FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can update their own deal activities" ON deal_activities;
CREATE POLICY "Users can update their own deal activities"
  ON deal_activities FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own deal activities" ON deal_activities;
CREATE POLICY "Users can delete their own deal activities"
  ON deal_activities FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 16. DEALS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view deals in their workspaces" ON deals;
CREATE POLICY "Members can view deals in their workspaces"
  ON deals FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can create deals" ON deals;
CREATE POLICY "Editors can create deals"
  ON deals FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update deals" ON deals;
CREATE POLICY "Editors can update deals"
  ON deals FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete deals" ON deals;
CREATE POLICY "Admins can delete deals"
  ON deals FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 17. FEEDBACK_SUBMISSIONS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view feedback submissions in their workspaces" ON feedback_submissions;
CREATE POLICY "Members can view feedback submissions in their workspaces"
  ON feedback_submissions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

-- "Anyone can submit feedback via widget" uses WITH CHECK (true) — skip.

DROP POLICY IF EXISTS "Editors can update feedback submissions" ON feedback_submissions;
CREATE POLICY "Editors can update feedback submissions"
  ON feedback_submissions FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete feedback submissions" ON feedback_submissions;
CREATE POLICY "Admins can delete feedback submissions"
  ON feedback_submissions FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 18. FEEDBACK_WIDGETS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view feedback widgets in their workspaces" ON feedback_widgets;
CREATE POLICY "Members can view feedback widgets in their workspaces"
  ON feedback_widgets FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can create feedback widgets" ON feedback_widgets;
CREATE POLICY "Editors can create feedback widgets"
  ON feedback_widgets FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update feedback widgets" ON feedback_widgets;
CREATE POLICY "Editors can update feedback widgets"
  ON feedback_widgets FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete feedback widgets" ON feedback_widgets;
CREATE POLICY "Admins can delete feedback widgets"
  ON feedback_widgets FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 19. INVOICE_ACTIVITIES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view activities" ON invoice_activities;
CREATE POLICY "Members can view activities"
  ON invoice_activities FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

-- "System can insert activities" uses WITH CHECK (true) — skip.

-- ============================================================================
-- 20. INVOICE_ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view invoice items" ON invoice_items;
CREATE POLICY "Members can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can manage invoice items" ON invoice_items;
CREATE POLICY "Members can manage invoice items"
  ON invoice_items FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================================================
-- 21. INVOICE_PAYMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view payments" ON invoice_payments;
CREATE POLICY "Members can view payments"
  ON invoice_payments FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can manage payments" ON invoice_payments;
CREATE POLICY "Members can manage payments"
  ON invoice_payments FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================================================
-- 22. INVOICES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view invoices in their workspaces" ON invoices;
CREATE POLICY "Members can view invoices in their workspaces"
  ON invoices FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
    OR public_token IS NOT NULL
  );

DROP POLICY IF EXISTS "Members can create invoices" ON invoices;
CREATE POLICY "Members can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Members can update invoices" ON invoices;
CREATE POLICY "Members can update invoices"
  ON invoices FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete invoices" ON invoices;
CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 23. LANDING_PAGE_ANALYTICS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view landing page analytics" ON landing_page_analytics;
CREATE POLICY "Members can view landing page analytics" ON landing_page_analytics
  FOR SELECT
  USING (
    page_id IN (
      SELECT lp.id FROM landing_pages lp
      WHERE lp.workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
      )
    )
  );

-- "Anyone can insert landing page analytics" uses WITH CHECK (true) — skip.

-- ============================================================================
-- 24. LANDING_PAGE_LEADS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view landing page leads" ON landing_page_leads;
CREATE POLICY "Members can view landing page leads" ON landing_page_leads
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

-- "Anyone can insert landing page leads" uses WITH CHECK (true) — skip.

DROP POLICY IF EXISTS "Admins and above can delete landing page leads" ON landing_page_leads;
CREATE POLICY "Admins and above can delete landing page leads" ON landing_page_leads
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 25. LANDING_PAGES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view landing pages" ON landing_pages;
CREATE POLICY "Members can view landing pages" ON landing_pages
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors and above can create landing pages" ON landing_pages;
CREATE POLICY "Editors and above can create landing pages" ON landing_pages
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors and above can update landing pages" ON landing_pages;
CREATE POLICY "Editors and above can update landing pages" ON landing_pages
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and above can delete landing pages" ON landing_pages;
CREATE POLICY "Admins and above can delete landing pages" ON landing_pages
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 26. MRR_HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Members can view MRR history" ON mrr_history;
CREATE POLICY "Members can view MRR history" ON mrr_history
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "System can manage MRR history" ON mrr_history;
CREATE POLICY "System can manage MRR history" ON mrr_history
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 27. NOTIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = (select auth.uid()));

-- "System can insert notifications" uses WITH CHECK (true) — skip.

-- ============================================================================
-- 28. PIPELINE_STAGES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view pipeline stages in their workspaces" ON pipeline_stages;
CREATE POLICY "Members can view pipeline stages in their workspaces"
  ON pipeline_stages FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can create pipeline stages" ON pipeline_stages;
CREATE POLICY "Editors can create pipeline stages"
  ON pipeline_stages FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update pipeline stages" ON pipeline_stages;
CREATE POLICY "Editors can update pipeline stages"
  ON pipeline_stages FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete pipeline stages" ON pipeline_stages;
CREATE POLICY "Admins can delete pipeline stages"
  ON pipeline_stages FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 29. PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = (select auth.uid()));

-- "System can create profiles" uses WITH CHECK (true) — skip.

-- ============================================================================
-- 30. PROJECTS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Members can view projects" ON projects
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors and above can create projects" ON projects;
CREATE POLICY "Editors and above can create projects" ON projects
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors and above can update projects" ON projects;
CREATE POLICY "Editors and above can update projects" ON projects
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and above can delete projects" ON projects;
CREATE POLICY "Admins and above can delete projects" ON projects
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 31. REVENUE_EVENTS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view revenue events" ON revenue_events;
CREATE POLICY "Members can view revenue events" ON revenue_events
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage revenue events" ON revenue_events;
CREATE POLICY "Admins can manage revenue events" ON revenue_events
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 32. STRIPE_SUBSCRIPTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view stripe_subscriptions" ON stripe_subscriptions;
CREATE POLICY "Members can view stripe_subscriptions" ON stripe_subscriptions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage stripe_subscriptions" ON stripe_subscriptions;
CREATE POLICY "Admins can manage stripe_subscriptions" ON stripe_subscriptions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 33. STRIPE_SYNC_LOG
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view sync log" ON stripe_sync_log;
CREATE POLICY "Admins can view sync log" ON stripe_sync_log
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage sync log" ON stripe_sync_log;
CREATE POLICY "Admins can manage sync log" ON stripe_sync_log
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 34. SUBSCRIPTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (user_id = (select auth.uid()));

-- "System can create subscriptions" uses WITH CHECK (true) — skip.

-- ============================================================================
-- 35. TASKS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view tasks" ON tasks;
CREATE POLICY "Members can view tasks" ON tasks
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can create tasks" ON tasks;
CREATE POLICY "Members can create tasks" ON tasks
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
CREATE POLICY "Members can update tasks" ON tasks
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Task owners or admins can delete tasks" ON tasks;
CREATE POLICY "Task owners or admins can delete tasks" ON tasks
  FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 36. TIME_ENTRIES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view time entries" ON time_entries;
CREATE POLICY "Members can view time entries" ON time_entries
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can create time entries" ON time_entries;
CREATE POLICY "Members can create time entries" ON time_entries
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Entry owners can update time entries" ON time_entries;
CREATE POLICY "Entry owners can update time entries" ON time_entries
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Entry owners can delete time entries" ON time_entries;
CREATE POLICY "Entry owners can delete time entries" ON time_entries
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 37. VAULT_COLLECTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view vault collections" ON vault_collections;
CREATE POLICY "Members can view vault collections" ON vault_collections
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can create vault collections" ON vault_collections;
CREATE POLICY "Members can create vault collections" ON vault_collections
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Collection owners can update vault collections" ON vault_collections;
CREATE POLICY "Collection owners can update vault collections" ON vault_collections
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Collection owners can delete vault collections" ON vault_collections;
CREATE POLICY "Collection owners can delete vault collections" ON vault_collections
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 38. VAULT_ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view vault items" ON vault_items;
CREATE POLICY "Members can view vault items" ON vault_items
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can create vault items" ON vault_items;
CREATE POLICY "Members can create vault items" ON vault_items
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Item owners can update vault items" ON vault_items;
CREATE POLICY "Item owners can update vault items" ON vault_items
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Item owners can delete vault items" ON vault_items;
CREATE POLICY "Item owners can delete vault items" ON vault_items
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 39. WORKSPACE_MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
CREATE POLICY "Members can view workspace members" ON workspace_members
  FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins and owners can add members" ON workspace_members;
CREATE POLICY "Admins and owners can add members" ON workspace_members
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins and owners can update members" ON workspace_members;
CREATE POLICY "Admins and owners can update members" ON workspace_members
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins owners or self can remove members" ON workspace_members;
CREATE POLICY "Admins owners or self can remove members" ON workspace_members
  FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 40. WORKSPACES
-- ============================================================================

DROP POLICY IF EXISTS "Members can view their workspaces" ON workspaces;
CREATE POLICY "Members can view their workspaces" ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON workspaces;
CREATE POLICY "Authenticated users can create workspaces" ON workspaces
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Owners and admins can update workspaces" ON workspaces;
CREATE POLICY "Owners and admins can update workspaces" ON workspaces
  FOR UPDATE
  USING (
    owner_id = (select auth.uid())
    OR id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Only owners can delete workspaces" ON workspaces;
CREATE POLICY "Only owners can delete workspaces" ON workspaces
  FOR DELETE
  USING (owner_id = (select auth.uid()));

COMMIT;
