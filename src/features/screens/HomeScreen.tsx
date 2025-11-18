// NOTE: This screen is not currently used - AvatarGroupBubbles.jsx is used instead
// Keeping this file to avoid breaking imports, but it's a stub
"use client";
import useHeygenGroups from "@/src/hooks/useHeygenGroups";
import useHeygenVideos from "@/src/hooks/useHeygenVideos";
import { BannerError } from "@/src/features/shared/BannerError";
import  Divider  from "@/features/shared/Divider";
import AvatarBubbleRow from "@/src/features/avatars/AvatarBubbleRow";
import VideosSection from "@/src/features/videos/VideosSection";
import { useAppState } from "@/src/state/AppStateProvider";
import { VIEW } from "@/src/lib/constants";

export default function HomeScreen() {
  const { setView, setSelectedGroup } = useAppState();
  const { groups, loading: groupsLoading, error: groupsError } = useHeygenGroups();
  const vids = useHeygenVideos();

  function startNewVideo() { setView(VIEW.SELECT); window?.scrollTo?.({top:0, behavior:'smooth'}); }
  function goToGroup(g: any) { setSelectedGroup(g); setView(VIEW.GROUP); }

  if (groupsLoading || vids.loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-slate-500">Loading your content…</div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Avatars</h1>
      {groupsError ? <BannerError msg={groupsError}/> : (
        <>
          <AvatarBubbleRow groups={groups} onPick={goToGroup}/>
          <Divider />
          <VideosSection />
        </>
      )}
    </>
  );
}
