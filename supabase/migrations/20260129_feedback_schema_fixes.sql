-- ============================================================================
-- Founders Helm - Feedback Schema Fixes
-- Adds missing columns, fixes status types, enables RLS
-- ============================================================================

-- ============================================================================
-- 1. Fix feedback_submissions: change status from enum to TEXT
-- The frontend uses 'new','in_review','resolved','archived' but the DB enum
-- has 'new','under_review','planned','in_progress','completed','declined'
-- Switching to TEXT avoids enum constraint issues
-- ============================================================================

ALTER TABLE feedback_submissions
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

ALTER TABLE feedback_submissions
  ALTER COLUMN status SET DEFAULT 'new';

-- Also change type from enum to TEXT for flexibility
ALTER TABLE feedback_submissions
  ALTER COLUMN type TYPE TEXT USING type::TEXT;

ALTER TABLE feedback_submissions
  ALTER COLUMN type SET DEFAULT 'other';

-- ============================================================================
-- 2. Add missing columns to feedback_submissions
-- ============================================================================

-- The frontend uses 'message' but DB has 'content'. Add message as alias approach:
-- We'll keep 'content' and handle mapping in the API. No column rename needed.

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN rating INTEGER;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN emoji_rating TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN screen_size TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN internal_notes TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_submissions ADD COLUMN resolved_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================================
-- 3. Add missing columns to feedback_widgets
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN slug TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN theme TEXT DEFAULT 'auto';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN primary_color TEXT DEFAULT '#6366f1';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN position TEXT DEFAULT 'bottom-right';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN title TEXT DEFAULT 'Send us feedback';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN placeholder TEXT DEFAULT 'What''s on your mind?';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN success_message TEXT DEFAULT 'Thank you for your feedback!';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN allow_attachments BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN require_email BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN show_emoji_rating BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feedback_widgets ADD COLUMN categories TEXT[] DEFAULT ARRAY['bug','feature','question','other']::TEXT[];
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Note: DB already has 'domains' column, TypeScript uses 'allowed_domains'
-- We'll handle mapping in the API

-- ============================================================================
-- 4. Enable RLS on feedback tables
-- ============================================================================

ALTER TABLE feedback_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies for feedback_widgets
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY "Members can view feedback widgets in their workspaces"
    ON feedback_widgets FOR SELECT
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can create feedback widgets"
    ON feedback_widgets FOR INSERT
    WITH CHECK (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can update feedback widgets"
    ON feedback_widgets FOR UPDATE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete feedback widgets"
    ON feedback_widgets FOR DELETE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 6. RLS Policies for feedback_submissions
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY "Members can view feedback submissions in their workspaces"
    ON feedback_submissions FOR SELECT
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public submissions (from embedded widget) - anyone can insert
DO $$ BEGIN
  CREATE POLICY "Anyone can submit feedback via widget"
    ON feedback_submissions FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Editors can update feedback submissions"
    ON feedback_submissions FOR UPDATE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete feedback submissions"
    ON feedback_submissions FOR DELETE
    USING (workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 7. Indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_feedback_widgets_slug ON feedback_widgets(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_contact ON feedback_submissions(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_assigned ON feedback_submissions(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status ON feedback_submissions(status);
