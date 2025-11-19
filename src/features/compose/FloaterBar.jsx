'use client';

import React, { useState } from 'react';
import { ArrowRight, ChevronUp, ChevronDown, FileText, Mic, Music2, X } from 'lucide-react';

/**
 * Floating composer bar used on the avatar selection screen.
 * Props:
 *  - value, onChange
 *  - onSubmit
 *  - actionsOpen, setActionsOpen
 *  - audioAttachment, onRemoveAudio
 *  - contentAttachment, onRemoveContent
 *  - projectAudio, onSelectAudio (for dropdown when multiple audio files)
 *  - onRecordAudio
 */
export default function FloaterBar({
  value,
  onChange,
  onSubmit,
  actionsOpen,
  setActionsOpen,
  audioAttachment,
  onRemoveAudio,
  contentAttachment,
  onRemoveContent,
  projectAudio = [],
  onSelectAudio,
  onRecordAudio,
  onImportContent,
  onImportAudio,
}) {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-50">
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-300 bg-white shadow-lg px-3 py-2 w-[min(760px,90vw)]">
        {/* Pills container - above input */}
        {(contentAttachment || audioAttachment) && (
          <div className="flex items-center gap-2 flex-wrap">
            {contentAttachment && (
              <ContentChip onRemove={onRemoveContent} />
            )}
            {audioAttachment && (
              <AudioChip 
                item={audioAttachment} 
                onRemove={onRemoveAudio}
                projectAudio={projectAudio}
                onSelectAudio={onSelectAudio}
              />
            )}
          </div>
        )}

        {/* Input and buttons row */}
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Write your script"
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400 px-2 py-2"
          />

          <div className="relative">
            <button
              onClick={() => setActionsOpen?.(!actionsOpen)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-sm text-slate-700"
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
            >
              <span>More</span>
              {/* Up arrow so the menu opens upward (avoids going off-screen on mobile) */}
              <ChevronUp className="w-4 h-4" />
            </button>

            {actionsOpen && (
              <div
                role="menu"
                className="absolute right-0 bottom-full mb-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-[60vh] overflow-auto"
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm"
                  onClick={() => {
                    setActionsOpen?.(false);
                    onImportContent?.();
                  }}
                  role="menuitem"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  Import Content
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm"
                  onClick={() => {
                    setActionsOpen?.(false);
                    onImportAudio?.();
                  }}
                  role="menuitem"
                >
                  <Music2 className="w-4 h-4 text-slate-500" />
                  Import Audios
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm"
                  onClick={() => {
                    setActionsOpen?.(false);
                    onRecordAudio?.();
                  }}
                  role="menuitem"
                >
                  <Mic className="w-4 h-4" />
                  Record Audio
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onSubmit}
            className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black text-white hover:opacity-90"
            aria-label="Submit"
          >
            {/* Right arrow, per your spec */}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentChip({ onRemove }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
      <FileText className="w-4 h-4 text-slate-600" />
      <span className="text-xs text-slate-700">Project Content</span>
      <button onClick={onRemove} className="text-slate-500 hover:text-slate-700" aria-label="Remove content">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function AudioChip({ item, onRemove, projectAudio = [], onSelectAudio }) {
  const [audioDropdownOpen, setAudioDropdownOpen] = useState(false);
  const hasMultipleAudios = projectAudio.length > 1;

  return (
    <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
      <Music2 className="w-4 h-4 text-slate-600" />
      {hasMultipleAudios ? (
        <>
          <button
            onClick={() => setAudioDropdownOpen(!audioDropdownOpen)}
            className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900"
          >
            <span className="truncate max-w-[120px]" title={item.name}>
              {item.name || 'Select Audio'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {audioDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setAudioDropdownOpen(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                {projectAudio.map((audio) => (
                  <button
                    key={audio.media_uuid}
                    onClick={() => {
                      onSelectAudio?.(audio);
                      setAudioDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm text-left"
                  >
                    <Music2 className="w-4 h-4 text-slate-500" />
                    <span className="truncate flex-1" title={audio.name}>
                      {audio.name}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <span className="text-xs text-slate-700 truncate max-w-[120px]" title={item.name}>
          {item.name}
        </span>
      )}
      {item.url && (
        <audio src={item.url} controls className="h-6" />
      )}
      <button onClick={onRemove} className="text-slate-500 hover:text-slate-700" aria-label="Remove audio">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
