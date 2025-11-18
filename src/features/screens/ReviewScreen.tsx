"use client";
import { useMemo, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { HeaderBack } from "@/src/features/shared/HeaderBack";
import { chunkAvatarsForRows } from "@/src/lib/utils";
import { VIEW } from "@/src/lib/constants";
import ScriptSourceSelector from "@/src/features/compose/ScriptSourceSelector";
import AudioSourceSelector from "@/src/features/compose/AudioSourceSelector";
import AudioRecorderModal from "@/src/features/compose/AudioRecorderModal";

export default function ReviewScreen() {
  const {
    setView,
    selectedGroup,
    selectedAvatarIds,
    promptText,
    setPromptText,
    audioAttachment,
    scriptSource,
    voiceSource
  } = useAppState();

  const [showRecorderModal, setShowRecorderModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // You probably have avatars in memory already; pass them through context or props as needed.
  const selectedAvatars = useMemo(() => Array.from(selectedAvatarIds), [selectedAvatarIds]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // TODO: Implement video generation logic
      // This will call HeyGen API and create job_request entry
      console.log('GENERATE VIDEO', {
        selectedGroup,
        selectedAvatars,
        promptText,
        audioAttachment,
        scriptSource,
        voiceSource
      });
    } catch (error) {
      console.error('Failed to generate video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <HeaderBack title="Review & Confirm" onBack={() => setView(VIEW.GROUP)} leftThumb={selectedGroup?.image} />

      <div className="flex justify-center pb-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Selected Avatars Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Selected Avatars ({selectedAvatars.length})
            </h3>
            <div className="text-sm text-slate-600">
              {selectedAvatars.length > 0 ? `${selectedAvatars.length} avatar(s) selected` : 'No avatars selected'}
            </div>
          </div>

          {/* Script Source Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ScriptSourceSelector />
          </div>

          {/* Script Input (only for manual input or showing project content) */}
          {scriptSource === 'manual' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Script Text
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter your script here..."
                className="w-full min-h-[120px] p-3 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <div className="mt-2 text-xs text-slate-500">
                {promptText.length} characters
              </div>
            </div>
          )}

          {/* Audio Source Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <AudioSourceSelector />
          </div>

          {/* Record Audio Button (only show when no recorded audio yet) */}
          {voiceSource !== 'recorded' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                onClick={() => setShowRecorderModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                Record Audio for Video
              </button>
            </div>
          )}

          {/* Generate Button */}
          <button
            className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-opacity"
            onClick={handleGenerate}
            disabled={isGenerating || selectedAvatars.length === 0 || (!promptText && !audioAttachment)}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Video...
              </span>
            ) : (
              'Generate Video'
            )}
          </button>

          {/* Help Text */}
          <div className="text-xs text-slate-500 text-center">
            {selectedAvatars.length === 0 && 'Please select at least one avatar to continue'}
            {selectedAvatars.length > 0 && !promptText && !audioAttachment && 'Please provide a script or audio'}
          </div>
        </div>
      </div>

      {/* Audio Recorder Modal */}
      <AudioRecorderModal
        isOpen={showRecorderModal}
        onClose={() => setShowRecorderModal(false)}
      />
    </>
  );
}
