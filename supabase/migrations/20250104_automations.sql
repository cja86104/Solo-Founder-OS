-- ============================================================================
-- AUTOMATIONS ENGINE SCHEMA
-- Founders Helm - Workflow Automation System
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION (create if not exists)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE automation_status AS ENUM ('active', 'paused', 'draft', 'archived');
CREATE TYPE automation_trigger_type AS ENUM (
  'new_contact',
  'contact_updated',
  'contact_tagged',
  'deal_created',
  'deal_stage_changed',
  'deal_won',
  'deal_lost',
  'form_submitted',
  'feedback_received',
  'task_completed',
  'task_created',
  'scheduled',
  'webhook',
  'manual'
);
CREATE TYPE automation_action_type AS ENUM (
  'send_email',
  'create_task',
  'update_contact',
  'add_tag',
  'remove_tag',
  'move_deal',
  'create_deal',
  'update_deal',
  'webhook',
  'delay',
  'condition'
);
CREATE TYPE automation_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE automation_log_level AS ENUM ('info', 'warning', 'error', 'debug');

-- ============================================================================
-- AUTOMATIONS TABLE
-- ============================================================================

CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status automation_status NOT NULL DEFAULT 'draft',
  
  -- Trigger configuration
  trigger_type automation_trigger_type NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  
  -- Filter conditions (optional - to filter which events trigger)
  filter_conditions JSONB DEFAULT '[]',
  
  -- Execution settings
  run_limit INTEGER, -- Max runs per day (null = unlimited)
  cooldown_seconds INTEGER DEFAULT 0, -- Minimum time between runs
  last_run_at TIMESTAMPTZ,
  run_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATION ACTIONS TABLE
-- ============================================================================

CREATE TABLE automation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  
  -- Action definition
  action_type automation_action_type NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  
  -- Ordering and flow control
  position INTEGER NOT NULL DEFAULT 0,
  parent_action_id UUID REFERENCES automation_actions(id) ON DELETE CASCADE,
  branch_condition TEXT, -- For condition actions: 'true' or 'false' branch
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATION RUNS TABLE (Execution History)
-- ============================================================================

CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Execution status
  status automation_run_status NOT NULL DEFAULT 'pending',
  
  -- Trigger context
  trigger_type automation_trigger_type NOT NULL,
  trigger_data JSONB NOT NULL DEFAULT '{}',
  
  -- Results
  actions_executed INTEGER NOT NULL DEFAULT 0,
  actions_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATION RUN LOGS TABLE (Detailed Execution Logs)
-- ============================================================================

CREATE TABLE automation_run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  action_id UUID REFERENCES automation_actions(id) ON DELETE SET NULL,
  
  -- Log entry
  level automation_log_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULED AUTOMATIONS TABLE (For cron-based triggers)
-- ============================================================================

CREATE TABLE automation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE UNIQUE,
  
  -- Schedule configuration
  cron_expression TEXT NOT NULL, -- e.g., "0 9 * * 1" for every Monday at 9am
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  -- Execution tracking
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- WEBHOOK TRIGGERS TABLE (For external webhook triggers)
-- ============================================================================

CREATE TABLE automation_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE UNIQUE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Webhook configuration
  webhook_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  secret_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Security
  allowed_ips TEXT[], -- null = allow all
  require_signature BOOLEAN NOT NULL DEFAULT true,
  
  -- Stats
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_automations_workspace ON automations(workspace_id);
CREATE INDEX idx_automations_status ON automations(status);
CREATE INDEX idx_automations_trigger ON automations(trigger_type);
CREATE INDEX idx_automations_workspace_status ON automations(workspace_id, status);

CREATE INDEX idx_automation_actions_automation ON automation_actions(automation_id);
CREATE INDEX idx_automation_actions_position ON automation_actions(automation_id, position);
CREATE INDEX idx_automation_actions_parent ON automation_actions(parent_action_id);

CREATE INDEX idx_automation_runs_automation ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_workspace ON automation_runs(workspace_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_created ON automation_runs(created_at DESC);
CREATE INDEX idx_automation_runs_automation_created ON automation_runs(automation_id, created_at DESC);

CREATE INDEX idx_automation_run_logs_run ON automation_run_logs(run_id);
CREATE INDEX idx_automation_run_logs_created ON automation_run_logs(created_at);

CREATE INDEX idx_automation_schedules_next_run ON automation_schedules(next_run_at);
CREATE INDEX idx_automation_webhooks_key ON automation_webhooks(webhook_key);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_webhooks ENABLE ROW LEVEL SECURITY;

-- Automations policies
CREATE POLICY "Members can view automations in their workspaces"
  ON automations FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Editors can create automations"
  ON automations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Editors can update automations"
  ON automations FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete automations"
  ON automations FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Automation actions policies
CREATE POLICY "Members can view automation actions"
  ON automation_actions FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Editors can manage automation actions"
  ON automation_actions FOR ALL
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Automation runs policies
CREATE POLICY "Members can view automation runs"
  ON automation_runs FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "System can insert automation runs"
  ON automation_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update automation runs"
  ON automation_runs FOR UPDATE
  USING (true);

-- Automation run logs policies
CREATE POLICY "Members can view automation run logs"
  ON automation_run_logs FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM automation_runs WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert automation run logs"
  ON automation_run_logs FOR INSERT
  WITH CHECK (true);

-- Automation schedules policies
CREATE POLICY "Members can view automation schedules"
  ON automation_schedules FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Editors can manage automation schedules"
  ON automation_schedules FOR ALL
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Automation webhooks policies
CREATE POLICY "Members can view automation webhooks"
  ON automation_webhooks FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Editors can manage automation webhooks"
  ON automation_webhooks FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_actions_updated_at
  BEFORE UPDATE ON automation_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_schedules_updated_at
  BEFORE UPDATE ON automation_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get next cron run time (simplified - you may want to use pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION calculate_next_cron_run(
  cron_expr TEXT,
  tz TEXT DEFAULT 'UTC',
  from_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- This is a placeholder - in production, use pg_cron extension or calculate in application code
  -- For now, return next hour as default
  RETURN date_trunc('hour', from_time) + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to increment automation run count
CREATE OR REPLACE FUNCTION increment_automation_run_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE automations 
  SET run_count = run_count + 1,
      last_run_at = NOW()
  WHERE id = NEW.automation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_automation_run_created
  AFTER INSERT ON automation_runs
  FOR EACH ROW EXECUTE FUNCTION increment_automation_run_count();

-- Function to increment webhook trigger count
CREATE OR REPLACE FUNCTION increment_webhook_trigger_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trigger_type = 'webhook' THEN
    UPDATE automation_webhooks 
    SET trigger_count = trigger_count + 1,
        last_triggered_at = NOW()
    WHERE automation_id = NEW.automation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_webhook_automation_run
  AFTER INSERT ON automation_runs
  FOR EACH ROW EXECUTE FUNCTION increment_webhook_trigger_count();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify all tables were created:
-- SELECT 'Automations', COUNT(*) FROM automations
-- UNION ALL SELECT 'Automation Actions', COUNT(*) FROM automation_actions
-- UNION ALL SELECT 'Automation Runs', COUNT(*) FROM automation_runs
-- UNION ALL SELECT 'Automation Run Logs', COUNT(*) FROM automation_run_logs
-- UNION ALL SELECT 'Automation Schedules', COUNT(*) FROM automation_schedules
-- UNION ALL SELECT 'Automation Webhooks', COUNT(*) FROM automation_webhooks;
