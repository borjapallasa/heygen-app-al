"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";

type Group = { id: string; name: string; image?: string; initials?: string; color?: string; };

function toStartCase(str?: string) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function getInitials(name?: string) {
  if (!name) return "";
  return name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0,2);
}

export default function useHeygenGroups() {
  const { client } = useAppState();
  const palette = useMemo(() => [
    "bg-blue-500","bg-purple-500","bg-pink-500","bg-green-500","bg-orange-500",
    "bg-red-500","bg-yellow-500","bg-indigo-500","bg-teal-500",
  ], []);
  const randomColor = () => palette[Math.floor(Math.random() * palette.length)];

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // no client? do nothing (no fetch)
    if (!client) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await client.json(client.endpoints.avatarGroupList, { signal });
        const raw = data?.data?.avatar_group_list || data?.data?.avatars || [];
        const mapped: Group[] = (Array.isArray(raw) ? raw : []).map((it: any) => {
          const id = it.id || it.avatar_id;
          const rawName = it.name || it.avatar_name || "Unnamed";
          const name = toStartCase(rawName);
          const image = it.preview_image || it.preview_image_url || it.preview_video_url || "";
          return { id, name, image, initials: getInitials(name), color: randomColor() };
        });
        setGroups(mapped);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to fetch avatar groups");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [client]); // rerun only when key/client changes

  return { groups, loading, error };
}
