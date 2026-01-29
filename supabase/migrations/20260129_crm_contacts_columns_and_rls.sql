-- ============================================================================
-- Solo Founder OS - CRM Contacts Columns & RLS Migration
-- Adds missing columns to contacts table and enables RLS on CRM tables
-- ============================================================================

-- ============================================================================
-- 1. Add missing columns to contacts table
-- These columns are expected by the TypeScript Contact type and components
-- ============================================================================

-- Avatar
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN avatar_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Source tracking extras
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN source_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN source_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Lists (array of list IDs)
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN lists TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Engagement tracking
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN last_seen_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN total_visits INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN total_emails_sent INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN total_emails_opened INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN total_emails_clicked INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Custom fields
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN custom_fields JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- External IDs
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN stripe_customer_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN external_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================================
-- 2. Enable RLS on core CRM tables
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS Policies for contacts
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY "Members can view contacts in their workspaces"
    ON contacts FOR SELECT
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can create contacts"
    ON contacts FOR INSERT
    WITH CHECK (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can update contacts"
    ON contacts FOR UPDATE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete contacts"
    ON contacts FOR DELETE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. RLS Policies for deals
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY "Members can view deals in their workspaces"
    ON deals FOR SELECT
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can create deals"
    ON deals FOR INSERT
    WITH CHECK (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can update deals"
    ON deals FOR UPDATE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete deals"
    ON deals FOR DELETE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 5. RLS Policies for pipeline_stages
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY "Members can view pipeline stages in their workspaces"
    ON pipeline_stages FOR SELECT
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can create pipeline stages"
    ON pipeline_stages FOR INSERT
    WITH CHECK (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can update pipeline stages"
    ON pipeline_stages FOR UPDATE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete pipeline stages"
    ON pipeline_stages FOR DELETE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 6. RLS Policies for deal_activities
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY "Members can view deal activities in their workspaces"
    ON deal_activities FOR SELECT
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can create deal activities"
    ON deal_activities FOR INSERT
    WITH CHECK (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own deal activities"
    ON deal_activities FOR UPDATE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own deal activities"
    ON deal_activities FOR DELETE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 7. Add indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contacts_stripe_customer ON contacts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_external_id ON contacts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_last_seen ON contacts(last_seen_at) WHERE last_seen_at IS NOT NULL;
