"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import { VIEW } from "@/src/lib/constants";
import { createHeygenClient } from "@/src/lib/heygenClient";

type AudioItem = { url: string; blob?: Blob; name: string; duration: number; };
type Group = { id: string; name: string; image?: string; };

type State = {
  view: keyof typeof VIEW;
  setView: (v: keyof typeof VIEW) => void;

  apiKey: string | null;
  setApiKey: (k: string | null) => void;

  selectedGroup: Group | null;
  setSelectedGroup: (g: Group | null) => void;

  selectedAvatarIds: Set<string>;
  toggleAvatar: (id: string) => void;
  clearSelection: () => void;

  promptText: string;
  setPromptText: (s: string) => void;

  audioAttachment: AudioItem | null;
  setAudioAttachment: (a: AudioItem | null) => void;

  client: ReturnType<typeof createHeygenClient> | null;
};

const Ctx = createContext<State | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<State["view"]>(VIEW.HOME);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedAvatarIds, setSelectedAvatarIds] = useState<Set<string>>(new Set());
  const [promptText, setPromptText] = useState("");
  const [audioAttachment, setAudioAttachment] = useState<AudioItem | null>(null);

  const client = useMemo(() => apiKey ? createHeygenClient(apiKey) : null, [apiKey]);

  const toggleAvatar = (id: string) => {
    setSelectedAvatarIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedAvatarIds(new Set());

  const value: State = {
    view, setView,
    apiKey, setApiKey,
    selectedGroup, setSelectedGroup,
    selectedAvatarIds, toggleAvatar, clearSelection,
    promptText, setPromptText,
    audioAttachment, setAudioAttachment,
    client
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
