-- Content Media Storage: Create bucket and policies for content media uploads

-- Create the storage bucket (public so we can serve images/videos directly)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-media', 'content-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload files to their workspace folder
CREATE POLICY "Authenticated users can upload content media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-media');

-- Policy: Anyone can view content media (bucket is public)
CREATE POLICY "Public can view content media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'content-media');

-- Policy: Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update content media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'content-media');

-- Policy: Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete content media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'content-media');
