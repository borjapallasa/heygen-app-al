"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { logService } from "@/src/services/logService";

type ApiKeyModalProps = {
  organizationId: string;
  onSuccess: (apiKey: string, credentialUuid: string) => void;
  /** When provided, shows a close button (e.g. optional "Add account" flow). Omitted at required init. */
  onCancel?: () => void;
};

/**
 * ApiKeyModal component
 * Shows when no HeyGen API key exists for the organization
 * Allows user to enter and validate their HeyGen API key
 * Saves encrypted API key to database on success
 */
export function ApiKeyModal({ organizationId, onSuccess, onCancel }: ApiKeyModalProps) {
  const [accountName, setAccountName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your HeyGen API key");
      return;
    }

    if (!accountName.trim()) {
      setError("Please enter an account name");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      logService.info("Validating and saving HeyGen API key", { organizationId });

      // Step 1: Validate the API key with HeyGen
      const validateResponse = await fetch("/api/credentials/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey })
      });

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(errorData.error || "Invalid API key");
      }

      // Step 2: Save the encrypted API key to database
      const saveResponse = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_uuid: organizationId,
          provider: "heygen",
          api_key: apiKey,
          name: accountName.trim()
        })
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save API key");
      }

      const saveData = await saveResponse.json();
      const credentialUuid = saveData.credential?.api_credentials_uuid;

      if (!credentialUuid) {
        throw new Error("Failed to save API key");
      }

      logService.info("HeyGen API key validated and saved successfully");
      onSuccess(apiKey, credentialUuid);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to validate API key";
      logService.error("API key validation failed", { error: errorMessage });
      setError(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              HeyGen API Key Required
            </h2>
            <p className="text-gray-600 text-sm">
              To use this app, you need to provide your HeyGen API key. Your key will be encrypted and stored securely.
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isValidating}
              aria-label="Close"
              className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="accountName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Account name
            </label>
            <input
              type="text"
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Marketing, Production"
              disabled={isValidating}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              HeyGen API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your HeyGen API key"
              disabled={isValidating}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mb-4">
            <a
              href="https://app.heygen.com/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Get your API key from HeyGen
            </a>
          </div>

          <button
            type="submit"
            disabled={isValidating || !apiKey.trim() || !accountName.trim()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-base shadow-md"
          >
              {isValidating ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Validating...
                </span>
            ) : (
              "Save API Key"
            )}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Your API key is encrypted using AES-256-GCM before being stored in the database. It is never exposed in plain text.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;
