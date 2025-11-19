"use client";
import React from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { stripHtml } from "@/src/lib/utils";

/**
 * ScriptSourceSelector component
 * Allows user to choose between manual text input or project content
 * @param readOnly - If true, disables all interactive elements (for review/confirm page)
 */
export function ScriptSourceSelector({ readOnly = false }: { readOnly?: boolean }) {
  const {
    scriptSource,
    setScriptSource,
    projectContent,
    promptText,
    setPromptText
  } = useAppState();

  const handleSourceChange = (source: 'manual' | 'project_content') => {
    if (readOnly) return;
    setScriptSource(source);

    // If switching to project content, load it into promptText (stripped of HTML)
    if (source === 'project_content' && projectContent) {
      const cleanText = stripHtml(projectContent);
      setPromptText(cleanText);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Script Source
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Manual Input Option */}
        <button
          type="button"
          onClick={() => handleSourceChange('manual')}
          disabled={readOnly}
          className={`
            relative flex flex-col items-start p-4 border-2 rounded-lg transition-all
            ${scriptSource === 'manual'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
            ${readOnly ? 'cursor-default' : ''}
          `}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Manual Input
            </span>
            {scriptSource === 'manual' && (
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
            Type your script manually in the text area below
          </p>
        </button>

        {/* Project Content Option */}
        <button
          type="button"
          onClick={() => handleSourceChange('project_content')}
          disabled={!projectContent || readOnly}
          className={`
            relative flex flex-col items-start p-4 border-2 rounded-lg transition-all
            ${scriptSource === 'project_content'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
            ${!projectContent || readOnly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Project Content
            </span>
            {scriptSource === 'project_content' && (
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
            {projectContent
              ? `Use content from parent project (${projectContent.length} chars)`
              : 'No project content available'
            }
          </p>
        </button>
      </div>

      {/* Textarea when manual input is selected */}
      {scriptSource === 'manual' && (
        <div className="mt-3">
          <textarea
            value={promptText}
            onChange={(e) => !readOnly && setPromptText(e.target.value)}
            readOnly={readOnly}
            placeholder="Type your script here..."
            className={`w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm ${
              readOnly ? 'bg-gray-50 cursor-default' : ''
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            {promptText.length} characters
          </p>
        </div>
      )}

      {/* Preview when project content is selected */}
      {scriptSource === 'project_content' && projectContent && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              Project Content Preview
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleSourceChange('manual')}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Edit manually
              </button>
            )}
          </div>
          <div className="text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {(() => {
              const cleanContent = stripHtml(projectContent);
              return cleanContent.length > 300
                ? `${cleanContent.substring(0, 300)}...`
                : cleanContent;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScriptSourceSelector;
