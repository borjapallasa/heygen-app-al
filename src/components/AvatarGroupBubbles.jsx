"use client";

import React, { useEffect, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { VIEW, HEYGEN } from "@/src/lib/constants";

// hooks
import useHeygenGroups from "@/src/hooks/useHeygenGroups";
import useGroupAvatars from "@/src/hooks/useGroupAvatars";
import useHeygenVideos from "@/src/hooks/useHeygenVideos";

// shared UI
import BannerError from "@/src/features/shared/BannerError";
import HeaderBack from "@/src/features/shared/HeaderBack";
import Divider from "@/features/shared/Divider";

// avatars UI
import AvatarBubbleRow from "@/src/features/avatars/AvatarBubbleRow";
import AvatarGrid from "@/src/features/avatars/AvatarGrid";
import AvatarHoverCard from "@/src/features/avatars/AvatarHoverCard";

// compose UI
import FloaterBar from "@/src/features/compose/FloaterBar";
import RecorderOverlay from "@/src/features/compose/RecorderOverlay";

// videos UI (already uses useHeygenVideos inside)
import VideosPane from "@/src/features/videos/VideosPane";

// utils (only small helpers needed here)
import { chunkAvatarsForRows, runAssertions } from "@/src/lib/utils";

export default function AvatarGroupBubbles() {
  const { client } = useAppState(); // ensures API key exists before fetching

  // No API key yet: show the same friendly gate
  if (!client) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img src={HEYGEN.logo} alt="HeyGen" className="w-40 h-auto mb-4 motion-safe:animate-pulse" />
          <div className="text-slate-500 text-sm">Enter your API Key to begin…</div>
        </div>
      </div>
    );
  }

  // Local view state (you can move these into AppStateProvider later if you prefer)
  const [view, setView] = useState(VIEW.HOME);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedAvatarIds, setSelectedAvatarIds] = useState(new Set());
  const [promptText, setPromptText] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [audioAttachment, setAudioAttachment] = useState(null);

  // Data
  const { groups, loading: groupsLoading, error: groupsError } = useHeygenGroups();
  const groupAvatars = useGroupAvatars(); // { avatars, loading, error, fetchForGroup }

  // Assertions once
  useEffect(() => { runAssertions(); }, []);

  const isInitialLoading = groupsLoading; // videos load inside VideosPane

  const startNewVideo = () => {
    setView(VIEW.SELECT);
    try { window?.scrollTo?.({ top: 0, behavior: "smooth" }); } catch {}
  };

  const goToReview = () => {
    setView(VIEW.REVIEW);
    try { window?.scrollTo?.({ top: 0, behavior: "smooth" }); } catch {}
  };

  const goToGroupAvatars = async (group) => {
    setSelectedGroup(group);
    setSelectedAvatarIds(new Set());
    setView(VIEW.GROUP);
    await groupAvatars.fetchForGroup(group?.id);
  };

  const toggleAvatarSelect = (id) => {
    setSelectedAvatarIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img src={HEYGEN.logo} alt="HeyGen" className="w-40 h-auto mb-4 motion-safe:animate-pulse" />
          <div className="text-slate-500 text-sm">Loading your content…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative w-full max-w-6xl mx-auto p-6">
        {/* HOME */}
        <section
          aria-hidden={view !== VIEW.HOME}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.HOME ? "opacity-100 translate-y-0 pointer-events-auto relative" : "opacity-0 -translate-y-1 pointer-events-none absolute inset-0"
          }`}
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Avatars</h1>
          {groupsError ? (
            <BannerError msg={groupsError} />
          ) : (
            <>
              <AvatarBubbleRow groups={groups} onPick={goToGroupAvatars} />
              <Divider />
              <VideosPane /> {/* handles its own loading, errors, pagination */}
            </>
          )}
        </section>

        {/* SELECT */}
        <section
          aria-hidden={view !== VIEW.SELECT}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.SELECT ? "opacity-100 translate-y-0 pointer-events-auto relative" : "opacity-0 translate-y-1 pointer-events-none absolute inset-0"
          }`}
        >
          <HeaderBack title="Choose an Avatar" onBack={() => setView(VIEW.HOME)} />
          {groupsError ? (
            <BannerError msg={groupsError} />
          ) : (
            <div className="px-2 sm:px-4 lg:px-6 pt-10 pb-12">
              <AvatarGrid groups={groups} onPick={goToGroupAvatars} sizeClass="w-28 h-28 md:w-32 md:h-32" nameWidth="w-36" />
            </div>
          )}
        </section>

        {/* GROUP AVATARS */}
        <section
          aria-hidden={view !== VIEW.GROUP}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.GROUP ? "opacity-100 translate-y-0 pointer-events-auto relative" : "opacity-0 translate-y-1 pointer-events-none absolute inset-0"
          }`}
        >
          <HeaderBack title={selectedGroup ? selectedGroup.name : "Avatar Group"} onBack={() => setView(VIEW.SELECT)} leftThumb={selectedGroup?.image} />

          {groupAvatars.error && <BannerError msg={groupAvatars.error} />}

          {groupAvatars.loading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="flex flex-col items-center">
                <img src={HEYGEN.logo} alt="HeyGen" className="w-40 h-auto mb-4 motion-safe:animate-pulse" />
                <div className="text-slate-500 text-sm">Loading avatars…</div>
              </div>
            </div>
          ) : (
            <div className="pt-6 pb-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupAvatars.avatars.map((a) => (
                  <AvatarHoverCard
                    key={a.id}
                    avatar={a}
                    selected={selectedAvatarIds.has(a.id)}
                    onToggle={() => toggleAvatarSelect(a.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* REVIEW */}
        <section
          aria-hidden={view !== VIEW.REVIEW}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.REVIEW ? "opacity-100 translate-y-0 pointer-events-auto relative" : "opacity-0 translate-y-1 pointer-events-none absolute inset-0"
          }`}
        >
          <HeaderBack title="Review & Confirm" onBack={() => setView(VIEW.GROUP)} leftThumb={selectedGroup?.image} />

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 text-center">Selected Avatars</h2>
            {(() => {
              const selected = groupAvatars.avatars.filter((a) => selectedAvatarIds.has(a.id));
              if (selected.length === 0) return <div className="text-slate-500 text-sm text-center">No avatars selected.</div>;
              const rows = chunkAvatarsForRows(selected);
              return (
                <div className="space-y-4">
                  {rows.map((row, idx) => (
                    <div key={idx} className="flex justify-center gap-4">
                      {row.map((a) => (
                        <article key={a.id} className="w-36 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                          <div className="relative aspect-[4/5] overflow-hidden">
                            <img src={a.image} alt={a.name} className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                          <div className="p-2">
                            <div className="text-xs font-medium text-slate-900 whitespace-normal break-words text-center">{a.name}</div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-center pb-8">
            <div className="w-full max-w-xl space-y-4">
              {audioAttachment ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Audio</h3>
                  <audio src={audioAttachment.url} controls className="w-full" />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-h-[120px]">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Script</h3>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap">{promptText || "—"}</div>
                </div>
              )}

              <button
                onClick={() => {
                  const selected = groupAvatars.avatars.filter((a) => selectedAvatarIds.has(a.id));
                  console.log("CONFIRM", { group: selectedGroup, selected, script: promptText, audio: audioAttachment });
                }}
                className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </section>

        {/* AUDIO RECORDER */}
        {recorderOpen && (
          <RecorderOverlay
            onClose={() => setRecorderOpen(false)}
            onSave={(item) => {
              setAudioAttachment(item);
              setPromptText("");
              setRecorderOpen(false);
            }}
          />
        )}

        {/* FLOATER BAR */}
        {view === VIEW.GROUP && selectedAvatarIds.size > 0 && (
          <FloaterBar
            value={promptText}
            onChange={(v) => {
              setPromptText(v);
              if (v && audioAttachment) setAudioAttachment(null);
            }}
            onSubmit={goToReview}
            actionsOpen={actionsOpen}
            setActionsOpen={setActionsOpen}
            audioAttachment={audioAttachment}
            onRemoveAudio={() => setAudioAttachment(null)}
            onRecordAudio={() => setRecorderOpen(true)}
          />
        )}
      </div>
    </div>
  );
}
