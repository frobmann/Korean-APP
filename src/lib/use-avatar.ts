'use client';

import { useState, useCallback, useRef } from 'react';

const clientCache = new Map<string, string>();

export function useAvatar() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    const cached = clientCache.get(text);
    if (cached) {
      setVideoUrl(cached);
      return;
    }

    pendingRef.current = text;

    try {
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.video_url && pendingRef.current === text) {
        clientCache.set(text, data.video_url);
        setVideoUrl(data.video_url);
      }
    } catch {
      // D-ID not available, SVG avatar stays
    }
  }, []);

  const clear = useCallback(() => {
    setVideoUrl(null);
    pendingRef.current = null;
  }, []);

  return { videoUrl, speak, clear };
}
