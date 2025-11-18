import type { Organization } from '@/src/lib/supabaseClient';
import { logService } from './logService';

/**
 * Organization Service
 * Handles organization sync between parent app and HeyGen DB
 */

/**
 * Check if organization exists in HeyGen DB
 */
export async function checkOrganizationExists(orgUuid: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/organizations?org_uuid=${orgUuid}`);
    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    logService.error('Failed to check organization existence', { orgUuid, error });
    throw error;
  }
}

/**
 * Get organization from HeyGen DB
 */
export async function getOrganization(orgUuid: string): Promise<Organization | null> {
  try {
    const response = await fetch(`/api/organizations?org_uuid=${orgUuid}`);
    const data = await response.json();

    if (data.exists) {
      return data.organization;
    }

    return null;
  } catch (error) {
    logService.error('Failed to get organization', { orgUuid, error });
    throw error;
  }
}

/**
 * Sync organization from parent app to HeyGen DB
 * Creates if doesn't exist, updates if exists
 */
export async function syncOrganization(
  orgUuid: string,
  name?: string
): Promise<Organization> {
  try {
    logService.info('Syncing organization to HeyGen DB', { orgUuid, name });

    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_uuid: orgUuid,
        name: name || 'Unknown Organization'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync organization');
    }

    const data = await response.json();

    if (data.created) {
      logService.info('Organization created in HeyGen DB', { orgUuid });
    } else if (data.updated) {
      logService.info('Organization updated in HeyGen DB', { orgUuid });
    } else {
      logService.debug('Organization already exists in HeyGen DB', { orgUuid });
    }

    return data.organization;
  } catch (error) {
    logService.reportError(error as Error, 'Organization sync failed');
    throw error;
  }
}
