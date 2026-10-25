export type Instance = { domain: string; name: string; version: string; termsUrl?: string }; // termsUrl from F17

export type Account = { uuid: string; username: string; createdAt: string };

export type SessionResponse = { token: string; expiresAt: string; me: Me };

export type UserSummary = {
  uuid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

export type Me = UserSummary & {
  email: string;
  bio: string;
  role: 'user' | 'moderator' | 'admin'; // from F13. Before F13 always 'user'
  createdAt: string;
};

export type Profile = UserSummary & {
  bio: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;    // false when anonymous
  isBlocked: boolean;      // from F13. Viewer has blocked this user
  isSelf: boolean;
  createdAt: string;
};

export type Media = {
  uuid: string;
  kind: 'image' | 'video';
  status: 'processing' | 'ready' | 'failed';
  url?: string;            // display.jpg or video.mp4, present when ready
  thumbnailUrl?: string;   // thumb.jpg or poster.jpg, present when ready
  width: number;
  height: number;
  durationMs: number;      // 0 for images
  failureReason?: string;
};

export type Post = {
  uuid: string;
  author: UserSummary;
  caption: string;
  media: Media;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;      // false when anonymous
  createdAt: string;
};

export type Comment = {
  uuid: string;
  postUuid: string;
  author: UserSummary;
  body: string;
  createdAt: string;
};

export type Report = {
  uuid: string;
  reporter: UserSummary;
  targetType: 'post' | 'comment' | 'account';
  targetUuid: string;
  reason: 'spam' | 'harassment' | 'nudity' | 'violence' | 'illegal' | 'other';
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolutionNote: string;
  createdAt: string;
  resolvedAt?: string;
  /** Only in GET /admin/reports. What was reported, so moderators can judge it. */
  targetPreview?: { username: string; text: string; thumbnailUrl?: string };
};

export type Page<T> = { items: T[]; nextCursor?: string };

export type ErrorResponse = { error: string; type?: string; details?: Record<string, unknown> };

export type Role = Me['role'];
export type MediaKind = Media['kind'];
export type ReportReason = Report['reason'];
export type ReportTargetType = Report['targetType'];
