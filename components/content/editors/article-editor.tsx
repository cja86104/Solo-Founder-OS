'use client';

import { useState } from 'react';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { MediaUploadDialog } from '@/components/editor/media-upload-dialog';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { generateSlug } from '@/types/content';

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (desc: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  workspaceId: string;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function ArticleEditor({
  content,
  onChange,
  title,
  onTitleChange,
  slug,
  onSlugChange,
  metaDescription,
  onMetaDescriptionChange,
  category,
  onCategoryChange,
  workspaceId,
}: ArticleEditorProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { upload, isUploading, progress } = useMediaUpload({ workspaceId });

  const wordCount = countWords(content);
  const readTime = estimateReadTime(wordCount);

  const handleImageUpload = async (files: File[]) => {
    // For articles, we don't use the media_urls array - images go inline
    // This is handled by the onImageInsert callback
    const result = await upload(files[0]);
    if (result) {
      // We'll use a callback to insert into the editor
      onChange(
        content +
          `<img src="${result.url}" alt="${result.name}" />`
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Main editor */}
      <div className="space-y-4">
        <div>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Article title..."
            className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 shadow-none"
          />
        </div>

        <RichTextEditor
          content={content}
          onChange={onChange}
          variant="full"
          placeholder="Start writing your article..."
          onImageUpload={() => setUploadOpen(true)}
          editorClassName="min-h-[500px]"
        />

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{wordCount} words</span>
          <span>{readTime} min read</span>
        </div>
      </div>

      {/* SEO Sidebar */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-3">SEO Settings</h3>
          <Separator className="mb-4" />
        </div>

        <div className="space-y-2">
          <Label>URL Slug</Label>
          <div className="flex gap-2">
            <Input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="my-article"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSlugChange(generateSlug(title))}
            >
              Generate
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Meta Description</Label>
          <Textarea
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            placeholder="Brief description for search engines..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {metaDescription.length}/160 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            placeholder="e.g., Marketing, Product"
          />
        </div>
      </div>

      <MediaUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleImageUpload}
        isUploading={isUploading}
        progress={progress}
        maxFiles={1}
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
    </div>
  );
}
