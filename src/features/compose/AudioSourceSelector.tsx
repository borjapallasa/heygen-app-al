"use client";
import React, { useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { getAudioUrl } from "@/src/lib/utils";

/**
 * AudioSourceSelector component
 * Allows user to choose between HeyGen voices, project audio, or recorded audio
 * @param readOnly - If true, disables all interactive elements (for review/confirm page)
 */
export function AudioSourceSelector({ readOnly = false }: { readOnly?: boolean }) {
  const {
    voiceSource,
    setVoiceSource,
    projectAudio,
    selectedProjectAudio,
    setSelectedProjectAudio,
    recordedAudio,
    setAudioAttachment,
    audioAttachment
  } = useAppState();

  const [showProjectAudioList, setShowProjectAudioList] = useState(false);

  const handleSourceChange = (source: 'heygen' | 'project_audio' | 'recorded') => {
    if (readOnly) return;
    setVoiceSource(source);

    // Clear audio attachment when switching to HeyGen voices
    if (source === 'heygen') {
      setAudioAttachment(null);
    }

    // Set audio attachment when switching to project audio
    if (source === 'project_audio' && selectedProjectAudio) {
      setAudioAttachment({
        url: selectedProjectAudio.url || getAudioUrl(selectedProjectAudio.name),
        name: selectedProjectAudio.name,
        duration: selectedProjectAudio.duration || 0
      });
    }

    // Set audio attachment when switching to recorded audio
    if (source === 'recorded' && recordedAudio) {
      setAudioAttachment(recordedAudio);
    }
  };

  const handleProjectAudioSelect = (audio: any) => {
    if (readOnly) return;
    setSelectedProjectAudio(audio);
    setAudioAttachment({
      url: audio.url || getAudioUrl(audio.name),
      name: audio.name,
      duration: audio.duration || 0
    });
    setShowProjectAudioList(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Voice Source
      </label>

      <div className={`grid gap-3 ${readOnly ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {/* HeyGen Voices Option - Show if selected or not readOnly */}
        {(!readOnly || voiceSource === 'heygen') && (
          <button
            type="button"
            onClick={() => handleSourceChange('heygen')}
            disabled={readOnly}
            className={`
              relative flex flex-col items-start p-4 border-2 rounded-lg transition-all
              ${voiceSource === 'heygen'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${readOnly ? 'cursor-default' : ''}
            `}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-sm font-semibold text-gray-900">
                HeyGen Voice
              </span>
              {voiceSource === 'heygen' && (
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500 text-left">
              Use AI-generated voice from HeyGen
            </p>
          </button>
        )}

        {/* Project Audio Option - Show if selected or not readOnly */}
        {(!readOnly || voiceSource === 'project_audio') && (
          <button
            type="button"
            onClick={() => handleSourceChange('project_audio')}
            disabled={!projectAudio || projectAudio.length === 0 || readOnly}
            className={`
              relative flex flex-col items-start p-4 border-2 rounded-lg transition-all
              ${voiceSource === 'project_audio'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${!projectAudio || projectAudio.length === 0 || readOnly ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Project Audio
              </span>
              {voiceSource === 'project_audio' && (
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500 text-left">
              {projectAudio && projectAudio.length > 0
                ? `Use audio from project (${projectAudio.length} file${projectAudio.length > 1 ? 's' : ''})`
                : 'No project audio available'
              }
            </p>
          </button>
        )}

        {/* Recorded Audio Option - Show if selected or not readOnly */}
        {(!readOnly || voiceSource === 'recorded') && (
          <button
            type="button"
            onClick={() => handleSourceChange('recorded')}
            disabled={!recordedAudio || readOnly}
            className={`
              relative flex flex-col items-start p-4 border-2 rounded-lg transition-all
              ${voiceSource === 'recorded'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${!recordedAudio || readOnly ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Recorded Audio
              </span>
              {voiceSource === 'recorded' && (
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500 text-left">
              {recordedAudio
                ? `Use recorded audio (${formatDuration(recordedAudio.duration)})`
                : 'No recorded audio yet'
              }
            </p>
          </button>
        )}
      </div>

      {/* Selected Audio Display - Show when audio is selected */}
      {(() => {
        // Determine which audio to show based on voice source
        let audioUrl = null;
        let audioName = 'Audio file';
        let audioType = 'audio/mpeg';

        if (voiceSource === 'project_audio') {
          // For project audio, check both audioAttachment and selectedProjectAudio
          // Priority: audioAttachment first (if it has URL), then selectedProjectAudio
          if (audioAttachment) {
            audioUrl = audioAttachment.url || (audioAttachment.name ? getAudioUrl(audioAttachment.name) : null);
            audioName = audioAttachment.name || 'Audio file';
          }
          
          // Always also check selectedProjectAudio as fallback or if audioAttachment doesn't have URL
          if (!audioUrl && selectedProjectAudio) {
            audioUrl = selectedProjectAudio.url || (selectedProjectAudio.name ? getAudioUrl(selectedProjectAudio.name) : null);
            audioName = selectedProjectAudio.name || selectedProjectAudio.metadata?.name || selectedProjectAudio.metadata?.filename || 'Audio file';
          }
        } else if (voiceSource === 'recorded') {
          // For recorded audio, check both audioAttachment and recordedAudio
          if (audioAttachment?.url) {
            audioUrl = audioAttachment.url;
            audioName = audioAttachment.name || 'Audio file';
            audioType = 'audio/webm';
          } else if (recordedAudio?.url) {
            audioUrl = recordedAudio.url;
            audioName = recordedAudio.name || 'Audio file';
            audioType = 'audio/webm';
          }
        }

        // Show if we have a valid audio URL and voice source is not HeyGen
        if (audioUrl && voiceSource !== 'heygen') {
          return (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">
                    {audioName}
                  </p>
                </div>
                <audio controls className="h-8 ml-3">
                  <source src={audioUrl} type={audioType} />
                </audio>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Project Audio Selection - Only show dropdown if not readOnly and no audio selected yet */}
      {voiceSource === 'project_audio' && projectAudio && projectAudio.length > 0 && !audioAttachment && !readOnly && (
        <div className="mt-3">
          {!selectedProjectAudio ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 mb-2">
                Please select an audio file from your project:
              </p>
              <button
                type="button"
                onClick={() => setShowProjectAudioList(!showProjectAudioList)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showProjectAudioList ? 'Hide' : 'Show'} audio files ({projectAudio.length})
              </button>
            </div>
          ) : null}

          {/* Audio File List */}
          {showProjectAudioList && !readOnly && (
            <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {projectAudio.map((audio: any) => (
                  <button
                    key={audio.media_uuid}
                    type="button"
                    onClick={() => handleProjectAudioSelect(audio)}
                    className={`
                      w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors text-left
                      ${selectedProjectAudio?.media_uuid === audio.media_uuid ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {audio.name}
                      </p>
                      {audio.duration && (
                        <p className="text-xs text-gray-500">
                          {formatDuration(audio.duration)}
                        </p>
                      )}
                    </div>
                    {selectedProjectAudio?.media_uuid === audio.media_uuid && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default AudioSourceSelector;
