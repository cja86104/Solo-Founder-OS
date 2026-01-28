-- ============================================================================
-- Solo Founder OS - Invoicing System Migration
-- Invoices, Invoice Items, and Payment Tracking
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded');
CREATE TYPE invoice_item_type AS ENUM ('service', 'product', 'expense', 'discount', 'tax');
CREATE TYPE payment_method AS ENUM ('stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'other');

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL,
  reference TEXT,
  
  -- Client information (can be linked to contact or standalone)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_company TEXT,
  client_address TEXT,
  client_phone TEXT,
  client_tax_id TEXT,
  
  -- Project link (optional - for project-based billing)
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Financial
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  
  -- Status and tracking
  status invoice_status DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  -- Payment
  payment_method payment_method,
  payment_reference TEXT,
  
  -- Content
  notes TEXT,
  terms TEXT,
  footer TEXT,
  
  -- Branding
  logo_url TEXT,
  accent_color TEXT DEFAULT '#6366f1',
  
  -- Public access
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workspace_id, invoice_number)
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Item details
  type invoice_item_type DEFAULT 'service',
  description TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Tax handling per item
  is_taxable BOOLEAN DEFAULT TRUE,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Optional links
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  
  -- Ordering
  position INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method payment_method NOT NULL,
  reference TEXT,
  
  -- Dates
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Activity details
  action TEXT NOT NULL,
  description TEXT,
  
  -- For status changes
  from_status invoice_status,
  to_status invoice_status,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX idx_invoices_status ON invoices(workspace_id, status);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_public_token ON invoices(public_token);
CREATE INDEX idx_invoices_number ON invoices(workspace_id, invoice_number);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_workspace ON invoice_items(workspace_id);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_workspace ON invoice_payments(workspace_id);

CREATE INDEX idx_invoice_activities_invoice ON invoice_activities(invoice_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate next invoice number for workspace
CREATE OR REPLACE FUNCTION generate_invoice_number(p_workspace_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
  year_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  prefix := 'INV-' || year_part || '-';
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 1) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE workspace_id = p_workspace_id
    AND invoice_number LIKE prefix || '%';
  
  RETURN prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal DECIMAL(12,2);
  v_tax_amount DECIMAL(12,2);
  v_total DECIMAL(12,2);
  v_invoice_tax_rate DECIMAL(5,2);
BEGIN
  -- Get invoice tax rate
  SELECT tax_rate INTO v_invoice_tax_rate
  FROM invoices WHERE id = NEW.invoice_id;
  
  -- Calculate subtotal from items
  SELECT COALESCE(SUM(amount), 0) INTO v_subtotal
  FROM invoice_items
  WHERE invoice_id = NEW.invoice_id;
  
  -- Calculate tax amount
  SELECT COALESCE(SUM(
    CASE WHEN is_taxable THEN amount * COALESCE(v_invoice_tax_rate, 0) / 100 ELSE 0 END
  ), 0) INTO v_tax_amount
  FROM invoice_items
  WHERE invoice_id = NEW.invoice_id;
  
  -- Get total
  SELECT subtotal - discount_amount + tax_amount INTO v_total
  FROM invoices WHERE id = NEW.invoice_id;
  
  -- Update invoice
  UPDATE invoices
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total = v_subtotal - COALESCE(discount_amount, 0) + v_tax_amount,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$;

-- Update invoice amount_paid when payment added
CREATE OR REPLACE FUNCTION update_invoice_amount_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_paid DECIMAL(12,2);
  v_invoice_total DECIMAL(12,2);
BEGIN
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Get invoice total
  SELECT total INTO v_invoice_total
  FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update invoice
  UPDATE invoices
  SET 
    amount_paid = v_total_paid,
    status = CASE 
      WHEN v_total_paid >= v_invoice_total THEN 'paid'::invoice_status
      WHEN status = 'paid' AND v_total_paid < v_invoice_total THEN 'sent'::invoice_status
      ELSE status
    END,
    paid_date = CASE 
      WHEN v_total_paid >= v_invoice_total THEN CURRENT_DATE
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Auto-update invoice status for overdue
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE
    AND amount_paid < total;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_calculate_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

CREATE TRIGGER trigger_update_invoice_amount_paid
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_amount_paid();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_activities ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Members can view invoices in their workspaces"
  ON invoices FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR public_token IS NOT NULL
  );

CREATE POLICY "Members can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Members can update invoices"
  ON invoices FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Invoice items policies
CREATE POLICY "Members can view invoice items"
  ON invoice_items FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage invoice items"
  ON invoice_items FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

-- Invoice payments policies
CREATE POLICY "Members can view payments"
  ON invoice_payments FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage payments"
  ON invoice_payments FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

-- Invoice activities policies
CREATE POLICY "Members can view activities"
  ON invoice_activities FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "System can insert activities"
  ON invoice_activities FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoice_items TO authenticated;
GRANT ALL ON invoice_payments TO authenticated;
GRANT ALL ON invoice_activities TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_invoices() TO authenticated;
