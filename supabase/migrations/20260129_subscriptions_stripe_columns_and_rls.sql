-- ============================================================================
-- Add missing Stripe columns to subscriptions table
-- ============================================================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- Enable RLS on profiles and subscriptions tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Profiles RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Allow system trigger to create profiles on signup
CREATE POLICY "System can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Subscriptions RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "System can create subscriptions" ON subscriptions;

CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- Allow system trigger to create subscriptions on signup
CREATE POLICY "System can create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Fix notification INSERT policy (was too permissive)
-- ============================================================================

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Only allow inserts where user_id matches the workspace membership
-- or from service role (admin client bypasses RLS anyway)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT wm.user_id FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
    )
  );
