"use client";
import { useEffect, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import useGroupAvatars from "@/src/hooks/useGroupAvatars";
import { HeaderBack } from "@/src/features/shared/HeaderBack";
import { BannerError } from "@/src/features/shared/BannerError";
import AvatarHoverCard from "@/src/features/avatars/AvatarHoverCard";
import FloaterBar from "@/src/features/compose/FloaterBar";
import RecorderOverlay from "@/src/features/compose/RecorderOverlay";
import { VIEW } from "@/src/lib/constants";

export default function GroupAvatarsScreen() {
  const {
    selectedGroup, setView,
    selectedAvatarIds, toggleAvatar, clearSelection,
    promptText, setPromptText,
    audioAttachment, setAudioAttachment,
    setRecordedAudio,
    setVoiceSource,
    setScriptSource,
    projectContent,
    projectAudio,
    setSelectedProjectAudio
  } = useAppState();
  const { avatars, loading, error, fetchForGroup } = useGroupAvatars();

  // Local state for FloaterBar
  const [actionsOpen, setActionsOpen] = useState(false);
  const [recorderOpen, setRecorderOpen] = useState(false);

  useEffect(() => {
    if (selectedGroup?.id) fetchForGroup(selectedGroup.id);
    else setView(VIEW.SELECT);
  }, [selectedGroup?.id]);

  return (
    <>
      <HeaderBack
        title={selectedGroup?.name || 'Avatar Group'}
        leftThumb={selectedGroup?.image}
        onBack={() => { setView(VIEW.SELECT); clearSelection(); }}
      />

      {error && <BannerError msg={error}/>}
      {loading ? (
        <div className="min-h-[60vh] grid place-items-center text-slate-500">Loading avatars…</div>
      ) : (
        <div className="pt-6 pb-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {avatars.map(a => (
            <AvatarHoverCard key={a.id} avatar={a}
              selected={selectedAvatarIds.has(a.id)}
              onToggle={() => toggleAvatar(a.id)} />
          ))}
        </div>
      )}

      {selectedAvatarIds.size > 0 && (
        <FloaterBar
          value={promptText}
          onChange={(v) => { setPromptText(v); if (v && audioAttachment) setAudioAttachment(null); }}
          onSubmit={() => setView(VIEW.REVIEW)}
          actionsOpen={actionsOpen}
          setActionsOpen={setActionsOpen}
          audioAttachment={audioAttachment}
          onRemoveAudio={() => setAudioAttachment(null)}
          onRecordAudio={() => setRecorderOpen(true)}
          onImportContent={() => {
            if (projectContent) {
              setScriptSource('project_content');
              setPromptText(projectContent);
              setView(VIEW.REVIEW);
            } else {
              alert('No project content available to import');
            }
          }}
          onImportAudio={() => {
            if (projectAudio && projectAudio.length > 0) {
              setVoiceSource('project_audio');
              setSelectedProjectAudio(projectAudio[0]);
              setAudioAttachment({
                url: projectAudio[0].url,
                name: projectAudio[0].name,
                duration: projectAudio[0].duration || 0
              });
              setView(VIEW.REVIEW);
            } else {
              alert('No project audio available to import');
            }
          }}
        />
      )}

      {/* Audio Recorder */}
      {recorderOpen && (
        <RecorderOverlay
          onClose={() => setRecorderOpen(false)}
          onSave={(item) => {
            setRecordedAudio(item);
            setVoiceSource('recorded');
            setAudioAttachment(item);
            setPromptText("");
            setRecorderOpen(false);
          }}
        />
      )}
    </>
  );
}
