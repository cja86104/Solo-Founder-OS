-- ============================================================================
-- Solo Founder OS - Command Center (MRR Tracking) Schema
-- Syncs with Stripe to track subscriptions, MRR, churn, and customer metrics
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'unpaid',
  'paused'
);

-- Customer status enum
CREATE TYPE customer_status AS ENUM (
  'active',
  'churned',
  'at_risk',
  'new'
);

-- Metric period enum
CREATE TYPE metric_period AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

-- ============================================================================
-- CUSTOMERS TABLE (Synced from Stripe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Stripe identifiers
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_subscription_id VARCHAR(255),
  
  -- Customer info
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  
  -- Subscription details
  status customer_status DEFAULT 'new',
  subscription_status subscription_status,
  plan_name VARCHAR(255),
  plan_id VARCHAR(255),
  
  -- Financial
  mrr DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  
  -- Dates
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  -- Engagement
  last_payment_date TIMESTAMPTZ,
  last_invoice_date TIMESTAMPTZ,
  payment_count INTEGER DEFAULT 0,
  failed_payment_count INTEGER DEFAULT 0,
  
  -- Churn risk
  churn_risk_score DECIMAL(5,2) DEFAULT 0,
  days_until_renewal INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE (Detailed subscription history from Stripe)
-- Named stripe_subscriptions to avoid conflict with existing subscriptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Stripe identifiers
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  
  -- Subscription details
  status subscription_status NOT NULL,
  plan_name VARCHAR(255),
  plan_id VARCHAR(255),
  price_id VARCHAR(255),
  
  -- Financial
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20), -- month, year, week
  interval_count INTEGER DEFAULT 1,
  
  -- Calculated MRR (normalized to monthly)
  mrr DECIMAL(12,2) NOT NULL,
  
  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Billing
  billing_cycle_anchor TIMESTAMPTZ,
  collection_method VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- MRR HISTORY TABLE (Track MRR over time)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mrr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Period
  period_date DATE NOT NULL,
  period_type metric_period DEFAULT 'daily',
  
  -- MRR metrics
  mrr DECIMAL(12,2) NOT NULL,
  mrr_new DECIMAL(12,2) DEFAULT 0,
  mrr_expansion DECIMAL(12,2) DEFAULT 0,
  mrr_contraction DECIMAL(12,2) DEFAULT 0,
  mrr_churned DECIMAL(12,2) DEFAULT 0,
  mrr_reactivation DECIMAL(12,2) DEFAULT 0,
  
  -- Net MRR movement
  net_mrr_change DECIMAL(12,2) DEFAULT 0,
  
  -- Customer counts
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  reactivated_customers INTEGER DEFAULT 0,
  
  -- ARR (for convenience)
  arr DECIMAL(14,2) GENERATED ALWAYS AS (mrr * 12) STORED,
  
  -- Rates
  churn_rate DECIMAL(5,2) DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id, period_date, period_type)
);

