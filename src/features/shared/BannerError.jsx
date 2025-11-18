'use client';

export function BannerError({ msg }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4">
      {msg}
    </div>
  );
}
