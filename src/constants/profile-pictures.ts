export const PROFILE_PICTURES_BUCKET = 'profile-pictures'
export const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_PROFILE_PICTURE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const
