-- Content Engine Upgrade: Add missing columns for the full content creator
-- Safe migration pattern — only adds if column doesn't already exist

DO $$
BEGIN
  -- Add content_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_posts' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE content_posts ADD COLUMN content_type TEXT DEFAULT 'post';
  END IF;

  -- Add media_urls column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE content_posts ADD COLUMN media_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add slug column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_posts' AND column_name = 'slug'
  ) THEN
    ALTER TABLE content_posts ADD COLUMN slug TEXT;
  END IF;

  -- Add meta_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_posts' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE content_posts ADD COLUMN meta_description TEXT;
  END IF;

  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_posts' AND column_name = 'category'
  ) THEN
    ALTER TABLE content_posts ADD COLUMN category TEXT;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_content_posts_content_type ON content_posts (content_type);
CREATE INDEX IF NOT EXISTS idx_content_posts_slug ON content_posts (slug);
CREATE INDEX IF NOT EXISTS idx_content_posts_category ON content_posts (category);
