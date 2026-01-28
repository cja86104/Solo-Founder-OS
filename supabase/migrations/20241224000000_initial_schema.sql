-- ============================================================================
-- Solo Founder OS - Complete Database Schema (Open Source)
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- 3. Run: GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
-- 4. Paste and run this entire file
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE contact_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE contact_source AS ENUM ('manual', 'import', 'landing_page', 'api', 'integration');
CREATE TYPE deal_status AS ENUM ('open', 'won', 'lost');
CREATE TYPE deal_activity_type AS ENUM ('note', 'call', 'email', 'meeting', 'task', 'stage_change', 'value_change');
CREATE TYPE page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE vault_item_type AS ENUM ('snippet', 'prompt', 'component', 'template', 'note');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE post_platform AS ENUM ('twitter', 'linkedin', 'facebook', 'instagram', 'threads', 'blog');
CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'improvement', 'question', 'other');
CREATE TYPE feedback_status AS ENUM ('new', 'under_review', 'planned', 'in_progress', 'completed', 'declined');
CREATE TYPE project_status AS ENUM ('active', 'on_hold', 'completed', 'archived');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE audit_event_category AS ENUM ('authentication', 'authorization', 'data_access', 'data_modification', 'settings_change', 'billing', 'security');
CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'critical');

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE workspace_invites (
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

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan TEXT DEFAULT 'pro',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
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

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  status contact_status DEFAULT 'active',
  source contact_source DEFAULT 'manual',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

CREATE TABLE contact_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  probability INTEGER DEFAULT 50,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company TEXT,
  expected_close_date DATE,
  actual_close_date DATE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status deal_status DEFAULT 'open',
  lost_reason TEXT,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type deal_activity_type NOT NULL,
  title TEXT,
  description TEXT,
  from_stage_id UUID REFERENCES pipeline_stages(id),
  to_stage_id UUID REFERENCES pipeline_stages(id),
  old_value DECIMAL(12,2),
  new_value DECIMAL(12,2),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status page_status DEFAULT 'draft',
  template TEXT DEFAULT 'blank',
  content JSONB DEFAULT '{"sections": []}',
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  favicon TEXT,
  custom_domain TEXT,
  custom_css TEXT,
  custom_js TEXT,
  password TEXT,
  view_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

CREATE TABLE landing_page_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  data JSONB DEFAULT '{}',
  source TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE landing_page_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country TEXT,
  device TEXT,
  browser TEXT,
  session_id TEXT,
  visitor_id TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vault_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  is_public BOOLEAN DEFAULT FALSE,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES vault_collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type vault_item_type DEFAULT 'snippet',
  language TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  status post_status DEFAULT 'draft',
  platforms post_platform[] DEFAULT ARRAY[]::post_platform[],
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feedback_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  submission_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES feedback_widgets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type feedback_type DEFAULT 'other',
  title TEXT,
  content TEXT NOT NULL,
  email TEXT,
  name TEXT,
  status feedback_status DEFAULT 'new',
  priority task_priority DEFAULT 'medium',
  votes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'active',
  color TEXT DEFAULT '#6366f1',
  hourly_rate DECIMAL(10,2),
  budget DECIMAL(12,2),
  budget_hours DECIMAL(10,2),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date DATE,
  estimated_hours DECIMAL(6,2),
  completed_at TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_billable BOOLEAN DEFAULT TRUE,
  is_running BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
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

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Core tables
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Workspace invites
CREATE INDEX idx_workspace_invites_workspace ON workspace_invites(workspace_id);
CREATE INDEX idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX idx_workspace_invites_expires ON workspace_invites(expires_at);
CREATE INDEX idx_workspace_invites_pending ON workspace_invites(workspace_id, accepted_at) WHERE accepted_at IS NULL;

-- API keys
CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Contacts
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX idx_contact_notes_workspace ON contact_notes(workspace_id);
CREATE INDEX idx_contact_notes_user ON contact_notes(user_id);
CREATE INDEX idx_contact_notes_pinned ON contact_notes(contact_id, is_pinned DESC, created_at DESC);

-- CRM
CREATE INDEX idx_pipeline_stages_workspace ON pipeline_stages(workspace_id);
CREATE INDEX idx_deals_workspace ON deals(workspace_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);

-- Landing pages
CREATE INDEX idx_landing_pages_workspace ON landing_pages(workspace_id);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_page_leads_page ON landing_page_leads(page_id);

-- Vault
CREATE INDEX idx_vault_items_workspace ON vault_items(workspace_id);

-- Content
CREATE INDEX idx_content_posts_workspace ON content_posts(workspace_id);

-- Feedback
CREATE INDEX idx_feedback_widgets_workspace ON feedback_widgets(workspace_id);
CREATE INDEX idx_feedback_submissions_workspace ON feedback_submissions(workspace_id);

-- Projects
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);

-- Activities
CREATE INDEX idx_activities_workspace ON activities(workspace_id);

