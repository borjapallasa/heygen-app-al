"use client";
import { useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";

export default function useGroupAvatars() {
  const { client } = useAppState();
  const [avatars, setAvatars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchForGroup(groupId: string) {
    if (!client || !groupId) return;
    setLoading(true); setError(null); setAvatars([]);
    try {
      const json = await client.groupAvatars(groupId);
      const list = json?.data?.avatar_list || [];
      setAvatars(list.map((a: any) => ({
        id: a.avatar_id, name: a.avatar_name,
        image: a.preview_image_url, video: a.preview_video_url
      })));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch avatar list');
    } finally { setLoading(false); }
  }

  return { avatars, loading, error, fetchForGroup };
}
