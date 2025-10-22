export function createHeygenClient(apiKey: string) {
  const endpoints = {
    logo: "https://app.heygen.com/icons/heygen/wordmark/svg/HeyGen_Logo_Prism_Black.svg",
    avatarGroupList: "https://api.heygen.com/v2/avatar_group.list?include_public=false",
    groupAvatars: (groupId: string) => `https://api.heygen.com/v2/avatar_group/${groupId}/avatars`,
    videosList: "https://api.heygen.com/v1/video.list",
    videoStatus: (id: string) => `https://api.heygen.com/v1/video_status.get?video_id=${id}`,
  } as const;

  async function json(url: string, opts: RequestInit = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`${opts.method || "GET"} ${url} failed`);
    return res.json();
  }

  return { endpoints, json };
}
