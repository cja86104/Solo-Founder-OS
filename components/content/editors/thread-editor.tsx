'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { MediaUploadDialog } from '@/components/editor/media-upload-dialog';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { Button } from '@/components/ui/button';
import { ImageIcon, Plus, Trash2, GripVertical } from 'lucide-react';

export interface ThreadSegment {
  text: string;
  media_url?: string;
}

interface ThreadEditorProps {
  segments: ThreadSegment[];
  onChange: (segments: ThreadSegment[]) => void;
  workspaceId: string;
}

export function ThreadEditor({
  segments,
  onChange,
  workspaceId,
}: ThreadEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { upload, isUploading, progress } = useMediaUpload({ workspaceId });

  const updateSegment = (index: number, updates: Partial<ThreadSegment>) => {
    const updated = segments.map((seg, i) =>
      i === index ? { ...seg, ...updates } : seg
    );
    onChange(updated);
  };

  const addSegment = () => {
    onChange([...segments, { text: '' }]);
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 1) return;
    onChange(segments.filter((_, i) => i !== index));
  };

  const moveSegment = (from: number, to: number) => {
    if (to < 0 || to >= segments.length) return;
    const updated = [...segments];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  const handleMediaUpload = async (files: File[]) => {
    if (uploadingIndex === null) return;
    const result = await upload(files[0]);
    if (result) {
      updateSegment(uploadingIndex, { media_url: result.url });
    }
    setUploadingIndex(null);
  };

  const removeMedia = (index: number) => {
    updateSegment(index, { media_url: undefined });
  };

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => (
        <div
          key={index}
          className="relative border rounded-lg p-3 space-y-2"
        >
          {/* Segment header */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">
              {index + 1}/{segments.length}
            </span>

            <div className="flex-1" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => moveSegment(index, index - 1)}
              disabled={index === 0}
            >
              <GripVertical className="h-3 w-3 rotate-90" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setUploadingIndex(index);
              }}
            >
              <ImageIcon className="h-3 w-3" />
            </Button>

            {segments.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => removeSegment(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Editor */}
          <RichTextEditor
            content={segment.text}
            onChange={(html) => updateSegment(index, { text: html })}
            variant="simple"
            placeholder={
              index === 0
                ? 'Start your thread...'
                : `Continue thread (${index + 1})...`
            }
            maxLength={280}
            editorClassName="min-h-[80px]"
          />

          {/* Segment media */}
          {segment.media_url && (
            <div className="relative group rounded-lg border overflow-hidden">
              <Image
                src={segment.media_url}
                alt=""
                width={400}
                height={160}
                className="w-full max-h-40 object-cover"
                unoptimized
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSegment}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Segment
      </Button>

      <MediaUploadDialog
        open={uploadingIndex !== null}
        onOpenChange={(open) => {
          if (!open) setUploadingIndex(null);
        }}
        onUpload={handleMediaUpload}
        isUploading={isUploading}
        progress={progress}
        maxFiles={1}
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
    </div>
  );
}
