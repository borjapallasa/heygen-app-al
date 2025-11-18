import { useAppState } from "@/src/state/AppStateProvider";

/**
 * Hook to access parent app data from INIT message
 */
export function useParentApp() {
  const {
    parentData,
    projectContent,
    projectAudio,
    isInitialized
  } = useAppState();

  return {
    // Parent identifiers
    projectId: parentData?.projectId || null,
    organizationId: parentData?.organizationId || null,
    userId: parentData?.userId || null,
    appInstallationId: parentData?.appInstallationId || null,
    permissions: parentData?.permissions || [],

    // Project data
    projectContent,
    projectAudio,

    // Initialization state
    isInitialized,

    // Full parent data
    parentData
  };
}

export default useParentApp;
