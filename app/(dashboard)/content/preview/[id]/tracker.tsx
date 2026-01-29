'use client';

import { useEffect } from 'react';

export function PreviewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    // Track a view when the preview is opened
    fetch('/api/content/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, event_type: 'view' }),
    }).catch(() => {
      // Silently fail — tracking is non-critical
    });
  }, [postId]);

  return null;
}