-- ============================================================================
-- REVENUE EVENTS TABLE (Track individual revenue events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES stripe_subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe identifiers
  stripe_event_id VARCHAR(255) UNIQUE,
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  
  -- Event type
  event_type VARCHAR(50) NOT NULL, -- new, expansion, contraction, churn, reactivation, payment
  
  -- Financial
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  mrr_impact DECIMAL(12,2) DEFAULT 0,
  
  -- Details
  description TEXT,
  plan_from VARCHAR(255),
  plan_to VARCHAR(255),
  
  -- Status
  status VARCHAR(50), -- succeeded, failed, pending
  failure_reason TEXT,
  
  -- Metadata
  event_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SYNC LOG TABLE (Track Stripe sync operations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Sync details
  sync_type VARCHAR(50) NOT NULL, -- full, incremental, customers, subscriptions, invoices
  status VARCHAR(20) NOT NULL, -- started, completed, failed
  
  -- Results
  records_synced INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Metadata
  triggered_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_workspace ON customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_subscription_status ON customers(workspace_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk ON customers(workspace_id, churn_risk_score DESC);

-- Stripe subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_workspace ON stripe_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer ON stripe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(workspace_id, status);

-- MRR history indexes
CREATE INDEX IF NOT EXISTS idx_mrr_history_workspace ON mrr_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mrr_history_date ON mrr_history(workspace_id, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_mrr_history_period ON mrr_history(workspace_id, period_type, period_date DESC);

-- Revenue events indexes
CREATE INDEX IF NOT EXISTS idx_revenue_events_workspace ON revenue_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_customer ON revenue_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_date ON revenue_events(workspace_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_type ON revenue_events(workspace_id, event_type);

-- Sync log indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_workspace ON stripe_sync_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON stripe_sync_log(workspace_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_sync_log ENABLE ROW LEVEL SECURITY;

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

-- Calculate MRR from subscription amount and interval
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
    ELSE RETURN p_amount; -- Default to monthly
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate churn risk score based on various factors
CREATE OR REPLACE FUNCTION calculate_churn_risk(
  p_subscription_status subscription_status,
  p_days_until_renewal INTEGER,
  p_failed_payment_count INTEGER,
  p_last_payment_date TIMESTAMPTZ
) RETURNS DECIMAL AS $$
DECLARE
  v_risk DECIMAL := 0;
BEGIN
  -- Status-based risk
  CASE p_subscription_status
    WHEN 'past_due' THEN v_risk := v_risk + 40;
    WHEN 'unpaid' THEN v_risk := v_risk + 60;
    WHEN 'canceled' THEN v_risk := v_risk + 100;
    WHEN 'incomplete' THEN v_risk := v_risk + 30;
    ELSE v_risk := v_risk + 0;
  END CASE;
  
  -- Days until renewal risk
  IF p_days_until_renewal IS NOT NULL THEN
    IF p_days_until_renewal <= 7 THEN v_risk := v_risk + 15;
    ELSIF p_days_until_renewal <= 14 THEN v_risk := v_risk + 10;
    ELSIF p_days_until_renewal <= 30 THEN v_risk := v_risk + 5;
    END IF;
  END IF;
  
  -- Failed payments risk
  v_risk := v_risk + LEAST(p_failed_payment_count * 15, 45);
  
  -- Last payment date risk (no payment in 60+ days)
  IF p_last_payment_date IS NOT NULL AND 
     p_last_payment_date < NOW() - INTERVAL '60 days' THEN
    v_risk := v_risk + 20;
  END IF;
  
  RETURN LEAST(v_risk, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update customer churn risk trigger
CREATE OR REPLACE FUNCTION update_customer_churn_risk()
RETURNS TRIGGER AS $$
BEGIN
  NEW.churn_risk_score := calculate_churn_risk(
    NEW.subscription_status,
    NEW.days_until_renewal,
    NEW.failed_payment_count,
    NEW.last_payment_date
  );
  
  -- Update customer status based on risk
  IF NEW.subscription_status = 'canceled' OR NEW.subscription_status IS NULL THEN
    NEW.status := 'churned';
  ELSIF NEW.churn_risk_score >= 50 THEN
    NEW.status := 'at_risk';
  ELSIF NEW.created_at > NOW() - INTERVAL '30 days' THEN
    NEW.status := 'new';
  ELSE
    NEW.status := 'active';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_churn_risk
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_churn_risk();

-- Function to get workspace MRR summary
CREATE OR REPLACE FUNCTION get_workspace_mrr_summary(p_workspace_id UUID)
RETURNS TABLE (
  total_mrr DECIMAL,
  total_arr DECIMAL,
  total_customers INTEGER,
  active_customers INTEGER,
  churned_customers INTEGER,
  at_risk_customers INTEGER,
  avg_mrr_per_customer DECIMAL,
  churn_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(c.mrr), 0)::DECIMAL as total_mrr,
    COALESCE(SUM(c.mrr) * 12, 0)::DECIMAL as total_arr,
    COUNT(*)::INTEGER as total_customers,
    COUNT(*) FILTER (WHERE c.status = 'active')::INTEGER as active_customers,
    COUNT(*) FILTER (WHERE c.status = 'churned')::INTEGER as churned_customers,
    COUNT(*) FILTER (WHERE c.status = 'at_risk')::INTEGER as at_risk_customers,
    CASE 
      WHEN COUNT(*) FILTER (WHERE c.status = 'active') > 0 
      THEN (SUM(c.mrr) FILTER (WHERE c.status = 'active') / COUNT(*) FILTER (WHERE c.status = 'active'))::DECIMAL
      ELSE 0::DECIMAL
    END as avg_mrr_per_customer,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ((COUNT(*) FILTER (WHERE c.status = 'churned'))::DECIMAL / COUNT(*)::DECIMAL * 100)::DECIMAL
      ELSE 0::DECIMAL
    END as churn_rate
  FROM customers c
  WHERE c.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql STABLE;
