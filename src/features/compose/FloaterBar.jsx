'use client';

import React from 'react';
import { ArrowRight, ChevronUp, FileText, Mic, Music2, X } from 'lucide-react';

/**
 * Floating composer bar used on the avatar selection screen.
 * Props:
 *  - value, onChange
 *  - onSubmit
 *  - actionsOpen, setActionsOpen
 *  - audioAttachment, onRemoveAudio
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
  onRecordAudio,
  onImportContent,
  onImportAudio,
}) {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-3xl border border-slate-300 bg-white shadow-lg px-3 py-2 w-[min(760px,90vw)]">
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Write your script"
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400 px-2 py-2"
        />

        {audioAttachment ? (
          <AudioChip item={audioAttachment} onRemove={onRemoveAudio} />
        ) : null}

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
  );
}

function AudioChip({ item, onRemove }) {
  return (
    <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
      <audio src={item.url} controls className="h-8" />
      <span className="text-xs text-slate-700 truncate max-w-[120px]" title={item.name}>
        {item.name}
      </span>
      <button onClick={onRemove} className="text-slate-500 hover:text-slate-700" aria-label="Remove audio">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
