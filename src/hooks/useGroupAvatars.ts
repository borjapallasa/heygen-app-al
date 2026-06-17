"use client";
import { useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";

type Avatar = {
  id: string;
  name: string;
  image?: string;
  video?: string;
  kind: "avatar" | "talking_photo";
};

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

      // HeyGen's avatar_group/{id}/avatars endpoint mixes TWO different
      // item shapes in the same `avatar_list` array:
      //   - "avatar"        (trained from real video footage): avatar_id,
      //                      avatar_name, preview_image_url, preview_video_url
      //   - "talking photo" (generated from a still photo):    id, name,
      //                      image_url, motion_preview_url, status
      // The previous code only read the "avatar_id" shape, so every
      // talking-photo entry mapped to id: undefined / image: undefined and
      // silently disappeared (and all shared the same React key).
      const mapped: Avatar[] = list
        // Skip talking photos that haven't finished generating yet.
        // "avatar" items don't carry a status field at all, so they pass.
        .filter((a: any) => !a.status || a.status === "completed")
        .map((a: any) => {
          const isTalkingPhoto = a.avatar_id == null;
          return {
            id: a.avatar_id ?? a.id,
            name: a.avatar_name ?? a.name,
            image: a.preview_image_url ?? a.image_url,
            video: a.preview_video_url ?? a.motion_preview_url ?? undefined,
            kind: isTalkingPhoto ? "talking_photo" : "avatar",
          } as Avatar;
        })
        // Belt-and-suspenders: drop anything we still couldn't identify.
        .filter((a) => Boolean(a.id) && Boolean(a.image));

      setAvatars(mapped);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch avatar list");
    } finally {
      setLoading(false);
    }
  }

  return { avatars, loading, error, fetchForGroup };
}
