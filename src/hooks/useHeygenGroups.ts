"use client";
import { useEffect, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { getStatusPlaceholder } from "@/src/lib/utils";

export default function useHeygenVideos() {
  const { client } = useAppState();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function withThumbs(list: any[], signal?: AbortSignal) {
    const results = [];
    for (const v of list) {
      try {
        const json = await client!.videoStatus(v.id, signal);
        const t = json?.data?.thumbnail_url || null;
        results.push({ ...v, thumb: t || v.thumb || getStatusPlaceholder(v.status) });
      } catch {
        results.push({ ...v, thumb: v.thumb || getStatusPlaceholder(v.status) });
      }
    }
    return results;
  }

  useEffect(() => {
    if (!client) return;
    const ctl = new AbortController();
    setLoading(true); setError(null);
    client.listVideos({ limit: '50' }, ctl.signal)
      .then(async (json) => {
        const list = json?.data?.videos || [];
        const normalized = list.map((v: any) => ({
          id: v.video_id,
          title: v.video_title || 'Untitled',
          status: (v.status || '').toLowerCase(),
          createdAt: v.created_at,
          type: v.type || 'GENERATED',
          thumb: null,
        }));
        setVideos(await withThumbs(normalized, ctl.signal));
        setToken(json?.data?.token || null);
      })
      .catch((e) => { if (e?.name !== 'AbortError') setError(e.message || 'Failed to fetch videos'); })
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [client]);

  async function loadMore() {
    if (!client || !token || loadingMore) return;
    const ctl = new AbortController();
    setLoadingMore(true);
    try {
      const json = await client.listVideos({ limit: '50', token }, ctl.signal);
      const list = json?.data?.videos || [];
      const normalized = list.map((v: any) => ({
        id: v.video_id, title: v.video_title || 'Untitled',
        status: (v.status || '').toLowerCase(), createdAt: v.created_at, type: v.type || 'GENERATED', thumb: null,
      }));
      const extra = await withThumbs(normalized, ctl.signal);
      setVideos(prev => [...prev, ...extra]);
      setToken(json?.data?.token || null);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e.message || 'Failed to fetch videos');
    } finally { setLoadingMore(false); }
  }

  return { videos, loading, error, token, loadingMore, loadMore };
}
