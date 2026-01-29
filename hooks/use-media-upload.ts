'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

interface UseMediaUploadOptions {
  workspaceId: string;
  bucket?: string;
}

interface UploadResult {
  url: string;
  type: 'image' | 'video';
  name: string;
}

export function useMediaUpload({ workspaceId }: UseMediaUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): { valid: boolean; type: 'image' | 'video' } => {
    if (IMAGE_TYPES.includes(file.type)) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error('Image must be less than 10MB');
        return { valid: false, type: 'image' };
      }
      return { valid: true, type: 'image' };
    }

    if (VIDEO_TYPES.includes(file.type)) {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error('Video must be less than 50MB');
        return { valid: false, type: 'video' };
      }
      return { valid: true, type: 'video' };
    }

    toast.error('Unsupported file type. Use JPG, PNG, GIF, WebP, MP4, or WebM.');
    return { valid: false, type: 'image' };
  };

  const upload = async (file: File): Promise<UploadResult | null> => {
    const { valid } = validateFile(file);
    if (!valid) return null;

    setIsUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceId);

      setProgress(30);

      const res = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      setProgress(80);

      const result = await res.json();

      setProgress(100);

      return {
        url: result.url,
        type: result.type,
        name: result.name,
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const uploadMultiple = async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (const file of files) {
      const result = await upload(file);
      if (result) results.push(result);
    }
    return results;
  };

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    validateFile,
  };
}