-- Audit logs
CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(event_category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- VIEW for workspace with role
-- ============================================================================

CREATE VIEW user_workspaces AS
SELECT 
  w.*,
  wm.role,
  wm.permissions,
  wm.joined_at
FROM workspaces w
INNER JOIN workspace_members wm ON w.id = wm.workspace_id;

-- ============================================================================
-- FUNCTION: updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON contact_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_collections_updated_at BEFORE UPDATE ON vault_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_items_updated_at BEFORE UPDATE ON vault_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_widgets_updated_at BEFORE UPDATE ON feedback_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_submissions_updated_at BEFORE UPDATE ON feedback_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Handle new user signup
-- This runs automatically when someone signs up
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
  user_name TEXT;
  workspace_slug TEXT;
BEGIN
  -- Get user's name
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Create profile
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create subscription (everyone gets pro)
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'pro', 'active');

  -- Generate workspace slug
  workspace_slug := LOWER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]+', '-', 'g')) 
                    || '-' || SUBSTR(NEW.id::TEXT, 1, 8);

  -- Create workspace
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES (user_name || '''s Workspace', workspace_slug, NEW.id)
  RETURNING id INTO new_workspace_id;

  -- Add user as workspace owner
  INSERT INTO workspace_members (workspace_id, user_id, role, permissions)
  VALUES (
    new_workspace_id,
    NEW.id,
    'owner',
    '{"landing_pages":true,"code_vault":true,"crm":true,"content":true,"feedback":true,"projects":true,"command":true,"advisor":true,"analytics":true}'::jsonb
  );

  -- Create default pipeline stages
  INSERT INTO pipeline_stages (workspace_id, name, color, position, is_won, is_lost) VALUES
    (new_workspace_id, 'Lead', '#94a3b8', 0, FALSE, FALSE),
    (new_workspace_id, 'Qualified', '#3b82f6', 1, FALSE, FALSE),
    (new_workspace_id, 'Proposal', '#8b5cf6', 2, FALSE, FALSE),
    (new_workspace_id, 'Negotiation', '#f59e0b', 3, FALSE, FALSE),
    (new_workspace_id, 'Closed Won', '#22c55e', 4, TRUE, FALSE),
    (new_workspace_id, 'Closed Lost', '#ef4444', 5, FALSE, TRUE);

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on tables that need it
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- api_keys policies
CREATE POLICY "Users can view API keys for their workspaces"
  ON api_keys FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can delete API keys"
  ON api_keys FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- audit_logs policies
CREATE POLICY "Members can view audit logs for their workspaces"
  ON audit_logs FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- contact_notes policies
CREATE POLICY "Members can view contact notes in their workspaces"
  ON contact_notes FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can create contact notes"
  ON contact_notes FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own notes"
  ON contact_notes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes"
  ON contact_notes FOR DELETE
  USING (user_id = auth.uid());

-- workspace_invites policies
CREATE POLICY "Members can view invites for their workspaces"
  ON workspace_invites FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create invites"
  ON workspace_invites FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can delete invites"
  ON workspace_invites FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Anyone can view invite by token"
  ON workspace_invites FOR SELECT
  USING (true);

-- ============================================================================
-- GRANTS - Give authenticated users full access
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- FIX EXISTING USERS (if any exist without workspaces)
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  new_workspace_id UUID;
  user_name TEXT;
  workspace_slug TEXT;
BEGIN
  -- Loop through users without profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE p.id IS NULL
  LOOP
    user_name := COALESCE(
      user_record.raw_user_meta_data->>'full_name',
      user_record.raw_user_meta_data->>'name',
      split_part(user_record.email, '@', 1)
    );

    INSERT INTO profiles (id, email, full_name)
    VALUES (user_record.id, user_record.email, user_name);
  END LOOP;

  -- Create subscriptions for users without one
  INSERT INTO subscriptions (user_id, plan, status)
  SELECT u.id, 'pro', 'active'
  FROM auth.users u
  LEFT JOIN subscriptions s ON s.user_id = u.id
  WHERE s.user_id IS NULL;

  -- Create workspaces for users without one
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN workspace_members wm ON wm.user_id = u.id
    WHERE wm.user_id IS NULL
  LOOP
    user_name := COALESCE(
      user_record.raw_user_meta_data->>'full_name',
      user_record.raw_user_meta_data->>'name',
      split_part(user_record.email, '@', 1)
    );
    
    workspace_slug := LOWER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]+', '-', 'g')) 
                      || '-' || SUBSTR(user_record.id::TEXT, 1, 8);

    INSERT INTO workspaces (name, slug, owner_id)
    VALUES (user_name || '''s Workspace', workspace_slug, user_record.id)
    RETURNING id INTO new_workspace_id;

    INSERT INTO workspace_members (workspace_id, user_id, role, permissions)
    VALUES (
      new_workspace_id,
      user_record.id,
      'owner',
      '{"landing_pages":true,"code_vault":true,"crm":true,"content":true,"feedback":true,"projects":true,"command":true,"advisor":true,"analytics":true}'::jsonb
    );

    INSERT INTO pipeline_stages (workspace_id, name, color, position, is_won, is_lost) VALUES
      (new_workspace_id, 'Lead', '#94a3b8', 0, FALSE, FALSE),
      (new_workspace_id, 'Qualified', '#3b82f6', 1, FALSE, FALSE),
      (new_workspace_id, 'Proposal', '#8b5cf6', 2, FALSE, FALSE),
      (new_workspace_id, 'Negotiation', '#f59e0b', 3, FALSE, FALSE),
      (new_workspace_id, 'Closed Won', '#22c55e', 4, TRUE, FALSE),
      (new_workspace_id, 'Closed Lost', '#ef4444', 5, FALSE, TRUE);
  END LOOP;
END;
$$;

-- ============================================================================
-- VERIFY
-- ============================================================================

SELECT 'Users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL SELECT 'Profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'Workspaces', COUNT(*) FROM workspaces
UNION ALL SELECT 'Workspace Members', COUNT(*) FROM workspace_members
UNION ALL SELECT 'Workspace Invites', COUNT(*) FROM workspace_invites
UNION ALL SELECT 'API Keys', COUNT(*) FROM api_keys
UNION ALL SELECT 'Contacts', COUNT(*) FROM contacts
UNION ALL SELECT 'Contact Notes', COUNT(*) FROM contact_notes
UNION ALL SELECT 'Pipeline Stages', COUNT(*) FROM pipeline_stages
UNION ALL SELECT 'Audit Logs', COUNT(*) FROM audit_logs;
