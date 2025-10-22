'use client';

import { ArrowLeft } from 'lucide-react';

export default function HeaderBack({ title, onBack, leftThumb }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50"
        aria-label="Go back"
        type="button"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
      {leftThumb ? (
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-slate-200">
          <img src={leftThumb} alt="thumb" className="w-full h-full object-cover" />
        </div>
      ) : null}
      <h1 className="text-2xl font-bold text-slate-900 whitespace-normal break-words">{title}</h1>
    </div>
  );
}
