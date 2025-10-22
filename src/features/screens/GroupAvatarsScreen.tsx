"use client";
import { useEffect } from "react";
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
    audioAttachment, setAudioAttachment
  } = useAppState();
  const { avatars, loading, error, fetchForGroup } = useGroupAvatars();

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
        />
      )}

      {/* Recorder overlay is kept inside FloaterBar in your current code;
          you can keep that behavior or host it here and conditionally show it */}
    </>
  );
}
