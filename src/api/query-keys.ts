export const queryKeys = {
  instance: ['instance'] as const,
  me: ['me'] as const,
  profile: (username: string) => ['profile', username] as const,
  userPosts: (username: string) => ['userPosts', username] as const,
  post: (uuid: string) => ['post', uuid] as const,
  comments: (postUuid: string) => ['comments', postUuid] as const,
  feed: (kind: 'following' | 'explore') => ['feed', kind] as const,
  media: (uuid: string) => ['media', uuid] as const,
  blocks: ['blocks'] as const,
  adminReports: (status: string) => ['adminReports', status] as const,
};
