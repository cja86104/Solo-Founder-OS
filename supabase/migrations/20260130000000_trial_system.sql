-- ============================================================================
-- Trial System Migration
-- Add 14-day trial, remove free plan, add read-only expiry
-- ============================================================================

-- Add trial_ends_at column to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ============================================================================
-- Update handle_new_user() trigger so new users get trial instead of pro
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

  -- Create subscription (14-day trial with full access)
  INSERT INTO subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'trial', 'trialing', NOW() + INTERVAL '14 days');

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

-- ============================================================================
-- Migrate existing free plan users to expired
-- (Pro and lifetime users are untouched)
-- ============================================================================

UPDATE subscriptions
SET plan = 'expired', status = 'expired'
WHERE plan = 'free';
