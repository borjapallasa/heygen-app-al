"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAppState } from "@/src/state/AppStateProvider";
import { postMessageService } from "@/src/services/postMessageService";
import { logService } from "@/src/services/logService";
import type { InitPayload } from "@/src/services/postMessageService";
import LoadingScreen from "./LoadingScreen";
import ApiKeyModal from "./ApiKeyModal";
import AppRoot from "./AppRoot";
import HeyGenAccountPickerModal, {
  mapCredentialsToAccounts,
  type CredentialRecord
} from "./HeyGenAccountPickerModal";

export function AppInitializer() {
  const {
    setParentData,
    setProjectUuid,
    setProjectContent,
    setProjectAudio,
    setIsInitialized,
    setApiKey,
    setHasApiKey,
    setAvailableAccounts,
    setSelectedCredentialUuid,
    selectedCredentialUuid,
    availableAccounts,
    showAccountPicker,
    setShowAccountPicker,
    isInitialized,
    parentData,
    apiKey
  } = useAppState();

  const initPayloadRef = useRef<InitPayload | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(false);
  const [credentialsChecked, setCredentialsChecked] = useState(false);
  const [pendingDecrypt, setPendingDecrypt] = useState(false);

  useEffect(() => {
    postMessageService.sendReady([
      "avatar-selection",
      "video-generation",
      "project-content-integration",
      "project-audio-integration",
      "audio-recording"
    ]);
    logService.info("Sent READY message to parent app");
  }, []);

  useEffect(() => {
    const initTimeout = setTimeout(() => {
      if (!isInitialized) {
        const errorMsg = "Timeout: No INIT message received from parent app";
        logService.error(errorMsg);
        setError(errorMsg);
      }
    }, 10000);

    postMessageService.setupListener((payload) => {
      clearTimeout(initTimeout);
      logService.info("INIT message received from parent", payload);

      initPayloadRef.current = payload;

      setParentData({
        projectId: payload.projectId,
        organizationId: payload.organizationId,
        userId: payload.userId,
        appInstallationId: payload.appInstallationId,
        permissions: payload.permissions || []
      });

      if (payload.project?.uuid) {
        setProjectUuid(payload.project.uuid);
      }

      if (payload.project?.content) {
        setProjectContent(payload.project.content);
      }

      if (payload.project?.media) {
        const audioFiles = payload.project.media.filter(
          (m: { type: string }) => m.type === "audio"
        );
        setProjectAudio(audioFiles);
      }

      setIsInitialized(true);
    });

    return () => clearTimeout(initTimeout);
  }, [
    isInitialized,
    setParentData,
    setProjectUuid,
    setProjectContent,
    setProjectAudio,
    setIsInitialized
  ]);

  useEffect(() => {
    if (!isInitialized || !parentData || credentialsChecked) return;

    const checkCredentials = async () => {
      setIsCheckingApiKey(true);

      try {
        const isStandalone = window.self === window.top;

        if (!isStandalone) {
          logService.info("Syncing organization", {
            organizationId: parentData.organizationId
          });

          const syncResponse = await fetch("/api/organizations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              organization_uuid: parentData.organizationId,
              name: `Organization ${parentData.organizationId}`
            })
          });

          if (!syncResponse.ok) {
            throw new Error("Failed to sync organization");
          }

          logService.info("Organization synced successfully");
        }

        logService.info("Checking for existing API keys");

        const checkResponse = await fetch(
          `/api/credentials?org_uuid=${parentData.organizationId}&provider=heygen`
        );

        if (!checkResponse.ok) {
          if (isStandalone) {
            setHasApiKey(false);
            setShowApiKeyModal(true);
            setCredentialsChecked(true);
            return;
          }
          throw new Error("Failed to check API key status");
        }

        const { credentials } = await checkResponse.json();
        const list: CredentialRecord[] = credentials ?? [];

        setHasApiKey(list.length > 0);
        setCredentialsChecked(true);

        if (list.length === 0) {
          logService.info("No API key found, showing modal");
          setShowApiKeyModal(true);
        } else if (list.length === 1) {
          logService.info("Single API key found, auto-selecting");
          setSelectedCredentialUuid(list[0].api_credentials_uuid);
          setPendingDecrypt(true);
        } else {
          logService.info("Multiple API keys found, showing picker", {
            count: list.length
          });
          setAvailableAccounts(mapCredentialsToAccounts(list));
          setShowAccountPicker(true);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to initialize app";
        logService.error("Initialization error", { error: errorMsg });
        const isStandalone = window.self === window.top;
        if (isStandalone) {
          setHasApiKey(false);
          setShowApiKeyModal(true);
          setCredentialsChecked(true);
        } else {
          setError(errorMsg);
        }
      } finally {
        setIsCheckingApiKey(false);
      }
    };

    checkCredentials();
  }, [
    isInitialized,
    parentData,
    credentialsChecked,
    setHasApiKey,
    setAvailableAccounts,
    setSelectedCredentialUuid,
    setShowAccountPicker
  ]);

  useEffect(() => {
    if (!pendingDecrypt || !parentData || !selectedCredentialUuid) return;

    const decryptKey = async () => {
      setIsCheckingApiKey(true);

      try {
        logService.info("Fetching decrypted API key", {
          credentialUuid: selectedCredentialUuid
        });

        const decryptResponse = await fetch("/api/credentials/decrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organization_uuid: parentData.organizationId,
            provider: "heygen",
            credential_uuid: selectedCredentialUuid
          })
        });

        if (!decryptResponse.ok) {
          logService.warn("Failed to decrypt API key, requesting new one");
          setShowApiKeyModal(true);
        } else {
          const { api_key } = await decryptResponse.json();
          setApiKey(api_key);
          logService.info("API key loaded successfully");
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to decrypt API key";
        logService.error("Decrypt error", { error: errorMsg });
        setShowApiKeyModal(true);
      } finally {
        setPendingDecrypt(false);
        setIsCheckingApiKey(false);
      }
    };

    decryptKey();
  }, [pendingDecrypt, parentData, selectedCredentialUuid, setApiKey]);

  const handleAccountSelect = (uuid: string) => {
    setSelectedCredentialUuid(uuid);
    setShowAccountPicker(false);
    setPendingDecrypt(true);
  };

  const handleApiKeySuccess = (key: string) => {
    setApiKey(key);
    setHasApiKey(true);
    setShowApiKeyModal(false);
    logService.info("API key set successfully from modal");
  };

  if (error) {
    return <LoadingScreen error={error} />;
  }

  if (!isInitialized || isCheckingApiKey) {
    return <LoadingScreen />;
  }

  if (showAccountPicker && availableAccounts.length > 0) {
    return (
      <HeyGenAccountPickerModal
        accounts={availableAccounts}
        onSelect={handleAccountSelect}
      />
    );
  }

  if (showApiKeyModal && parentData) {
    return (
      <ApiKeyModal
        organizationId={parentData.organizationId}
        onSuccess={handleApiKeySuccess}
      />
    );
  }

  if (!apiKey) {
    return <LoadingScreen />;
  }

  return <AppRoot />;
}

export default AppInitializer;
