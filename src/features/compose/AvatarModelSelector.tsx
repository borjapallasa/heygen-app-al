"use client";
import React from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { AVATAR_MODELS, type AvatarModelId } from "@/src/lib/constants";

/**
 * AvatarModelSelector component
 * Allows the user to choose which HeyGen avatar model (Avatar III / Avatar V)
 * will be used to generate the video(s) in this session.
 * @param readOnly - If true, disables all interactive elements (for review/confirm page)
 */
export function AvatarModelSelector({ readOnly = false }: { readOnly?: boolean }) {
  const { avatarModel, setAvatarModel } = useAppState();

  const handleModelChange = (model: AvatarModelId) => {
    if (readOnly) return;
    setAvatarModel(model);
  };

  const models = Object.values(AVATAR_MODELS);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Avatar Model
      </label>

      <div className="grid grid-cols-2 gap-3">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => handleModelChange(model.id as AvatarModelId)}
            disabled={readOnly}
            className={`
              relative flex flex-col items-start p-4 border-2 rounded-lg transition-all
              ${avatarModel === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${readOnly ? 'cursor-default' : ''}
            `}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-sm font-semibold text-gray-900">
                {model.label}
              </span>
              {avatarModel === model.id && (
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a110001.414-1.414L9 10.586 7.707 9.293a110001.414 1.414l2 2a110001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500 text-left">
              {model.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AvatarModelSelector;
