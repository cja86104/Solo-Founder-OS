'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  progress: number;
  maxFiles?: number;
  accept?: string;
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading,
  progress,
  maxFiles = 4,
  accept = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm',
}: MediaUploadDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles);
      setSelectedFiles(fileArray);

      // Generate previews
      const newPreviews: string[] = [];
      fileArray.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push(e.target?.result as string);
            if (newPreviews.length === fileArray.filter((f) => f.type.startsWith('image/')).length) {
              setPreviews([...newPreviews]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [maxFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await onUpload(selectedFiles);
    setSelectedFiles([]);
    setPreviews([]);
    onOpenChange(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = (open: boolean) => {
    if (!isUploading) {
      if (!open) {
        setSelectedFiles([]);
        setPreviews([]);
      }
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload images (JPG, PNG, GIF, WebP up to 10MB) or videos (MP4, WebM up to 50MB).
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to browse
          </p>
          <input
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileChange}
            className="hidden"
            id="media-upload-input"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('media-upload-input')?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Max {maxFiles} files
          </p>
        </div>

        {/* Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg border overflow-hidden"
                >
                  {file.type.startsWith('image/') && previews[index] ? (
                    <Image
                      src={previews[index]}
                      alt={file.name}
                      width={200}
                      height={96}
                      className="w-full h-24 object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-24 bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1">
                    <p className="text-[10px] truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>

            {isUploading && (
              <Progress value={progress} className="h-2" />
            )}

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
