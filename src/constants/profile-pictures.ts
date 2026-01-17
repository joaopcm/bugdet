export const PROFILE_PICTURES_BUCKET = "profile-pictures";
export const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_PROFILE_PICTURE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// Optimization constants
export const PROFILE_PICTURE_DIMENSIONS = 512;
export const PROFILE_PICTURE_MAX_SIZE_KB = 200;
export const PROFILE_PICTURE_QUALITY = 0.8;
