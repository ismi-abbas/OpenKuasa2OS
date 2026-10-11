
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

type InviteAcceptState = { error?: string; notice?: string } | undefined;

// Joins the workspace as the signed-in user; the server checks the invite email.
const accept = (token: string) => api(`/team/invite/${token}/accept`, { method: 'POST' });

function Feedback({ state }: { state: InviteAcceptState }) {
  return (
    <>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.notice ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
        >
          {state.notice}
        </p>
      ) : null}
    </>
  );
}

/** For someone already signed in as the invited email. */
export function InviteJoinButton({
  token,
  orgName,
}: {
  token: string;
  orgName: string;
}) {
  const [state, setState] = useState<InviteAcceptState>();
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await accept(token);
      navigate('/command');
    } catch (err) {
      setState({ error: (err as Error).message });
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Feedback state={state} />
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? 'Joining…' : `Join ${orgName}`}
      </Button>
    </form>
  );
}

type Mode = 'create' | 'sign-in';

/** For signed-out visitors: sign in or create an account, then join. */
export function InviteAcceptForm({
  token,
  email,
  orgName,
}: {
  token: string;
  email: string;
  orgName: string;
}) {
  const [mode, setMode] = useState<Mode>('create');
  const [state, setState] = useState<InviteAcceptState>();
  const [fullName, setFullName] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const creating = mode === 'create';

  // The email always comes from the invite itself, never from the form.
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password'));
    setState(undefined);
    setPending(true);
    try {
      if (creating) {
        const { data, error } = await authClient.signUp.email({ email, password, name: fullName.trim() });
        if (error) {
          return setState({
            error:
              'Could not create your account. If you already have one, choose "I already have an account".',
          });
        }
        if (!data?.token) {
          return setState({
            notice:
              'Check your email to confirm your account, then reopen this invite link to join.',
          });
        }
      } else {
        const { data, error } = await authClient.signIn.email({ email, password });
        if (error) {
          return setState({
            error:
              error.status === 403
                ? 'Confirm your email first, then reopen this invite link.'
                : 'Incorrect password, or there is no account for this email yet. If you are new, choose "Create my account".',
          });
        }
        // With two-factor on, finish the code step, then come back here to join.
        if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
          return navigate(`/mfa/verify?next=${encodeURIComponent(`/invite/${token}`)}`);
        }
      }
      await accept(token);
      navigate('/command');
    } catch (err) {
      setState({ error: (err as Error).message });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Account" className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={creating ? 'secondary' : 'outline'}
          aria-pressed={creating}
          onClick={() => setMode('create')}
        >
          Create my account
        </Button>
        <Button
          type="button"
          variant={creating ? 'outline' : 'secondary'}
          aria-pressed={!creating}
          onClick={() => setMode('sign-in')}
        >
          I already have an account
        </Button>
      </div>

      <form key={mode} onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            readOnly
            autoComplete="username"
            className="bg-muted/50 text-muted-foreground"
          />
        </div>

        {creating ? (
          <div className="space-y-2">
            <Label htmlFor="invite-full-name">Full name</Label>
            <Input
              id="invite-full-name"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="invite-password">Password</Label>
          <Input
            id="invite-password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete={creating ? 'new-password' : 'current-password'}
            minLength={creating ? 8 : undefined}
            required
          />
          {creating ? (
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          ) : null}
        </div>

        <Feedback state={state} />

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending
            ? 'Joining…'
            : creating
              ? `Create account and join ${orgName}`
              : `Sign in and join ${orgName}`}
        </Button>
      </form>
    </div>
  );
}
