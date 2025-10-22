"use client";
import { useEffect, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";

const BATCH = 8;

export default function useHeygenVideos() {
  const { client } = useAppState();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // initial load
  useEffect(() => {
    if (!client) return; // no key, no fetch
    const ctrl = new AbortController();
    const { signal } = ctrl;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "50" });
        const base = client.endpoints.videosList + "?" + params.toString();
        const json = await client.json(base, { signal });
        const list = json?.data?.videos || [];
        const normalized = list.map((v: any) => ({
          id: v.video_id,
          title: v.video_title || "Untitled",
          status: String(v.status || "").toLowerCase(),
          createdAt: v.created_at,
          type: v.type || "GENERATED",
          thumb: null,
        }));

        // thumbnails (batched)
        const out: any[] = [];
        for (let i=0; i<normalized.length; i += BATCH) {
          const batch = normalized.slice(i, i+BATCH);
          const fetched = await Promise.all(
            batch.map(async (item) => {
              try {
                const s = await client.json(client.endpoints.videoStatus(item.id), { signal });
                return { ...item, thumb: s?.data?.thumbnail_url || null };
              } catch { return item; }
            })
          );
          out.push(...fetched);
        }

        setVideos(out);
        setToken(json?.data?.token || null);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [client]);

  async function loadMore() {
    if (!client || !token || loadingMore) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: "50", token });
      const base = client.endpoints.videosList + "?" + params.toString();
      const json = await client.json(base, { signal });
      const list = json?.data?.videos || [];
      const normalized = list.map((v: any) => ({
        id: v.video_id,
        title: v.video_title || "Untitled",
        status: String(v.status || "").toLowerCase(),
        createdAt: v.created_at,
        type: v.type || "GENERATED",
        thumb: null,
      }));

      const out: any[] = [];
      for (let i=0; i<normalized.length; i += BATCH) {
        const batch = normalized.slice(i, i+BATCH);
        const fetched = await Promise.all(
          batch.map(async (item) => {
            try {
              const s = await client.json(client.endpoints.videoStatus(item.id), { signal });
              return { ...item, thumb: s?.data?.thumbnail_url || null };
            } catch { return item; }
          })
        );
        out.push(...fetched);
      }

      setVideos(prev => [...prev, ...out]);
      setToken(json?.data?.token || null);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  return { videos, loading, error, token, loadingMore, loadMore };
}
