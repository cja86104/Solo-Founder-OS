-- Content Analytics: Engagement tracking table
-- Tracks views, likes, shares, comments per post

CREATE TABLE IF NOT EXISTS content_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_content_engagement_post_id ON content_engagement (post_id);

-- Enable RLS
ALTER TABLE content_engagement ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view engagement for posts in their workspaces
CREATE POLICY "Users can view engagement for their workspace posts"
  ON content_engagement
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_posts cp
      JOIN workspace_members wm ON cp.workspace_id = wm.workspace_id
      WHERE cp.id = content_engagement.post_id
      AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can insert/update engagement (for tracking)
CREATE POLICY "Users can track engagement"
  ON content_engagement
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update engagement"
  ON content_engagement
  FOR UPDATE
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_engagement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_engagement_updated_at ON content_engagement;
CREATE TRIGGER trigger_content_engagement_updated_at
  BEFORE UPDATE ON content_engagement
  FOR EACH ROW
  EXECUTE FUNCTION update_content_engagement_updated_at();
