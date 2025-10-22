import { HEYGEN } from './constants';

export type HeygenClient = ReturnType<typeof createHeygenClient>;

export function createHeygenClient(apiKey: string | null) {
  async function fetchJSON(url: string, init?: RequestInit) {
    if (!apiKey) throw new Error('Missing API key');
    const res = await fetch(url, {
      ...init,
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
        ...(init?.headers || {}),
      }
    });
    if (!res.ok) throw new Error(`${init?.method || 'GET'} ${url} failed`);
    return res.json();
  }

  return {
    listGroups(signal?: AbortSignal) {
      return fetchJSON(HEYGEN.avatarsList, { signal });
    },
    listVideos(params: Record<string,string>, signal?: AbortSignal) {
      const qs = new URLSearchParams(params).toString();
      return fetchJSON(`${HEYGEN.videosList}?${qs}`, { signal });
    },
    videoStatus(id: string, signal?: AbortSignal) {
      return fetchJSON(HEYGEN.videoStatus(id), { signal });
    },
    groupAvatars(groupId: string, signal?: AbortSignal) {
      return fetchJSON(HEYGEN.groupAvatars(groupId), { signal });
    },
  };
}
