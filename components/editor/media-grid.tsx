'use client';

import { Button } from '@/components/ui/button';
import { X, ImageIcon, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaGridProps {
  mediaUrls: string[];
  onRemove?: (url: string) => void;
  readonly?: boolean;
  className?: string;
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

export function MediaGrid({
  mediaUrls,
  onRemove,
  readonly = false,
  className,
}: MediaGridProps) {
  if (mediaUrls.length === 0) return null;

  const hasVideo = mediaUrls.some(isVideo);

  return (
    <div
      className={cn(
        'grid gap-2',
        mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
        className
      )}
    >
      {mediaUrls.map((url, index) => (
        <div
          key={url}
          className={cn(
            'relative group rounded-lg border overflow-hidden',
            mediaUrls.length === 1 ? 'aspect-video' : 'aspect-square',
            mediaUrls.length === 3 && index === 0 && 'row-span-2 aspect-auto'
          )}
        >
          {isVideo(url) ? (
            <div className="relative w-full h-full">
              <video
                src={url}
                className="w-full h-full object-cover"
                controls={readonly}
              />
              {!readonly && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Film className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          ) : (
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}

          {!readonly && onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(url)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
