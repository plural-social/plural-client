export const Limits = {
  usernamePattern: /^[a-z0-9_]{1,30}$/,
  passwordMinLength: 8,
  passwordMaxLength: 128,
  displayNameMaxLength: 50,
  bioMaxLength: 300,
  captionMaxLength: 2200,
  commentMaxLength: 500,
  reportDetailsMaxLength: 1000,
  imageMaxBytes: 20 * 1024 * 1024,
  videoMaxBytes: 300 * 1024 * 1024,
  videoMaxDurationSeconds: 180,
} as const;
