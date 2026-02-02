-- ============================================================================
-- Migration: Create 12 missing production tables
-- Problem: These tables are defined in migration files and referenced by app
--          code but were never created in the production database.
-- Approach: CREATE TABLE IF NOT EXISTS with all indexes, triggers, RLS, policies
-- Note: Policies use (select auth.uid()) to avoid auth_rls_initplan warnings
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: 4 tables from initial_schema (api_keys, audit_logs,
--            contact_notes, workspace_invites)
-- ============================================================================

-- Ensure required enums exist (safe if already present)
DO $$ BEGIN
  CREATE TYPE audit_event_category AS ENUM (
    'authentication', 'authorization', 'data_access',
    'data_modification', 'settings_change', 'billing', 'security'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: api_keys
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_preview TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can view API keys for their workspaces') THEN
    CREATE POLICY "Users can view API keys for their workspaces"
      ON api_keys FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Admins can create API keys') THEN
    CREATE POLICY "Admins can create API keys"
      ON api_keys FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Admins can delete API keys') THEN
    CREATE POLICY "Admins can delete API keys"
      ON api_keys FOR DELETE
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')));
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: audit_logs
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  event_type TEXT NOT NULL,
  event_category audit_event_category NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity audit_severity DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Members can view audit logs for their workspaces') THEN
    CREATE POLICY "Members can view audit logs for their workspaces"
      ON audit_logs FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'System can insert audit logs') THEN
    CREATE POLICY "System can insert audit logs"
      ON audit_logs FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: contact_notes
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_workspace ON contact_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user ON contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_pinned ON contact_notes(contact_id, is_pinned DESC, created_at DESC);

CREATE TRIGGER update_contact_notes_updated_at
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_notes' AND policyname = 'Members can view contact notes in their workspaces') THEN
    CREATE POLICY "Members can view contact notes in their workspaces"
      ON contact_notes FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_notes' AND policyname = 'Members can create contact notes') THEN
    CREATE POLICY "Members can create contact notes"
      ON contact_notes FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_notes' AND policyname = 'Users can update their own notes') THEN
    CREATE POLICY "Users can update their own notes"
      ON contact_notes FOR UPDATE
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_notes' AND policyname = 'Users can delete their own notes') THEN
    CREATE POLICY "Users can delete their own notes"
      ON contact_notes FOR DELETE
      USING (user_id = (select auth.uid()));
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: workspace_invites
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_pending_invite UNIQUE (workspace_id, email)
);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_expires ON workspace_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_pending ON workspace_invites(workspace_id, accepted_at) WHERE accepted_at IS NULL;

ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invites' AND policyname = 'Members can view invites for their workspaces') THEN
    CREATE POLICY "Members can view invites for their workspaces"
      ON workspace_invites FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invites' AND policyname = 'Admins can create invites') THEN
    CREATE POLICY "Admins can create invites"
      ON workspace_invites FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invites' AND policyname = 'Admins can delete invites') THEN
    CREATE POLICY "Admins can delete invites"
      ON workspace_invites FOR DELETE
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invites' AND policyname = 'Anyone can view invite by token') THEN
    CREATE POLICY "Anyone can view invite by token"
      ON workspace_invites FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: 8 tables from analytics migration (analytics_visitors,
--            analytics_sessions, analytics_page_views, analytics_events,
--            analytics_goals, analytics_conversions, analytics_funnels,
--            analytics_reports)
-- ============================================================================

-- ──────────────────────────────────────────────
-- TABLE: analytics_visitors
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_page_views INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  country VARCHAR(100),
  device_type VARCHAR(20) DEFAULT 'desktop',
  is_returning BOOLEAN NOT NULL DEFAULT FALSE,
  lifetime_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_visitors_workspace ON analytics_visitors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_first_seen ON analytics_visitors(first_seen);

