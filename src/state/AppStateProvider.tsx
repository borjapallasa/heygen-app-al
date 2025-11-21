"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import { VIEW } from "@/src/lib/constants";
import { createHeygenClient } from "@/src/lib/heygenClient";
import type { InitPayload, MediaItem } from "@/src/services/postMessageService";

type AudioItem = { url: string; blob?: Blob; name: string; duration: number; };
type Group = { id: string; name: string; image?: string; };

// Parent data from INIT message
type ParentData = {
  projectId: string;
  organizationId: string;
  userId: string;
  appInstallationId: string;
  permissions: string[];
};

type State = {
  view: keyof typeof VIEW;
  setView: (v: keyof typeof VIEW) => void;

  // API Key
  apiKey: string | null;
  setApiKey: (k: string | null) => void;
  hasApiKey: boolean;
  setHasApiKey: (has: boolean) => void;

  // Avatar selection
  selectedGroup: Group | null;
  setSelectedGroup: (g: Group | null) => void;
  selectedAvatarIds: Set<string>;
  toggleAvatar: (id: string) => void;
  clearSelection: () => void;

  // Prompt and audio
  promptText: string;
  setPromptText: (s: string) => void;
  audioAttachment: AudioItem | null;
  setAudioAttachment: (a: AudioItem | null) => void;
  contentAttachment: { type: 'project_content'; name: string } | null;
  setContentAttachment: (attachment: { type: 'project_content'; name: string } | null) => void;

  // Parent app data (from INIT message)
  parentData: ParentData | null;
  setParentData: (data: ParentData) => void;

  // Project data
  projectUuid: string | null;
  setProjectUuid: (uuid: string | null) => void;
  projectContent: string | null;
  setProjectContent: (content: string) => void;
  projectAudio: MediaItem[];
  setProjectAudio: (audio: MediaItem[]) => void;

  // Script source selection
  scriptSource: 'manual' | 'project_content';
  setScriptSource: (source: 'manual' | 'project_content') => void;

  // Voice source selection
  voiceSource: 'heygen' | 'project_audio' | 'recorded';
  setVoiceSource: (source: 'heygen' | 'project_audio' | 'recorded') => void;

  // Selected project audio
  selectedProjectAudio: MediaItem | null;
  setSelectedProjectAudio: (audio: MediaItem | null) => void;

  // Recorded audio
  recordedAudio: AudioItem | null;
  setRecordedAudio: (audio: AudioItem | null) => void;

  // Initialization state
  isInitialized: boolean;
  setIsInitialized: (init: boolean) => void;

  // HeyGen client
  client: ReturnType<typeof createHeygenClient> | null;
};

const Ctx = createContext<State | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<State["view"]>(VIEW.HOME);

  // API Key
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Avatar selection
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedAvatarIds, setSelectedAvatarIds] = useState<Set<string>>(new Set());

  // Prompt and audio
  const [promptText, setPromptText] = useState("");
  const [audioAttachment, setAudioAttachment] = useState<AudioItem | null>(null);
  const [contentAttachment, setContentAttachment] = useState<{ type: 'project_content'; name: string } | null>(null);

  // Parent app data
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [projectUuid, setProjectUuid] = useState<string | null>(null);
  const [projectContent, setProjectContent] = useState<string | null>(null);
  const [projectAudio, setProjectAudio] = useState<MediaItem[]>([]);

  // Script and voice source
  const [scriptSource, setScriptSource] = useState<'manual' | 'project_content'>('manual');
  const [voiceSource, setVoiceSource] = useState<'heygen' | 'project_audio' | 'recorded'>('heygen');

  // Selected audio
  const [selectedProjectAudio, setSelectedProjectAudio] = useState<MediaItem | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<AudioItem | null>(null);

  // Initialization
  const [isInitialized, setIsInitialized] = useState(false);

  // Create HeyGen client when API key is available
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
    hasApiKey, setHasApiKey,
    selectedGroup, setSelectedGroup,
    selectedAvatarIds, toggleAvatar, clearSelection,
    promptText, setPromptText,
    audioAttachment, setAudioAttachment,
    contentAttachment, setContentAttachment,
    parentData, setParentData,
    projectUuid, setProjectUuid,
    projectContent, setProjectContent,
    projectAudio, setProjectAudio,
    scriptSource, setScriptSource,
    voiceSource, setVoiceSource,
    selectedProjectAudio, setSelectedProjectAudio,
    recordedAudio, setRecordedAudio,
    isInitialized, setIsInitialized,
    client
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
