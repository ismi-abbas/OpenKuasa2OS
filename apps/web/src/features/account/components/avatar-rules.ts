/** Profile photo rules; the Worker enforces the same ones (POST /api/account/avatar): 2MB, JPG/PNG/WebP. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';

/** Returns a message for the user when the file cannot be used, else null. */
export function avatarFileError(file: { type: string; size: number }): string | null {
  if (!AVATAR_ACCEPT.split(',').includes(file.type)) return 'Please choose a JPG, PNG or WebP image.';
  if (file.size === 0) return 'That file is empty.';
  if (file.size > AVATAR_MAX_BYTES) return 'Photos can be up to 2MB.';
  return null;
}
