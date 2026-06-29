'use client';

import { useEffect, useRef } from 'react';

export function PreviewTracker({ postId }: { postId: string }) {
  // Guard against React StrictMode dev-mode double-fire and against
  // re-firing for the same postId on subsequent renders.
  const sentForRef = useRef<string | null>(null);
  useEffect(() => {
    if (sentForRef.current === postId) return;
    sentForRef.current = postId;
    const controller = new AbortController();
    fetch('/api/content/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, event_type: 'view' }),
      signal: controller.signal,
    }).catch(() => {
      // Silently fail — tracking is non-critical
    });
    return () => controller.abort();
  }, [postId]);

  return null;
}
