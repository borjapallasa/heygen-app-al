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
import { stripHtml } from "@/src/lib/utils";

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
    setSelectedProjectAudio,
    contentAttachment,
    setContentAttachment
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
          onChange={(v) => {
            setPromptText(v);
            if (v && audioAttachment) {
              setAudioAttachment(null);
              setVoiceSource('heygen');
            }
            if (v && contentAttachment) {
              setContentAttachment(null);
              setScriptSource('manual');
            }
          }}
          onSubmit={() => setView(VIEW.REVIEW)}
          actionsOpen={actionsOpen}
          setActionsOpen={setActionsOpen}
          audioAttachment={audioAttachment}
          onRemoveAudio={() => {
            setAudioAttachment(null);
            setVoiceSource('heygen');
          }}
          contentAttachment={contentAttachment}
          onRemoveContent={() => {
            setContentAttachment(null);
            setScriptSource('manual');
            setPromptText("");
          }}
          projectAudio={projectAudio}
          onSelectAudio={(audio) => {
            setSelectedProjectAudio(audio);
            setAudioAttachment({
              url: audio.url,
              name: audio.name,
              duration: audio.duration || 0
            });
          }}
          onRecordAudio={() => {
            // Clear content when recording audio
            setContentAttachment(null);
            setScriptSource('manual');
            setRecorderOpen(true);
          }}
          onImportContent={() => {
            if (projectContent) {
              // Clear audio when importing content
              setAudioAttachment(null);
              setVoiceSource('heygen');
              // Set content attachment
              setScriptSource('project_content');
              setContentAttachment({ type: 'project_content', name: 'Project Content' });
              // Strip HTML tags before setting the text
              const cleanText = stripHtml(projectContent);
              setPromptText(cleanText);
            } else {
              alert('No project content available to import');
            }
          }}
          onImportAudio={() => {
            if (projectAudio && projectAudio.length > 0) {
              // Clear content when importing audio
              setContentAttachment(null);
              setScriptSource('manual');
              setPromptText("");
              // Set audio attachment
              setVoiceSource('project_audio');
              // Auto-select first audio if only one, otherwise user will select from dropdown
              const selectedAudio = projectAudio[0];
              setSelectedProjectAudio(selectedAudio);
              setAudioAttachment({
                url: selectedAudio.url,
                name: selectedAudio.name,
                duration: selectedAudio.duration || 0
              });
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
            // Clear content when recording audio
            setContentAttachment(null);
            setScriptSource('manual');
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
