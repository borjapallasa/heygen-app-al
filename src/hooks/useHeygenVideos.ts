"use client";

import { useEffect, useState, useRef } from "react";
import { HEYGEN } from "@/src/lib/constants";
import { useAppState } from "@/src/state/AppStateProvider";

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
  fetchThumbnailForVideo: (videoId: string) => Promise<void>;
};

async function fetchJSON<T>(url: string, apiKey: string, opts: RequestInit = {}): Promise<{ data: T; status: number }> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const error = new Error(`${opts.method || "GET"} ${url} failed`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return { data: await res.json(), status: res.status };
}

export default function useHeygenVideos(): State {
  const { apiKey } = useAppState();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const thumbnailsLoadingRef = useRef<Set<string>>(new Set());
  const failedVideoIdsRef = useRef<Set<string>>(new Set()); // Track videos that failed (404, etc.)
  const videosRef = useRef<VideoItem[]>([]);

  // Keep videosRef in sync with videos state
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Fetch thumbnail for a single video on-demand
  async function fetchThumbnailForVideo(videoId: string): Promise<void> {
    if (!apiKey) return;
    
    // Skip if already loading, already has thumbnail, or previously failed
    if (thumbnailsLoadingRef.current.has(videoId)) return;
    if (failedVideoIdsRef.current.has(videoId)) return; // Don't retry failed videos
    
    // Use ref to get latest videos state to avoid stale closure
    const video = videosRef.current.find(v => v.id === videoId);
    if (!video || video.thumb) return; // Already has thumbnail
    
    thumbnailsLoadingRef.current.add(videoId);
    
    try {
      const result = await fetchJSON<any>(HEYGEN.videoStatus(videoId), apiKey);
      const thumbnailUrl = result.data?.data?.thumbnail_url || result.data?.thumbnail_url || null;
      
      if (thumbnailUrl) {
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, thumb: thumbnailUrl } : v
        ));
      }
    } catch (e: any) {
      // Track failed requests, especially 404s, to prevent retrying
      if (e?.status === 404 || e?.status >= 400) {
        failedVideoIdsRef.current.add(videoId);
        console.debug(`Video ${videoId} not found (${e.status}), skipping future requests`);
      } else {
        // For other errors, log but don't mark as permanently failed
        console.debug(`Failed to fetch thumbnail for video ${videoId}:`, e);
      }
    } finally {
      thumbnailsLoadingRef.current.delete(videoId);
    }
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
        const result = await fetchJSON<any>(`${HEYGEN.videosList}?${params.toString()}`, apiKey, { signal });
        const list = result.data?.data?.videos || result.data?.videos || [];
        const normalized: VideoItem[] = list.map((v: any) => ({
          id: v.video_id,
          title: v.video_title || "Untitled",
          status: String(v.status || "").toLowerCase(),
          createdAt: v.created_at,
          type: v.type || "GENERATED",
          thumb: null
        }));
        // Don't fetch thumbnails automatically - they will be loaded lazily
        setVideos(normalized);
        setToken(result.data?.data?.token || result.data?.token || null);
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
      const result = await fetchJSON<any>(`${HEYGEN.videosList}?${params.toString()}`, apiKey, { signal });
      const list = result.data?.data?.videos || result.data?.videos || [];
      const normalized: VideoItem[] = list.map((v: any) => ({
        id: v.video_id,
        title: v.video_title || "Untitled",
        status: String(v.status || "").toLowerCase(),
        createdAt: v.created_at,
        type: v.type || "GENERATED",
        thumb: null
      }));
      // Don't fetch thumbnails automatically - they will be loaded lazily
      setVideos((prev) => [...prev, ...normalized]);
      setToken(result.data?.data?.token || result.data?.token || null);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e.message || "Failed to fetch videos");
    } finally {
      setLoadingMore(false);
    }
  }

  return { videos, loading, error, token, loadingMore, loadMore, fetchThumbnailForVideo };
}
