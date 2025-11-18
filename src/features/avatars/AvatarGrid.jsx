"use client";

export default function AvatarGrid({ groups, onPick, sizeClass = "w-32 h-32", nameWidth = "w-40" }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No avatar groups available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
      {groups.map((group) => {
        const initials = group.name?.slice(0, 2).toUpperCase() || "GR";

        return (
          <button
            key={group.id}
            onClick={() => onPick?.(group)}
            className="flex flex-col items-center group"
          >
            {/* Avatar Circle */}
            <div className={`relative ${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-500 hover:scale-105 transition-transform shadow-lg`}>
              {group.image || group.thumbnail_url || group.preview_image_url ? (
                <img
                  src={group.image || group.thumbnail_url || group.preview_image_url}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">{initials}</span>
                </div>
              )}
            </div>

            {/* Name */}
            <span className={`mt-3 text-sm font-medium text-slate-900 ${nameWidth} truncate text-center`}>
              {group.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
