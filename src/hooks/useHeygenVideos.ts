"use client";

import { useEffect, useState } from "react";
import { HEYGEN } from "@/lib/constants";
import { useAppState } from "@/state/AppStateProvider";

export type VideoItem = {
  id: string;
  title: string;
  status: string;
  createdAt: number | string;
  type: string;
  thumb: string | null;
};

type State = {
  videos: VideoItem[];
  loading: boolean;
  error: string | null;
  token: string | null;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
};

async function fetchJSON<T>(url: string, apiKey: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${url} failed`);
  return res.json();
}

export default function useHeygenVideos(): State {
  const { apiKey } = useAppState();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  async function fetchThumbsBatched(items: VideoItem[], signal: AbortSignal, apiKey: string, size = 8) {
    const out: VideoItem[] = [];
    for (let i = 0; i < items.length; i += size) {
      const batch = items.slice(i, i + size);
      const done = await Promise.all(
        batch.map(async (v) => {
          try {
            const json = await fetchJSON<any>(HEYGEN.videoStatus(v.id), apiKey, { signal });
            const t = json?.data?.thumbnail_url || null;
            return { ...v, thumb: t || v.thumb };
          } catch {
            return v;
          }
        })
      );
      out.push(...done);
    }
    return out;
  }

  // initial load
  useEffect(() => {
    if (!apiKey) return; // do nothing until user provides a key
    const controller = new AbortController();
    const { signal } = controller;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "50" });
        const json = await fetchJSON<any>(`${HEYGEN.videosList}?${params.toString()}`, apiKey, { signal });
        const list = json?.data?.videos || [];
        const normalized: VideoItem[] = list.map((v: any) => ({
          id: v.video_id,
          title: v.video_title || "Untitled",
          status: String(v.status || "").toLowerCase(),
          createdAt: v.created_at,
          type: v.type || "GENERATED",
          thumb: null
        }));
        const withThumbs = await fetchThumbsBatched(normalized, signal, apiKey);
        setVideos(withThumbs);
        setToken(json?.data?.token || null);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e.message || "Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [apiKey]);

  // load more
  async function loadMore() {
    if (!apiKey || !token || loadingMore) return;
    const controller = new AbortController();
    const { signal } = controller;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: "50", token });
      const json = await fetchJSON<any>(`${HEYGEN.videosList}?${params.toString()}`, apiKey, { signal });
      const list = json?.data?.videos || [];
      const normalized: VideoItem[] = list.map((v: any) => ({
        id: v.video_id,
        title: v.video_title || "Untitled",
        status: String(v.status || "").toLowerCase(),
        createdAt: v.created_at,
        type: v.type || "GENERATED",
        thumb: null
      }));
      const withThumbs = await fetchThumbsBatched(normalized, signal, apiKey);
      setVideos((prev) => [...prev, ...withThumbs]);
      setToken(json?.data?.token || null);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e.message || "Failed to fetch videos");
    } finally {
      setLoadingMore(false);
    }
  }

  return { videos, loading, error, token, loadingMore, loadMore };
}
