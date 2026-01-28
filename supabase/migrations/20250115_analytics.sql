-- =============================================================================
-- Analytics Tables Migration
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Visitors Table
-- Tracks unique visitors across sessions
-- -----------------------------------------------------------------------------

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

CREATE INDEX idx_analytics_visitors_workspace ON analytics_visitors(workspace_id);
CREATE INDEX idx_analytics_visitors_first_seen ON analytics_visitors(first_seen);

-- -----------------------------------------------------------------------------
-- Sessions Table
-- Tracks individual browsing sessions
-- -----------------------------------------------------------------------------

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

CREATE INDEX idx_analytics_sessions_workspace ON analytics_sessions(workspace_id);
CREATE INDEX idx_analytics_sessions_visitor ON analytics_sessions(visitor_id);
CREATE INDEX idx_analytics_sessions_started_at ON analytics_sessions(started_at);
CREATE INDEX idx_analytics_sessions_utm_source ON analytics_sessions(utm_source);
CREATE INDEX idx_analytics_sessions_country ON analytics_sessions(country);

-- -----------------------------------------------------------------------------
-- Page Views Table
-- Tracks individual page views within sessions
-- -----------------------------------------------------------------------------

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

CREATE INDEX idx_analytics_page_views_workspace ON analytics_page_views(workspace_id);
CREATE INDEX idx_analytics_page_views_session ON analytics_page_views(session_id);
CREATE INDEX idx_analytics_page_views_created_at ON analytics_page_views(created_at);
CREATE INDEX idx_analytics_page_views_page_path ON analytics_page_views(page_path);

-- -----------------------------------------------------------------------------
-- Events Table
-- Tracks custom analytics events
-- -----------------------------------------------------------------------------

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

CREATE INDEX idx_analytics_events_workspace ON analytics_events(workspace_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- -----------------------------------------------------------------------------
-- Goals Table
-- Defines conversion goals for tracking
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL, -- page_view, event, duration, pages_per_session
  target_value VARCHAR(500) NOT NULL, -- page path, event name, or numeric threshold
  target_operator VARCHAR(20) NOT NULL DEFAULT 'equals', -- equals, contains, greater_than, less_than
  conversion_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_goals_workspace ON analytics_goals(workspace_id);
CREATE INDEX idx_analytics_goals_active ON analytics_goals(is_active);

-- -----------------------------------------------------------------------------
-- Conversions Table
-- Tracks goal completions
-- -----------------------------------------------------------------------------

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

CREATE INDEX idx_analytics_conversions_workspace ON analytics_conversions(workspace_id);
CREATE INDEX idx_analytics_conversions_goal ON analytics_conversions(goal_id);
CREATE INDEX idx_analytics_conversions_converted_at ON analytics_conversions(converted_at);

-- -----------------------------------------------------------------------------
-- Funnels Table
-- Defines conversion funnels
-- -----------------------------------------------------------------------------

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

CREATE INDEX idx_analytics_funnels_workspace ON analytics_funnels(workspace_id);

-- -----------------------------------------------------------------------------
-- Reports Table
-- Saved analytics reports
-- -----------------------------------------------------------------------------

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

CREATE INDEX idx_analytics_reports_workspace ON analytics_reports(workspace_id);
CREATE INDEX idx_analytics_reports_type ON analytics_reports(report_type);

-- -----------------------------------------------------------------------------
-- Real-time Active Visitors (Materialized View for Performance)
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE analytics_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

-- Visitors policies
CREATE POLICY "Users can view analytics visitors in their workspaces"
  ON analytics_visitors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_visitors.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- Sessions policies
CREATE POLICY "Users can view analytics sessions in their workspaces"
  ON analytics_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_sessions.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics sessions"
  ON analytics_sessions FOR INSERT
  WITH CHECK (true);

-- Page views policies
CREATE POLICY "Users can view analytics page views in their workspaces"
  ON analytics_page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_page_views.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics page views"
  ON analytics_page_views FOR INSERT
  WITH CHECK (true);

-- Events policies
CREATE POLICY "Users can view analytics events in their workspaces"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_events.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Goals policies
CREATE POLICY "Users can view analytics goals in their workspaces"
  ON analytics_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_goals.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage analytics goals"
  ON analytics_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_goals.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'editor')
    )
  );

-- Conversions policies
CREATE POLICY "Users can view analytics conversions in their workspaces"
  ON analytics_conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_conversions.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics conversions"
  ON analytics_conversions FOR INSERT
  WITH CHECK (true);

-- Funnels policies
CREATE POLICY "Users can view analytics funnels in their workspaces"
  ON analytics_funnels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_funnels.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage analytics funnels"
  ON analytics_funnels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_funnels.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'editor')
    )
  );

-- Reports policies
CREATE POLICY "Users can view analytics reports in their workspaces"
  ON analytics_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_reports.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage analytics reports"
  ON analytics_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = analytics_reports.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'editor')
    )
  );

-- -----------------------------------------------------------------------------
-- Triggers for Updated At
-- -----------------------------------------------------------------------------

CREATE TRIGGER set_analytics_visitors_updated_at
  BEFORE UPDATE ON analytics_visitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_analytics_sessions_updated_at
  BEFORE UPDATE ON analytics_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_analytics_goals_updated_at
  BEFORE UPDATE ON analytics_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_analytics_funnels_updated_at
  BEFORE UPDATE ON analytics_funnels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_analytics_reports_updated_at
  BEFORE UPDATE ON analytics_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Update visitor stats trigger
-- -----------------------------------------------------------------------------

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

CREATE TRIGGER update_visitor_on_session
  AFTER INSERT ON analytics_sessions
  FOR EACH ROW
  WHEN (NEW.visitor_id IS NOT NULL)
  EXECUTE FUNCTION update_visitor_stats();

-- -----------------------------------------------------------------------------
-- Update session page view count trigger
-- -----------------------------------------------------------------------------

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

CREATE TRIGGER update_session_on_page_view
  AFTER INSERT ON analytics_page_views
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION update_session_page_views();
