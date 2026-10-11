
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { INVITE_ROLES, type InviteRole } from '@/features/account/lib/team';
import { roleLabel } from '@/features/auth/permissions';

/** Role picker and two-step remove for one member, shown to owners and admins. */
export function TeamMemberActions({
  userId,
  name,
  role,
  onChange,
}: {
  userId: string;
  name: string;
  role: InviteRole;
  onChange: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const run = async (init: { method: string; json?: unknown }, isRemove = false) => {
    setError(null);
    setPending(true);
    setRemoving(isRemove);
    try {
      await api(`/team/members/${userId}`, init);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center justify-end gap-2">
        {/* Follows the saved role, so a failed change snaps back. */}
        <Select
          value={role}
          disabled={pending}
          onValueChange={(next) => {
            if (next !== role) void run({ method: 'PATCH', json: { role: next } });
          }}
        >
          <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVITE_ROLES.map((option) => (
              <SelectItem key={option} value={option}>
                {roleLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {confirming ? (
          <>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                void run({ method: 'DELETE' }, true);
              }}
            >
              Confirm remove
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label={`Remove ${name}`}
            onClick={() => setConfirming(true)}
          >
            {pending && removing ? 'Removing…' : 'Remove'}
          </Button>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
