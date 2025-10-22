export const HEYGEN = {
  logo: 'https://app.heygen.com/icons/heygen/wordmark/svg/HeyGen_Logo_Prism_Black.svg',
  avatarsList: 'https://api.heygen.com/v2/avatar_group.list?include_public=false',
  groupAvatars: (groupId: string) => `https://api.heygen.com/v2/avatar_group/${groupId}/avatars`,
  videosList: 'https://api.heygen.com/v1/video.list',
  videoStatus: (id: string) => `https://api.heygen.com/v1/video_status.get?video_id=${id}`,
} as const;

export const VIEW = {
  HOME: 'HOME',
  SELECT: 'SELECT',
  GROUP: 'GROUP',
  REVIEW: 'REVIEW',
} as const;
