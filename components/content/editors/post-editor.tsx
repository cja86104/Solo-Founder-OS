'use client';

import { useState } from 'react';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { MediaGrid } from '@/components/editor/media-grid';
import { MediaUploadDialog } from '@/components/editor/media-upload-dialog';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  youtube: 5000,
  medium: 100000,
  substack: 100000,
  blog: 100000,
};

interface PostEditorProps {
  content: string;
  onChange: (content: string) => void;
  mediaUrls: string[];
  onMediaChange: (urls: string[]) => void;
  platforms: string[];
  workspaceId: string;
}

export function PostEditor({
  content,
  onChange,
  mediaUrls,
  onMediaChange,
  platforms,
  workspaceId,
}: PostEditorProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { upload, uploadMultiple, isUploading, progress } = useMediaUpload({
    workspaceId,
  });

  // Find most restrictive character limit
  const maxLength =
    platforms.length > 0
      ? Math.min(
          ...platforms.map((p) => PLATFORM_LIMITS[p] || 100000)
        )
      : undefined;

  const handleMediaUpload = async (files: File[]) => {
    // Enforce limits: max 4 images or 1 video
    const hasVideo = files.some((f) => f.type.startsWith('video/'));
    if (hasVideo) {
      const result = await upload(files[0]);
      if (result) {
        onMediaChange([result.url]);
      }
    } else {
      const remaining = 4 - mediaUrls.length;
      const toUpload = files.slice(0, remaining);
      const results = await uploadMultiple(toUpload);
      onMediaChange([...mediaUrls, ...results.map((r) => r.url)]);
    }
  };

  const handleRemoveMedia = (url: string) => {
    onMediaChange(mediaUrls.filter((u) => u !== url));
  };

  return (
    <div className="space-y-3">
      <RichTextEditor
        content={content}
        onChange={onChange}
        variant="simple"
        placeholder="What's on your mind?"
        maxLength={maxLength}
      />

      <MediaGrid
        mediaUrls={mediaUrls}
        onRemove={handleRemoveMedia}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUploadOpen(true)}
          disabled={mediaUrls.length >= 4}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Add Media
        </Button>
        {mediaUrls.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {mediaUrls.length}/4 files
          </span>
        )}
      </div>

      <MediaUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleMediaUpload}
        isUploading={isUploading}
        progress={progress}
        maxFiles={4 - mediaUrls.length}
      />
    </div>
  );
}
