// Client-side viewer types/helpers. The Worker's GET /api/me returns a Viewer.
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

/** The signed-in person and their workspace, as shown in the app chrome. */
export type Viewer = {
  userId: string;
  orgId: string;
  name: string;
  email: string | null;
  initials: string;
  /** URL of the uploaded profile photo, if any. */
  avatarUrl: string | null;
  orgName: string;
  role: OrgRole;
  isDemo: boolean;
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}
