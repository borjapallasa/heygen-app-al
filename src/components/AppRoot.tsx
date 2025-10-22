"use client";
import { useAppState } from "@/src/state/AppStateProvider";
import { VIEW } from "@/src/lib/constants";
import HomeScreen from "@/src/features/screens/HomeScreen";
import SelectGroupScreen from "@/src/features/screens/SelectGroupScreen";
import GroupAvatarsScreen from "@/src/features/screens/GroupAvatarsScreen";
import ReviewScreen from "@/src/features/screens/ReviewScreen";

export default function AppRoot() {
  const { view } = useAppState();
  return (
    <div className="min-h-screen bg-white">
      <div className="relative w-full max-w-6xl mx-auto p-6">
        {view === VIEW.HOME   && <HomeScreen />}
        {view === VIEW.SELECT && <SelectGroupScreen />}
        {view === VIEW.GROUP  && <GroupAvatarsScreen />}
        {view === VIEW.REVIEW && <ReviewScreen />}
      </div>
    </div>
  );
}
