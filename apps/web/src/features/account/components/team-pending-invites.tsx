
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { roleLabel } from '@/features/auth/permissions';
import type { OrgRole } from '@/features/auth/viewer';
import { InviteLinkField } from './invite-link-field';

export type PendingInviteRow = {
  id: string;
  email: string;
  role: OrgRole;
  link: string;
  expires: string;
};

function InviteRow({ invite, onChange }: { invite: PendingInviteRow; onChange: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const revoke = async () => {
    setError(null);
    setPending(true);
    try {
      await api(`/team/invites/${invite.id}`, { method: 'DELETE' });
      onChange();
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  };

  return (
    <li className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{invite.email}</p>
          <p className="text-sm text-muted-foreground">
            Expires {invite.expires}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{roleLabel(invite.role)}</Badge>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={revoke}
          >
            {pending ? 'Revoking…' : 'Revoke'}
          </Button>
        </div>
      </div>
      <InviteLinkField
        link={invite.link}
        label={`Invite link for ${invite.email}`}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function TeamPendingInvites({
  invites,
  onChange,
}: {
  invites: PendingInviteRow[];
  onChange: () => void;
}) {
  if (invites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending invites. Links you create will be listed here until they are
        accepted, revoked or expire.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {invites.map((invite) => (
        <InviteRow key={invite.id} invite={invite} onChange={onChange} />
      ))}
    </ul>
  );
}