ALTER TABLE analytics_visitors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_visitors' AND policyname = 'Users can view analytics visitors in their workspaces') THEN
    CREATE POLICY "Users can view analytics visitors in their workspaces"
      ON analytics_visitors FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_visitors.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: analytics_sessions
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES analytics_visitors(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  page_views INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  entry_page VARCHAR(2000) NOT NULL,
  exit_page VARCHAR(2000),
  referrer VARCHAR(2000),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  device_type VARCHAR(20) DEFAULT 'desktop',
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  screen_resolution VARCHAR(20),
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  ip_hash VARCHAR(64),
  is_bounce BOOLEAN NOT NULL DEFAULT FALSE,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  conversion_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_workspace ON analytics_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_utm_source ON analytics_sessions(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country ON analytics_sessions(country);

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_sessions' AND policyname = 'Users can view analytics sessions in their workspaces') THEN
    CREATE POLICY "Users can view analytics sessions in their workspaces"
      ON analytics_sessions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_sessions.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_sessions' AND policyname = 'Anyone can insert analytics sessions') THEN
    CREATE POLICY "Anyone can insert analytics sessions"
      ON analytics_sessions FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: analytics_page_views
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id UUID REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES analytics_visitors(id) ON DELETE SET NULL,
  page_path VARCHAR(2000) NOT NULL,
  page_title VARCHAR(500),
  referrer VARCHAR(2000),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  device_type VARCHAR(20) DEFAULT 'desktop',
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  scroll_depth INTEGER NOT NULL DEFAULT 0,
  is_exit BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_page_views_workspace ON analytics_page_views(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_session ON analytics_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_created_at ON analytics_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_page_path ON analytics_page_views(page_path);

ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_page_views' AND policyname = 'Users can view analytics page views in their workspaces') THEN
    CREATE POLICY "Users can view analytics page views in their workspaces"
      ON analytics_page_views FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_page_views.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_page_views' AND policyname = 'Anyone can insert analytics page views') THEN
    CREATE POLICY "Anyone can insert analytics page views"
      ON analytics_page_views FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: analytics_events
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id UUID REFERENCES analytics_sessions(id) ON DELETE SET NULL,
  visitor_id UUID REFERENCES analytics_visitors(id) ON DELETE SET NULL,
  event_name VARCHAR(255) NOT NULL,
  event_category VARCHAR(100) NOT NULL DEFAULT 'general',
  event_value DECIMAL(12, 2),
  properties JSONB DEFAULT '{}',
  page_path VARCHAR(2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace ON analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'Users can view analytics events in their workspaces') THEN
    CREATE POLICY "Users can view analytics events in their workspaces"
      ON analytics_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_events.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'Anyone can insert analytics events') THEN
    CREATE POLICY "Anyone can insert analytics events"
      ON analytics_events FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;




-- ──────────────────────────────────────────────
-- TABLE: analytics_goals
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL,
  target_value VARCHAR(500) NOT NULL,
  target_operator VARCHAR(20) NOT NULL DEFAULT 'equals',
  conversion_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_goals_workspace ON analytics_goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_goals_active ON analytics_goals(is_active);

ALTER TABLE analytics_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_goals' AND policyname = 'Users can view analytics goals in their workspaces') THEN
    CREATE POLICY "Users can view analytics goals in their workspaces"
      ON analytics_goals FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_goals.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_goals' AND policyname = 'Editors can manage analytics goals') THEN
    CREATE POLICY "Editors can manage analytics goals"
      ON analytics_goals FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_goals.workspace_id
          AND workspace_members.user_id = (select auth.uid())
          AND workspace_members.role IN ('owner', 'admin', 'editor')
        )
      );
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: analytics_conversions
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES analytics_goals(id) ON DELETE CASCADE,
  session_id UUID REFERENCES analytics_sessions(id) ON DELETE SET NULL,
  visitor_id UUID REFERENCES analytics_visitors(id) ON DELETE SET NULL,
  conversion_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attribution_source VARCHAR(255),
  attribution_medium VARCHAR(255),
  attribution_campaign VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_analytics_conversions_workspace ON analytics_conversions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_goal ON analytics_conversions(goal_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_converted_at ON analytics_conversions(converted_at);

ALTER TABLE analytics_conversions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_conversions' AND policyname = 'Users can view analytics conversions in their workspaces') THEN
    CREATE POLICY "Users can view analytics conversions in their workspaces"
      ON analytics_conversions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_conversions.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_conversions' AND policyname = 'Anyone can insert analytics conversions') THEN
    CREATE POLICY "Anyone can insert analytics conversions"
      ON analytics_conversions FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: analytics_funnels
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_funnels_workspace ON analytics_funnels(workspace_id);

ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_funnels' AND policyname = 'Users can view analytics funnels in their workspaces') THEN
    CREATE POLICY "Users can view analytics funnels in their workspaces"
      ON analytics_funnels FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_funnels.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_funnels' AND policyname = 'Editors can manage analytics funnels') THEN
    CREATE POLICY "Editors can manage analytics funnels"
      ON analytics_funnels FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_funnels.workspace_id
          AND workspace_members.user_id = (select auth.uid())
          AND workspace_members.role IN ('owner', 'admin', 'editor')
        )
      );
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TABLE: analytics_reports
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL DEFAULT 'overview',
  config JSONB NOT NULL DEFAULT '{}',
  schedule JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_workspace ON analytics_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(report_type);

ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_reports' AND policyname = 'Users can view analytics reports in their workspaces') THEN
    CREATE POLICY "Users can view analytics reports in their workspaces"
      ON analytics_reports FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_reports.workspace_id
          AND workspace_members.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_reports' AND policyname = 'Editors can manage analytics reports') THEN
    CREATE POLICY "Editors can manage analytics reports"
      ON analytics_reports FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = analytics_reports.workspace_id
          AND workspace_members.user_id = (select auth.uid())
          AND workspace_members.role IN ('owner', 'admin', 'editor')
        )
      );
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- TRIGGERS: updated_at for analytics tables
-- ──────────────────────────────────────────────
-- Using DROP IF EXISTS + CREATE to be idempotent (triggers don't support IF NOT EXISTS)

DROP TRIGGER IF EXISTS set_analytics_visitors_updated_at ON analytics_visitors;
CREATE TRIGGER set_analytics_visitors_updated_at
  BEFORE UPDATE ON analytics_visitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_analytics_sessions_updated_at ON analytics_sessions;
CREATE TRIGGER set_analytics_sessions_updated_at
  BEFORE UPDATE ON analytics_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_analytics_goals_updated_at ON analytics_goals;
CREATE TRIGGER set_analytics_goals_updated_at
  BEFORE UPDATE ON analytics_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_analytics_funnels_updated_at ON analytics_funnels;
CREATE TRIGGER set_analytics_funnels_updated_at
  BEFORE UPDATE ON analytics_funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_analytics_reports_updated_at ON analytics_reports;
CREATE TRIGGER set_analytics_reports_updated_at
  BEFORE UPDATE ON analytics_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ──────────────────────────────────────────────
-- FUNCTIONS: Analytics helper functions
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_active_visitors(p_workspace_id UUID, p_minutes INTEGER DEFAULT 5)
RETURNS TABLE (
  active_count BIGINT,
  pages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT session_id) as active_count,
    jsonb_agg(DISTINCT jsonb_build_object(
      'path', page_path,
      'title', page_title
    )) as pages
  FROM analytics_page_views
  WHERE workspace_id = p_workspace_id
    AND created_at > NOW() - (p_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_visitor_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE analytics_visitors
  SET
    last_seen = NOW(),
    total_sessions = total_sessions + 1,
    is_returning = TRUE,
    updated_at = NOW()
  WHERE id = NEW.visitor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_visitor_on_session ON analytics_sessions;
CREATE TRIGGER update_visitor_on_session
  AFTER INSERT ON analytics_sessions
  FOR EACH ROW
  WHEN (NEW.visitor_id IS NOT NULL)
  EXECUTE FUNCTION update_visitor_stats();

CREATE OR REPLACE FUNCTION update_session_page_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE analytics_sessions
  SET
    page_views = page_views + 1,
    exit_page = NEW.page_path,
    updated_at = NOW()
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_on_page_view ON analytics_page_views;
CREATE TRIGGER update_session_on_page_view
  AFTER INSERT ON analytics_page_views
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION update_session_page_views();


-- ──────────────────────────────────────────────
-- GRANTS: All Section 1 + Section 2 tables
-- ──────────────────────────────────────────────

-- Section 1
GRANT ALL ON api_keys TO anon, authenticated, service_role;
GRANT ALL ON audit_logs TO anon, authenticated, service_role;
GRANT ALL ON contact_notes TO anon, authenticated, service_role;
GRANT ALL ON workspace_invites TO anon, authenticated, service_role;

-- Section 2
GRANT ALL ON analytics_visitors TO anon, authenticated, service_role;
GRANT ALL ON analytics_sessions TO anon, authenticated, service_role;
GRANT ALL ON analytics_page_views TO anon, authenticated, service_role;
GRANT ALL ON analytics_events TO anon, authenticated, service_role;
GRANT ALL ON analytics_goals TO anon, authenticated, service_role;
GRANT ALL ON analytics_conversions TO anon, authenticated, service_role;
GRANT ALL ON analytics_funnels TO anon, authenticated, service_role;
GRANT ALL ON analytics_reports TO anon, authenticated, service_role;

COMMIT;
