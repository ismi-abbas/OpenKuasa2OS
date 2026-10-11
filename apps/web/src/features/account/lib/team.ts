import type { OrgRole } from '@/features/auth/viewer';

/** Roles an invite or a role change may grant; ownership is never handed out. */
export const INVITE_ROLES = ['admin', 'member', 'viewer'] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

/** GET /api/team/invite/:token (public). */
export type InviteDetails = { orgName: string; email: string; role: OrgRole; status: InviteStatus };

export type Workspace = { orgId: string; name: string; role: OrgRole; isCurrent: boolean };

export type TeamMember = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: OrgRole;
  joinedAt: string;
  isYou: boolean;
};

export type PendingInvite = { id: string; email: string; role: OrgRole; token: string; expiresAt: string };

export const inviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;

/** Why an invite link cannot be used, or null while it is still pending. */
export function inviteProblem(status: InviteStatus): string | null {
  switch (status) {
    case 'pending':
      return null;
    case 'accepted':
      return 'This invite has already been accepted. Sign in to open the workspace.';
    case 'revoked':
      return 'This invite was cancelled. Ask the person who invited you for a new link.';
    case 'expired':
      return 'This invite has expired. Ask the person who invited you for a new link.';
  }
}
