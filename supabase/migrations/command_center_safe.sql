-- ============================================================================
-- Command Center Tables - Safe to run on existing database
-- Handles "already exists" gracefully
-- ============================================================================

-- Create types only if they don't exist
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active', 'past_due', 'canceled', 'incomplete',
    'incomplete_expired', 'trialing', 'unpaid', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_status AS ENUM ('active', 'churned', 'at_risk', 'new');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE metric_period AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  status customer_status DEFAULT 'new',
  subscription_status subscription_status,
  plan_name VARCHAR(255),
  plan_id VARCHAR(255),
  mrr DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  last_invoice_date TIMESTAMPTZ,
  payment_count INTEGER DEFAULT 0,
  failed_payment_count INTEGER DEFAULT 0,
  churn_risk_score DECIMAL(5,2) DEFAULT 0,
  days_until_renewal INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(workspace_id, stripe_customer_id)
);

-- ============================================================================
-- STRIPE_SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status subscription_status NOT NULL,
  plan_name VARCHAR(255),
  plan_id VARCHAR(255),
  price_id VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20),
  interval_count INTEGER DEFAULT 1,
  mrr DECIMAL(12,2) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  billing_cycle_anchor TIMESTAMPTZ,
  collection_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(workspace_id, stripe_subscription_id)
);

-- ============================================================================
-- MRR_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mrr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  period_type metric_period DEFAULT 'daily',
  mrr DECIMAL(12,2) NOT NULL DEFAULT 0,
  mrr_new DECIMAL(12,2) DEFAULT 0,
  mrr_expansion DECIMAL(12,2) DEFAULT 0,
  mrr_contraction DECIMAL(12,2) DEFAULT 0,
  mrr_churned DECIMAL(12,2) DEFAULT 0,
  mrr_reactivation DECIMAL(12,2) DEFAULT 0,
  net_mrr_change DECIMAL(12,2) DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  reactivated_customers INTEGER DEFAULT 0,
  arr DECIMAL(14,2) GENERATED ALWAYS AS (mrr * 12) STORED,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, period_date, period_type)
);

-- ============================================================================
-- REVENUE_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES stripe_subscriptions(id) ON DELETE SET NULL,
  stripe_event_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  mrr_impact DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  plan_from VARCHAR(255),
  plan_to VARCHAR(255),
  status VARCHAR(50),
  failure_reason TEXT,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- STRIPE_SYNC_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  records_synced INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  triggered_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_workspace ON customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk ON customers(workspace_id, churn_risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_workspace ON stripe_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer ON stripe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_mrr_history_workspace ON mrr_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mrr_history_period ON mrr_history(workspace_id, period_type, period_date DESC);

CREATE INDEX IF NOT EXISTS idx_revenue_events_workspace ON revenue_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_date ON revenue_events(workspace_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_sync_log_workspace ON stripe_sync_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sync_log_status ON stripe_sync_log(workspace_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_sync_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Members can view customers" ON customers;
DROP POLICY IF EXISTS "Admins can manage customers" ON customers;
DROP POLICY IF EXISTS "Members can view stripe_subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admins can manage stripe_subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Members can view MRR history" ON mrr_history;
DROP POLICY IF EXISTS "System can manage MRR history" ON mrr_history;
DROP POLICY IF EXISTS "Members can view revenue events" ON revenue_events;
DROP POLICY IF EXISTS "Admins can manage revenue events" ON revenue_events;
DROP POLICY IF EXISTS "Admins can view sync log" ON stripe_sync_log;
DROP POLICY IF EXISTS "Admins can manage sync log" ON stripe_sync_log;

-- Customers policies
CREATE POLICY "Members can view customers" ON customers
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Stripe subscriptions policies
CREATE POLICY "Members can view stripe_subscriptions" ON stripe_subscriptions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage stripe_subscriptions" ON stripe_subscriptions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- MRR history policies
CREATE POLICY "Members can view MRR history" ON mrr_history
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage MRR history" ON mrr_history
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Revenue events policies
CREATE POLICY "Members can view revenue events" ON revenue_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage revenue events" ON revenue_events
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Sync log policies
CREATE POLICY "Admins can view sync log" ON stripe_sync_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage sync log" ON stripe_sync_log
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_mrr(
  p_amount DECIMAL,
  p_interval VARCHAR,
  p_interval_count INTEGER DEFAULT 1
) RETURNS DECIMAL AS $$
BEGIN
  CASE p_interval
    WHEN 'month' THEN RETURN p_amount / p_interval_count;
    WHEN 'year' THEN RETURN p_amount / (12 * p_interval_count);
    WHEN 'week' THEN RETURN (p_amount * 52) / (12 * p_interval_count);
    WHEN 'day' THEN RETURN (p_amount * 365) / (12 * p_interval_count);
    ELSE RETURN p_amount;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
