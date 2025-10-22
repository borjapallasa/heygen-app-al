"use client";
import { useMemo } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { HeaderBack } from "@/src/features/shared/HeaderBack";
import { chunkAvatarsForRows } from "@/src/lib/utils";
import { VIEW } from "@/src/lib/constants";

export default function ReviewScreen() {
  const { setView, selectedGroup, selectedAvatarIds, promptText, audioAttachment } = useAppState();

  // You probably have avatars in memory already; pass them through context or props as needed.
  const selectedAvatars = useMemo(() => Array.from(selectedAvatarIds), [selectedAvatarIds]);

  return (
    <>
      <HeaderBack title="Review & Confirm" onBack={() => setView(VIEW.GROUP)} leftThumb={selectedGroup?.image} />
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 text-center">Selected Avatars</h2>
        {/* You can render the card grid like your current component does */}
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
              <div className="text-sm text-slate-800 whitespace-pre-wrap">{promptText || '—'}</div>
            </div>
          )}

          <button className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90"
            onClick={() => {
              // send job payload
              console.log('CONFIRM', { selectedGroup, selectedAvatars, promptText, audioAttachment });
            }}>
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}
