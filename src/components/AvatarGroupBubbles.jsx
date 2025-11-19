"use client";

import React, { useEffect, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { VIEW, HEYGEN } from "@/src/lib/constants";
import { stripHtml } from "@/src/lib/utils";

// hooks
import useHeygenGroups from "@/src/hooks/useHeygenGroups";
import useGroupAvatars from "@/src/hooks/useGroupAvatars";
import useHeygenVideos from "@/src/hooks/useHeygenVideos";

// shared UI
import { BannerError } from "@/src/features/shared/BannerError";
import { HeaderBack } from "@/src/features/shared/HeaderBack";
import Divider from "@/src/features/shared/Divider";

// avatars UI
import AvatarBubbleRow from "@/src/features/avatars/AvatarBubbleRow";
import AvatarGrid from "@/src/features/avatars/AvatarGrid";
import AvatarHoverCard from "@/src/features/avatars/AvatarHoverCard";

// compose UI
import FloaterBar from "@/src/features/compose/FloaterBar";
import RecorderOverlay from "@/src/features/compose/RecorderOverlay";
import ScriptSourceSelector from "@/src/features/compose/ScriptSourceSelector";
import AudioSourceSelector from "@/src/features/compose/AudioSourceSelector";

// videos UI (already uses useHeygenVideos inside)
import VideosPane from "@/src/features/videos/VideosPane";

// utils (only small helpers needed here)
import { chunkAvatarsForRows, runAssertions } from "@/src/lib/utils";

export default function AvatarGroupBubbles() {
  const {
    client,
    setRecordedAudio,
    setVoiceSource,
    setScriptSource,
    projectContent,
    projectAudio,
    setSelectedProjectAudio,
    apiKey,
    parentData,
    scriptSource,
    voiceSource,
    selectedProjectAudio,
    recordedAudio,
    promptText: globalPromptText,
    setPromptText: setGlobalPromptText
  } = useAppState(); // ensures API key exists before fetching

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [refetchFunctions, setRefetchFunctions] = useState(null);

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
    console.log("goToGroupAvatars called with group:", group);
    if (!group || !group.id) {
      console.error("Invalid group passed to goToGroupAvatars:", group);
      return;
    }
    setSelectedGroup(group);
    setSelectedAvatarIds(new Set());
    setView(VIEW.GROUP);
    console.log("Fetching avatars for group ID:", group.id);
    await groupAvatars.fetchForGroup(group.id);
    console.log("Avatars fetched, count:", groupAvatars.avatars.length);
  };

  const toggleAvatarSelect = (id) => {
    setSelectedAvatarIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGenerateVideos = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const selected = groupAvatars.avatars.filter((a) => selectedAvatarIds.has(a.id));

      if (selected.length === 0) {
        throw new Error('No avatars selected');
      }

      // Determine script based on source and strip HTML tags
      // Use global promptText from AppStateProvider (not local state)
      let script = '';
      if (scriptSource === 'project_content' && projectContent) {
        script = stripHtml(projectContent);
      } else if (scriptSource === 'manual') {
        script = globalPromptText || '';
      } else {
        script = globalPromptText || '';
      }

      // Trim and validate script
      script = script.trim();
      if (!script || script.length === 0) {
        throw new Error('Please provide a script');
      }

      // Handle recorded audio upload if needed
      let uploadedAudioUrl = null;
      if (voiceSource === 'recorded' && recordedAudio?.blob) {
        try {
          const formData = new FormData();
          formData.append('file', recordedAudio.blob, `recording-${Date.now()}.webm`);
          formData.append('organizationId', parentData?.organizationId || '5ec92adf-57cb-4d08-817a-f523cc308cda');

          const uploadResponse = await fetch('/api/upload/audio', {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload recorded audio');
          }

          const uploadData = await uploadResponse.json();
          uploadedAudioUrl = uploadData.url;
        } catch (uploadError) {
          console.error('Audio upload error:', uploadError);
          throw new Error('Failed to upload recorded audio. Please try again.');
        }
      }

      // Prepare metadata
      const metadata = {
        avatarIds: selected.map(a => a.id),
        avatarNames: selected.map(a => a.name),
        groupId: selectedGroup?.id,
        groupName: selectedGroup?.name,
        scriptSource,
        script,
        voiceSource,
        audioUrl: voiceSource === 'project_audio' ? selectedProjectAudio?.url :
                  voiceSource === 'recorded' ? uploadedAudioUrl : null,
        audioName: voiceSource === 'project_audio' ? selectedProjectAudio?.name :
                   voiceSource === 'recorded' ? recordedAudio?.name : null
      };

      // Generate a correlation UUID for tracking
      const correlationUuid = crypto.randomUUID();

      // Create job in database
      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_uuid: parentData?.organizationId || '5ec92adf-57cb-4d08-817a-f523cc308cda',
          correlation_uuid: correlationUuid,
          callback_url: '', // Empty string instead of null to satisfy NOT NULL constraint
          status: 'pending',
          metadata
        })
      });

      if (!jobResponse.ok) {
        const errorData = await jobResponse.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      const { job } = await jobResponse.json();

      console.log('Job created successfully:', job);

      // TODO: Call HeyGen API to actually generate videos
      // Job created successfully, now refetch to show pending state

      // Reset and go back to home
      setView(VIEW.HOME);
      setSelectedAvatarIds(new Set());
      setPromptText('');
      setAudioAttachment(null);

      // Refetch videos and jobs to show the new pending job
      if (refetchFunctions) {
        try {
          await Promise.all([
            refetchFunctions.refetchVideos(),
            refetchFunctions.refetchJobs()
          ]);
        } catch (refetchError) {
          console.error('Error refetching videos/jobs:', refetchError);
          // Don't show error to user, just log it
        }
      }

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(error.message);
      alert('Error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
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
              <VideosPane 
                onGroupSelect={goToGroupAvatars}
                onRefetchReady={setRefetchFunctions}
              /> {/* handles its own loading, errors, pagination */}
            </>
          )}
        </section>
        
        {/* Modals need to be outside sections to avoid pointer-events issues */}
        {/* Modals are rendered inside VideosPane but need to work even when HOME section is hidden */}

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
            <div className="w-full max-w-3xl space-y-6">
              {/* Script Source Selector */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <ScriptSourceSelector />
              </div>

              {/* Audio Source Selector */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <AudioSourceSelector />

                {/* Record Audio Button */}
                <div className="mt-4">
                  <button
                    onClick={() => setRecorderOpen(true)}
                    className="w-full px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Record New Audio
                  </button>
                </div>
              </div>

              {generationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                  {generationError}
                </div>
              )}

              <button
                onClick={handleGenerateVideos}
                disabled={isGenerating}
                className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Video'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* AUDIO RECORDER */}
        {recorderOpen && (
          <RecorderOverlay
            onClose={() => setRecorderOpen(false)}
            onSave={(item) => {
              // Save recorded audio to global state
              setRecordedAudio(item);
              // Set voice source to recorded
              setVoiceSource('recorded');
              // Also set local audio attachment
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
            onImportContent={() => {
              // Set script source to project content and navigate to review
              if (projectContent) {
                setScriptSource('project_content');
                // Strip HTML tags before setting the text
                const cleanText = stripHtml(projectContent);
                setPromptText(cleanText);
                goToReview();
              } else {
                alert('No project content available to import');
              }
            }}
            onImportAudio={() => {
              // Set voice source to project audio and navigate to review
              if (projectAudio && projectAudio.length > 0) {
                setVoiceSource('project_audio');
                // Optionally auto-select first audio
                setSelectedProjectAudio(projectAudio[0]);
                setAudioAttachment({
                  url: projectAudio[0].url,
                  name: projectAudio[0].name,
                  duration: projectAudio[0].duration || 0
                });
                goToReview();
              } else {
                alert('No project audio available to import');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
