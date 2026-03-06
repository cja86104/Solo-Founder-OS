-- ============================================================================
-- Setup All Missing Tables
-- Safe to run multiple times (fully idempotent)
-- Run this in Supabase Dashboard > SQL Editor after the initial schema
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON notifications(workspace_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 2. COMMAND CENTER ENUMS
-- ============================================================================

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
-- 3. CUSTOMERS TABLE (Synced from Stripe)
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
-- 4. STRIPE_SUBSCRIPTIONS TABLE
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
-- 5. MRR_HISTORY TABLE
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
-- 6. REVENUE_EVENTS TABLE
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
-- 7. STRIPE_SYNC_LOG TABLE
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
-- 8. INDEXES
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
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_sync_log ENABLE ROW LEVEL SECURITY;

-- Customers policies
DROP POLICY IF EXISTS "Members can view customers" ON customers;
CREATE POLICY "Members can view customers" ON customers
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage customers" ON customers;
CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Stripe subscriptions policies
DROP POLICY IF EXISTS "Members can view stripe_subscriptions" ON stripe_subscriptions;
CREATE POLICY "Members can view stripe_subscriptions" ON stripe_subscriptions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage stripe_subscriptions" ON stripe_subscriptions;
CREATE POLICY "Admins can manage stripe_subscriptions" ON stripe_subscriptions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- MRR history policies
DROP POLICY IF EXISTS "Members can view MRR history" ON mrr_history;
CREATE POLICY "Members can view MRR history" ON mrr_history
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage MRR history" ON mrr_history;
CREATE POLICY "System can manage MRR history" ON mrr_history
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Revenue events policies
DROP POLICY IF EXISTS "Members can view revenue events" ON revenue_events;
CREATE POLICY "Members can view revenue events" ON revenue_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage revenue events" ON revenue_events;
CREATE POLICY "Admins can manage revenue events" ON revenue_events
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Sync log policies
DROP POLICY IF EXISTS "Admins can view sync log" ON stripe_sync_log;
CREATE POLICY "Admins can view sync log" ON stripe_sync_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage sync log" ON stripe_sync_log;
CREATE POLICY "Admins can manage sync log" ON stripe_sync_log
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 10. FUNCTIONS
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

CREATE OR REPLACE FUNCTION calculate_churn_risk(
  p_subscription_status subscription_status,
  p_days_until_renewal INTEGER,
  p_failed_payment_count INTEGER,
  p_last_payment_date TIMESTAMPTZ
) RETURNS DECIMAL AS $$
DECLARE
  v_risk DECIMAL := 0;
BEGIN
  CASE p_subscription_status
    WHEN 'past_due' THEN v_risk := v_risk + 40;
    WHEN 'unpaid' THEN v_risk := v_risk + 60;
    WHEN 'canceled' THEN v_risk := v_risk + 100;
    WHEN 'incomplete' THEN v_risk := v_risk + 30;
    ELSE v_risk := v_risk + 0;
  END CASE;

  IF p_days_until_renewal IS NOT NULL THEN
    IF p_days_until_renewal <= 7 THEN v_risk := v_risk + 15;
    ELSIF p_days_until_renewal <= 14 THEN v_risk := v_risk + 10;
    ELSIF p_days_until_renewal <= 30 THEN v_risk := v_risk + 5;
    END IF;
  END IF;

  v_risk := v_risk + LEAST(p_failed_payment_count * 15, 45);

  IF p_last_payment_date IS NOT NULL AND
     p_last_payment_date < NOW() - INTERVAL '60 days' THEN
    v_risk := v_risk + 20;
  END IF;

  RETURN LEAST(v_risk, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate churn risk on customer insert/update
CREATE OR REPLACE FUNCTION update_customer_churn_risk()
RETURNS TRIGGER AS $$
BEGIN
  NEW.churn_risk_score := calculate_churn_risk(
    NEW.subscription_status,
    NEW.days_until_renewal,
    NEW.failed_payment_count,
    NEW.last_payment_date
  );

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

DROP TRIGGER IF EXISTS trigger_update_customer_churn_risk ON customers;
CREATE TRIGGER trigger_update_customer_churn_risk
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_churn_risk();

-- Workspace MRR summary function
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

-- ============================================================================
-- 11. ADVISOR CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS advisor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'general',
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisor_conversations_workspace ON advisor_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_advisor_conversations_user ON advisor_conversations(user_id, updated_at DESC);

ALTER TABLE advisor_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can view their own advisor conversations"
  ON advisor_conversations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can create advisor conversations"
  ON advisor_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can update their own advisor conversations"
  ON advisor_conversations FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own advisor conversations" ON advisor_conversations;
CREATE POLICY "Users can delete their own advisor conversations"
  ON advisor_conversations FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 12. ADVISOR MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS advisor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES advisor_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'general',
  tokens_used INTEGER DEFAULT 0,
  model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisor_messages_conversation ON advisor_messages(conversation_id, created_at ASC);

ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON advisor_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON advisor_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM advisor_conversations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON advisor_messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON advisor_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM advisor_conversations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 13. ADVISOR SUGGESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS advisor_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES advisor_conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'action',
  topic TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  rationale TEXT,
  action_steps JSONB DEFAULT '[]'::jsonb,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  impact_score INTEGER DEFAULT 0,
  effort_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisor_suggestions_workspace ON advisor_suggestions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_advisor_suggestions_conversation ON advisor_suggestions(conversation_id);

ALTER TABLE advisor_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view advisor suggestions" ON advisor_suggestions;
CREATE POLICY "Members can view advisor suggestions"
  ON advisor_suggestions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can manage advisor suggestions" ON advisor_suggestions;
CREATE POLICY "Members can manage advisor suggestions"
  ON advisor_suggestions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 14. GRANTS
-- ============================================================================

GRANT ALL ON notifications TO anon, authenticated, service_role;
GRANT ALL ON customers TO anon, authenticated, service_role;
GRANT ALL ON stripe_subscriptions TO anon, authenticated, service_role;
GRANT ALL ON mrr_history TO anon, authenticated, service_role;
GRANT ALL ON revenue_events TO anon, authenticated, service_role;
GRANT ALL ON stripe_sync_log TO anon, authenticated, service_role;
GRANT ALL ON advisor_conversations TO anon, authenticated, service_role;
GRANT ALL ON advisor_messages TO anon, authenticated, service_role;
GRANT ALL ON advisor_suggestions TO anon, authenticated, service_role;

-- Ensure future tables get grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
