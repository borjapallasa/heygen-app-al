import { logService } from './logService';

/**
 * API Key Service
 * Handles HeyGen API key storage, retrieval, and validation
 */

/**
 * Check if API key exists for organization
 */
export async function checkApiKeyExists(
  orgUuid: string,
  provider: string = 'heygen'
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/credentials?org_uuid=${orgUuid}&provider=${provider}`
    );
    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    logService.error('Failed to check API key existence', { orgUuid, error });
    throw error;
  }
}

/**
 * Get decrypted API key for organization
 * SECURITY: This makes a server-side API call to decrypt the key
 */
export async function getDecryptedApiKey(
  orgUuid: string,
  provider: string = 'heygen'
): Promise<string | null> {
  try {
    logService.debug('Fetching decrypted API key', { orgUuid, provider });

    const response = await fetch('/api/credentials/decrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_uuid: orgUuid,
        provider
      })
    });

    if (response.status === 404) {
      logService.debug('API key not found for organization', { orgUuid });
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to decrypt API key');
    }

    const data = await response.json();
    logService.info('API key decrypted successfully', { orgUuid, provider });
    return data.api_key;
  } catch (error) {
    logService.reportError(error as Error, 'Failed to get decrypted API key');
    throw error;
  }
}

/**
 * Save API key (will be encrypted by backend)
 */
export async function saveApiKey(
  orgUuid: string,
  apiKey: string,
  provider: string = 'heygen'
): Promise<void> {
  try {
    logService.info('Saving API key to HeyGen DB', { orgUuid, provider });

    const response = await fetch('/api/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_uuid: orgUuid,
        provider,
        api_key: apiKey
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save API key');
    }

    const data = await response.json();

    if (data.created) {
      logService.info('API key saved successfully', { orgUuid });
    } else if (data.updated) {
      logService.info('API key updated successfully', { orgUuid });
    }
  } catch (error) {
    logService.reportError(error as Error, 'Failed to save API key');
    throw error;
  }
}

/**
 * Validate HeyGen API key by making a test request
 */
export async function validateHeyGenApiKey(apiKey: string): Promise<boolean> {
  try {
    logService.debug('Validating HeyGen API key');

    // Test with a simple API call (list avatar groups)
    const response = await fetch(
      'https://api.heygen.com/v2/avatar_group.list?include_public=false',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    if (response.ok) {
      logService.info('HeyGen API key is valid');
      return true;
    }

    if (response.status === 401 || response.status === 403) {
      logService.warn('HeyGen API key is invalid (unauthorized)');
      return false;
    }

    // Other errors might not be auth-related
    logService.warn('HeyGen API key validation returned unexpected status', {
      status: response.status
    });
    return false;
  } catch (error) {
    logService.error('HeyGen API key validation failed', { error });
    return false;
  }
}

/**
 * Delete API key for organization
 */
export async function deleteApiKey(
  orgUuid: string,
  provider: string = 'heygen'
): Promise<void> {
  try {
    logService.info('Deleting API key', { orgUuid, provider });

    const response = await fetch(
      `/api/credentials?org_uuid=${orgUuid}&provider=${provider}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete API key');
    }

    logService.info('API key deleted successfully', { orgUuid });
  } catch (error) {
    logService.reportError(error as Error, 'Failed to delete API key');
    throw error;
  }
}
