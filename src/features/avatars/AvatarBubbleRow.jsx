"use client";

export default function AvatarBubbleRow({ groups, onPick }) {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-4 overflow-x-auto py-4 px-2">
      {groups.map((group) => {
        const initials = group.name?.slice(0, 2).toUpperCase() || "GR";

        return (
          <button
            key={group.id}
            data-group-id={group.id}
            onClick={() => onPick?.(group)}
            className="flex-shrink-0 flex flex-col items-center group"
          >
            {/* Avatar Circle */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-500 hover:scale-105 transition-transform shadow-md">
              {group.image || group.thumbnail_url || group.preview_image_url ? (
                <img
                  src={group.image || group.thumbnail_url || group.preview_image_url}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">{initials}</span>
                </div>
              )}
            </div>

            {/* Name */}
            <span className="mt-2 text-xs font-medium text-slate-700 max-w-[80px] truncate text-center">
              {group.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
