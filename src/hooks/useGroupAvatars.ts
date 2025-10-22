"use client";
import { useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";

type Avatar = { id: string; name: string; image?: string; video?: string; };

export default function useGroupAvatars() {
  const { client } = useAppState();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchForGroup(groupId?: string) {
    if (!client || !groupId) return; // guard
    setLoading(true);
    setError(null);
    setAvatars([]);

    try {
      const url = client.endpoints.groupAvatars(groupId);
      const json = await client.json(url);
      const list = json?.data?.avatar_list || [];
      const mapped: Avatar[] = list.map((a: any) => ({
        id: a.avatar_id,
        name: a.avatar_name,
        image: a.preview_image_url,
        video: a.preview_video_url,
      }));
      setAvatars(mapped);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch avatar list");
    } finally {
      setLoading(false);
    }
  }

  return { avatars, loading, error, fetchForGroup };
}
