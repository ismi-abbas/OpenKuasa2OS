// Only same-origin relative paths are valid post-login destinations.
export const safeNext = (next: string | null | undefined) =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : null;
