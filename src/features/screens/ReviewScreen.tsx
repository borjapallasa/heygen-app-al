"use client";
import { useMemo, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { HeaderBack } from "@/src/features/shared/HeaderBack";
import { chunkAvatarsForRows, stripHtml } from "@/src/lib/utils";
import { VIEW } from "@/src/lib/constants";
import ScriptSourceSelector from "@/src/features/compose/ScriptSourceSelector";
import AudioSourceSelector from "@/src/features/compose/AudioSourceSelector";

export default function ReviewScreen() {
  const {
    setView,
    selectedGroup,
    selectedAvatarIds,
    promptText,
    setPromptText,
    audioAttachment,
    scriptSource,
    voiceSource,
    contentAttachment,
    projectContent
  } = useAppState();

  const [isGenerating, setIsGenerating] = useState(false);

  // You probably have avatars in memory already; pass them through context or props as needed.
  const selectedAvatars = useMemo(() => Array.from(selectedAvatarIds), [selectedAvatarIds]);

  // Determine if audio is selected (audio attachment exists or voice source is not HeyGen)
  const hasAudioSelected = audioAttachment !== null || voiceSource !== 'heygen';
  
  // Determine if script/content is selected (content attachment exists, script source is project_content, or prompt text exists)
  const hasScriptSelected = contentAttachment !== null || scriptSource === 'project_content' || (promptText && promptText.trim().length > 0);

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

          {/* Script Section - Only show if audio is NOT selected */}
          {!hasAudioSelected && (
            <>
              {/* Script Source Selector */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <ScriptSourceSelector readOnly />
              </div>

              {/* Script Preview - Show for project content */}
              {scriptSource === 'project_content' && projectContent && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        Project Content Preview
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {(() => {
                        const cleanContent = stripHtml(projectContent);
                        return cleanContent.length > 300
                          ? `${cleanContent.substring(0, 300)}...`
                          : cleanContent;
                      })()}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {stripHtml(projectContent).length} characters
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Audio Section - Only show if script/content is NOT selected */}
          {!hasScriptSelected && (
            <>
              {/* Audio Source Selector */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <AudioSourceSelector readOnly />
              </div>
            </>
          )}

          {/* Show message if user needs to go back to change selection */}
          {(hasAudioSelected || hasScriptSelected) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p className="text-sm text-slate-600 text-center">
                {hasAudioSelected && 'Audio is selected. Go back to change script/content.'}
                {hasScriptSelected && !hasAudioSelected && 'Script/Content is selected. Go back to change audio.'}
              </p>
            </div>
          )}

          {/* Generate Button */}
          {(() => {
            // Check if script/content is available
            const hasScript = (promptText && promptText.trim().length > 0) || contentAttachment !== null || scriptSource === 'project_content';
            // Check if audio is available
            const hasAudio = audioAttachment !== null || voiceSource !== 'heygen';
            // Button should be enabled if we have script OR audio, and avatars are selected
            const canGenerate = selectedAvatars.length > 0 && (hasScript || hasAudio);

            return (
              <button
                className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-opacity"
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate}
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
            );
          })()}

          {/* Help Text */}
          {(() => {
            const hasScript = (promptText && promptText.trim().length > 0) || contentAttachment !== null || scriptSource === 'project_content';
            const hasAudio = audioAttachment !== null || voiceSource !== 'heygen';
            return (
              <div className="text-xs text-slate-500 text-center">
                {selectedAvatars.length === 0 && 'Please select at least one avatar to continue'}
                {selectedAvatars.length > 0 && !hasScript && !hasAudio && 'Please provide a script or audio'}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
