"use client";
import { HeaderBack } from "@/src/features/shared/HeaderBack";
import AvatarGrid from "@/src/features/avatars/AvatarGrid";
import useHeygenGroups from "@/src/hooks/useHeygenGroups";
import { BannerError } from "@/src/features/shared/BannerError";
import { useAppState } from "@/src/state/AppStateProvider";
import { VIEW } from "@/src/lib/constants";

export default function SelectGroupScreen() {
  const { setView, setSelectedGroup } = useAppState();
  const { groups, error } = useHeygenGroups();

  function pick(g:any){ setSelectedGroup(g); setView(VIEW.GROUP); }
  return (
    <>
      <HeaderBack title="Choose an Avatar" onBack={() => setView(VIEW.HOME)} />
      {error ? <BannerError msg={error}/> : (
        <div className="px-2 sm:px-4 lg:px-6 pt-10 pb-12">
          <AvatarGrid groups={groups} onPick={pick} sizeClass="w-28 h-28 md:w-32 md:h-32" nameWidth="w-36" />
        </div>
      )}
    </>
  );
}
