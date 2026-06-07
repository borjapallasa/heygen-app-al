"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { HeaderBack } from "@/src/features/shared/HeaderBack";
import ApiKeyModal from "@/src/components/ApiKeyModal";
import {
  mapCredentialsToAccounts,
  type CredentialRecord
} from "@/src/components/HeyGenAccountPickerModal";
import { logService } from "@/src/services/logService";

export function AccountSettingsScreen() {
  const {
    parentData,
    selectedCredentialUuid,
    setSelectedCredentialUuid,
    setApiKey,
    setShowAccountSettings,
    setShowAccountPicker,
    setAvailableAccounts
  } = useAppState();

  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null);
  const [switchingUuid, setSwitchingUuid] = useState<string | null>(null);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingNameUuid, setSavingNameUuid] = useState<string | null>(null);

  const organizationId = parentData?.organizationId;

  const fetchCredentials = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/credentials?org_uuid=${organizationId}&provider=heygen`
      );

      if (!response.ok) {
        throw new Error("Failed to load accounts");
      }

      const data = await response.json();
      setCredentials(data.credentials ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load accounts";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSwitch = async (credentialUuid: string) => {
    if (!organizationId || credentialUuid === selectedCredentialUuid) return;

    setSwitchingUuid(credentialUuid);
    setError(null);

    try {
      const response = await fetch("/api/credentials/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_uuid: organizationId,
          provider: "heygen",
          credential_uuid: credentialUuid
        })
      });

      if (!response.ok) {
        throw new Error("Failed to switch account");
      }

      const { api_key } = await response.json();
      setApiKey(api_key);
      setSelectedCredentialUuid(credentialUuid);
      setShowAccountSettings(false);
      logService.info("Switched HeyGen account", { credentialUuid });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to switch account";
      setError(message);
    } finally {
      setSwitchingUuid(null);
    }
  };

  const handleRename = async (credentialUuid: string) => {
    if (!organizationId) return;

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setError("Account name is required");
      return;
    }

    setSavingNameUuid(credentialUuid);
    setError(null);

    try {
      const response = await fetch("/api/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_uuid: organizationId,
          credential_uuid: credentialUuid,
          provider: "heygen",
          name: trimmedName
        })
      });

      if (!response.ok) {
        throw new Error("Failed to rename account");
      }

      const { credential } = await response.json();

      await fetchCredentials();
      setEditingUuid(null);
      setEditingName("");

      const listResponse = await fetch(
        `/api/credentials?org_uuid=${organizationId}&provider=heygen`
      );
      if (listResponse.ok) {
        const listData = await listResponse.json();
        setAvailableAccounts(mapCredentialsToAccounts(listData.credentials ?? []));
      }

      logService.info("Renamed HeyGen account", { credentialUuid: credential.api_credentials_uuid });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to rename account";
      setError(message);
    } finally {
      setSavingNameUuid(null);
    }
  };

  const handleDelete = async (credentialUuid: string) => {
    if (!organizationId) return;

    setError(null);

    try {
      const response = await fetch(
        `/api/credentials?org_uuid=${organizationId}&provider=heygen&credential_uuid=${credentialUuid}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      const wasActive = credentialUuid === selectedCredentialUuid;
      await fetchCredentials();
      setConfirmDeleteUuid(null);

      if (wasActive) {
        setApiKey(null);
        setSelectedCredentialUuid(null);
        setShowAccountSettings(false);

        const checkResponse = await fetch(
          `/api/credentials?org_uuid=${organizationId}&provider=heygen`
        );
        const checkData = await checkResponse.json();
        const remaining: CredentialRecord[] = checkData.credentials ?? [];

        if (remaining.length === 0) {
          setShowAccountPicker(false);
        } else {
          setAvailableAccounts(mapCredentialsToAccounts(remaining));
          setShowAccountPicker(true);
        }
      }

      logService.info("Deleted HeyGen account", { credentialUuid });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete account";
      setError(message);
    }
  };

  const handleAddSuccess = (_apiKey: string, _credentialUuid: string) => {
    setShowApiKeyModal(false);
    fetchCredentials();
    logService.info("Added HeyGen account from settings");
  };

  const accounts = mapCredentialsToAccounts(credentials);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        <HeaderBack
          title="HeyGen Accounts"
          onBack={() => setShowAccountSettings(false)}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">No HeyGen accounts saved yet.</p>
        ) : (
          <ul className="space-y-4 mb-6">
            {accounts.map((account) => {
              const isActive = account.credential_uuid === selectedCredentialUuid;
              const isConfirming = confirmDeleteUuid === account.credential_uuid;
              const isSwitching = switchingUuid === account.credential_uuid;

              const isEditing = editingUuid === account.credential_uuid;
              const isSavingName = savingNameUuid === account.credential_uuid;

              return (
                <li
                  key={account.credential_uuid}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${
                    isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isSavingName}
                        />
                        <button
                          type="button"
                          onClick={() => handleRename(account.credential_uuid)}
                          disabled={isSavingName}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                        >
                          {isSavingName ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUuid(null);
                            setEditingName("");
                          }}
                          disabled={isSavingName}
                          className="text-xs text-gray-500 hover:text-gray-700 shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isActive || isSwitching}
                        onClick={() => handleSwitch(account.credential_uuid)}
                        className="w-full text-left disabled:cursor-default"
                      >
                        <span className="font-medium text-gray-900">{account.label}</span>
                        {isActive && (
                          <span className="ml-2 text-xs font-semibold text-blue-600 uppercase">
                            Active
                          </span>
                        )}
                        {isSwitching && (
                          <span className="ml-2 text-xs text-gray-500">Switching…</span>
                        )}
                      </button>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUuid(account.credential_uuid);
                          setEditingName(account.label);
                        }}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-800"
                      >
                        Rename
                      </button>

                  {isConfirming ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-600">Are you sure?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(account.credential_uuid)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteUuid(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUuid(account.credential_uuid)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 shrink-0"
                    >
                      Delete
                    </button>
                  )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setShowApiKeyModal(true)}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-base shadow-md transition-colors"
        >
          Add account
        </button>
      </div>

      {showApiKeyModal && organizationId && (
        <ApiKeyModal
          organizationId={organizationId}
          onSuccess={handleAddSuccess}
          onCancel={() => setShowApiKeyModal(false)}
        />
      )}
    </div>
  );
}

export default AccountSettingsScreen;
