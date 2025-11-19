"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  refetch: () => Promise<void>;
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
  const thumbnailQueueRef = useRef<string[]>([]);
  const processingQueueRef = useRef<boolean>(false);
  const MAX_CONCURRENT_THUMBNAILS = 3; // Limit concurrent requests
  const THUMBNAIL_REQUEST_DELAY = 100; // Delay between requests in ms

  // Keep videosRef in sync with videos state
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Process thumbnail queue with rate limiting
  const processThumbnailQueue = useCallback(async () => {
    if (processingQueueRef.current || !apiKey) return;
    
    processingQueueRef.current = true;
    
    while (thumbnailQueueRef.current.length > 0) {
      const batch = thumbnailQueueRef.current.splice(0, MAX_CONCURRENT_THUMBNAILS);
      
      // Process batch in parallel
      await Promise.allSettled(
        batch.map(async (videoId) => {
          // Skip if already loading, already has thumbnail, or previously failed
          if (thumbnailsLoadingRef.current.has(videoId)) return;
          if (failedVideoIdsRef.current.has(videoId)) return;
          
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
              // Only log in development to reduce console noise
              if (process.env.NODE_ENV === 'development') {
                console.debug(`Video ${videoId} not found (${e.status}), skipping future requests`);
              }
            }
          } finally {
            thumbnailsLoadingRef.current.delete(videoId);
          }
        })
      );
      
      // Delay before next batch to avoid overwhelming the API
      if (thumbnailQueueRef.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, THUMBNAIL_REQUEST_DELAY));
      }
    }
    
    processingQueueRef.current = false;
  }, [apiKey]);

  // Fetch thumbnail for a single video on-demand (queued)
  const fetchThumbnailForVideo = useCallback(async (videoId: string): Promise<void> => {
    if (!apiKey) return;
    
    // Skip if already in queue, loading, has thumbnail, or previously failed
    if (thumbnailQueueRef.current.includes(videoId)) return;
    if (thumbnailsLoadingRef.current.has(videoId)) return;
    if (failedVideoIdsRef.current.has(videoId)) return;
    
    const video = videosRef.current.find(v => v.id === videoId);
    if (!video || video.thumb) return; // Already has thumbnail
    
    // Add to queue
    thumbnailQueueRef.current.push(videoId);
    
    // Process queue (will be debounced by processingQueueRef)
    // Don't await - fire and forget, queue will process asynchronously
    processThumbnailQueue();
  }, [apiKey, processThumbnailQueue]);

  // Fetch videos function (extracted for reuse)
  const fetchVideos = useCallback(async (signal?: AbortSignal) => {
    if (!apiKey) return;
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
  }, [apiKey]);

  // Refetch function (can be called manually)
  const refetch = useCallback(async () => {
    await fetchVideos();
  }, [fetchVideos]);

  // initial load
  useEffect(() => {
    if (!apiKey) return; // do nothing until user provides a key
    const controller = new AbortController();
    const { signal } = controller;
    fetchVideos(signal);
    return () => controller.abort();
  }, [apiKey, fetchVideos]);

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

  return { videos, loading, error, token, loadingMore, loadMore, fetchThumbnailForVideo, refetch };
}
