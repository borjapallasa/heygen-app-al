export function createHeygenClient(apiKey: string) {
  const endpoints = {
    logo: "https://app.heygen.com/icons/heygen/wordmark/svg/HeyGen_Logo_Prism_Black.svg",
    avatarGroupList: "https://api.heygen.com/v2/avatar_group.list?include_public=false",
    groupAvatars: (groupId: string) => `https://api.heygen.com/v2/avatar_group/${groupId}/avatars`,
    videosList: "https://api.heygen.com/v1/video.list",
    videoStatus: (id: string) => `https://api.heygen.com/v1/video_status.get?video_id=${id}`,
  } as const;

  async function json(url: string, opts: RequestInit = {}) {
    // Use proxy to avoid CORS issues
    const res = await fetch('/api/heygen/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        method: opts.method || 'GET',
        body: opts.body,
        apiKey,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Request to ${url} failed`);
    }

    return res.json();
  }

  return { endpoints, json };
}
