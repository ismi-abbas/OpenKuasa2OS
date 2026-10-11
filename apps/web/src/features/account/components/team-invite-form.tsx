
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { INVITE_ROLES, inviteUrl } from '@/features/account/lib/team';
import { roleLabel } from '@/features/auth/permissions';
import { InviteLinkField } from './invite-link-field';

export function TeamInviteForm({ onCreated }: { onCreated?: () => void }) {
  const [created, setCreated] = useState<{ link: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const role = new FormData(event.currentTarget).get('role');
    setError(null);
    setPending(true);
    try {
      const r = await api<{ token: string; email: string }>('/team/invites', {
        method: 'POST',
        json: { email, role },
      });
      setCreated({ link: inviteUrl(r.token), email: r.email });
      setEmail('');
      onCreated?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Invites are links, not emails. Create one, then copy the link and send
        it to the person yourself. It works for 7 days and only for the email
        you enter.
      </p>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="invite-member-email">Email</Label>
          <Input
            id="invite-member-email"
            name="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-member-role">Role</Label>
          <Select name="role" defaultValue="member">
            <SelectTrigger id="invite-member-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create invite link'}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {created ? (
        <div
          role="status"
          className="space-y-2 rounded-lg border bg-muted/50 px-4 py-3"
        >
          <p className="text-sm">
            Invite link for <span className="font-semibold">{created.email}</span>
            . No email was sent, so copy it and share it yourself.
          </p>
          <InviteLinkField
            link={created.link}
            label={`Invite link for ${created.email}`}
          />
        </div>
      ) : null}
    </div>
  );
}
