// 'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Small helper that only fires when apiKey exists.
 */
async function fetchJSON(url, apiKey, opts = {}) {
  if (!apiKey) throw new Error('Missing HeyGen API key');
  const res = await fetch(url, {
    ...opts,
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${opts.method || 'GET'} ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

const HEYGEN = {
  videosList: 'https://api.heygen.com/v1/video.list',
  videoStatus: (id) => `https://api.heygen.com/v1/video_status.get?video_id=${id}`,
};

/**
 * useHeygenVideos
 * - paginates 50-by-50
 * - fetches thumbnails via video_status.get (batched)
 *
 * @param {string|null} apiKey  pass the user-provided key; if falsy, the hook stays idle
 */
export default function useHeygenVideos(apiKey) {
  const [videos, setVideos] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(Boolean(apiKey)); // start loading only if we have a key
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // simple placeholder depending on status
  const statusPlaceholder = (status) => {
    const ok = String(status || '').toLowerCase() === 'completed';
    return ok
      ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="%23e2e8f0"/></svg>'
      : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="%23fee2e2"/></svg>';
  };

  async function fetchThumbsBatched(items, signal, size = 8) {
    const out = [];
    for (let i = 0; i < items.length; i += size) {
      const batch = items.slice(i, i + size);
      const done = await Promise.all(
        batch.map(async (v) => {
          try {
            const json = await fetchJSON(HEYGEN.videoStatus(v.id), apiKey, { signal });
            const t = json?.data?.thumbnail_url || null;
            return { ...v, thumb: t || v.thumb || statusPlaceholder(v.status) };
          } catch {
            return { ...v, thumb: v.thumb || statusPlaceholder(v.status) };
          }
        })
      );
      out.push(...done);
    }
    return out;
  }

  // initial load: only when apiKey is present
  useEffect(() => {
    if (!apiKey) {
      // reset to idle when key is missing/cleared
      setVideos([]);
      setToken(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: '50' });
        const json = await fetchJSON(`${HEYGEN.videosList}?${params}`, apiKey, { signal });
        const list = json?.data?.videos || [];
        const normalized = list.map((v) => ({
          id: v.video_id,
          title: v.video_title || 'Untitled',
          status: (v.status || '').toLowerCase(),
          createdAt: v.created_at,
          type: v.type || 'GENERATED',
          thumb: null,
        }));
        const withThumbs = await fetchThumbsBatched(normalized, signal);
        setVideos(withThumbs);
        setToken(json?.data?.token || null);
      } catch (e) {
        if (e?.name !== 'AbortError') setError(e.message || 'Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [apiKey]); // refetch when key changes

  async function loadMore() {
    if (!apiKey || !token || loadingMore) return;
    const controller = new AbortController();
    const { signal } = controller;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: '50', token });
      const json = await fetchJSON(`${HEYGEN.videosList}?${params}`, apiKey, { signal });
      const list = json?.data?.videos || [];
      const normalized = list.map((v) => ({
        id: v.video_id,
        title: v.video_title || 'Untitled',
        status: (v.status || '').toLowerCase(),
        createdAt: v.created_at,
        type: v.type || 'GENERATED',
        thumb: null,
      }));
      const withThumbs = await fetchThumbsBatched(normalized, signal);
      setVideos((prev) => [...prev, ...withThumbs]);
      setToken(json?.data?.token || null);
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'Failed to fetch more videos');
    } finally {
      setLoadingMore(false);
    }
  }

  return { videos, loading, error, token, loadingMore, loadMore };
}
