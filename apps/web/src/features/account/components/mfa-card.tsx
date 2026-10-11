import { useState } from 'react';
import { renderSVG } from 'uqr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reportSecurityEvent } from '@/features/account/lib/actions';
import { authClient } from '@/lib/auth-client';
import { cleanTotp, formatSecret, secretFromUri } from './mfa-helpers';
import { MfaRecoveryCodes } from './mfa-recovery-codes';

type View =
  | { kind: 'idle' }
  | { kind: 'start' }
  | { kind: 'setup'; uri: string; codes: string[] }
  | { kind: 'codes'; codes: string[] }
  | { kind: 'disable' }
  | { kind: 'regenerate' };

const IDLE: View = { kind: 'idle' };

const WRONG_CODE = 'That code is not right. Check your authenticator app and try again.';

/**
 * The authenticator-app controls on the Security page (better-auth twoFactor).
 * Enable / disable / new recovery codes ask for the account password; turning
 * on also needs a code from the app. The setup key and recovery codes live in
 * this component's state only.
 */
export function MfaCard({ enabled, onChanged }: { enabled: boolean; onChanged: () => void }) {
  const [view, setView] = useState<View>(IDLE);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const show = (next: View) => {
    setView(next);
    setValue('');
    setError(null);
    setNotice(null);
  };

  const run = async (task: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  // better-auth answers `{ data, error }`; unwrap or throw the message.
  const need = <T,>(res: { data: T | null; error: { message?: string } | null }, fallback: string): T => {
    if (res.error || !res.data) throw new Error(res.error?.message || fallback);
    return res.data;
  };

  const start = () =>
    run(async () => {
      const d = need(await authClient.twoFactor.enable({ password: value }), 'Could not start setup. Please try again.');
      if (!('totpURI' in d)) throw new Error('Could not start setup. Please try again.');
      show({ kind: 'setup', uri: d.totpURI, codes: d.backupCodes });
    });

  const confirmSetup = (codes: string[]) =>
    run(async () => {
      const res = await authClient.twoFactor.verifyTotp({ code: cleanTotp(value) });
      if (res.error) throw new Error(WRONG_CODE);
      await reportSecurityEvent('mfa_on');
      onChanged();
      show({ kind: 'codes', codes });
    });

  const regenerate = () =>
    run(async () => {
      const d = need(await authClient.twoFactor.generateBackupCodes({ password: value }), 'Could not create new recovery codes.');
      await reportSecurityEvent('codes_regenerated');
      show({ kind: 'codes', codes: d.backupCodes });
    });

  const disable = () =>
    run(async () => {
      need(await authClient.twoFactor.disable({ password: value }), 'Could not turn off two-factor authentication.');
      await reportSecurityEvent('mfa_off');
      onChanged();
      show(IDLE);
      setNotice('Two-factor authentication is off.');
    });

  // Fresh codes win over everything else and stay up until acknowledged.
  if (view.kind === 'codes') {
    return <MfaRecoveryCodes codes={view.codes} onDone={() => show(IDLE)} />;
  }

  const messages = (
    <>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      ) : null}
    </>
  );

  if (view.kind === 'start') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Confirm your password to start setting up an authenticator app.</p>
        <PromptForm
          password
          value={value}
          onValue={setValue}
          pending={pending}
          submitLabel="Continue"
          pendingLabel="Checking…"
          onSubmit={start}
          onCancel={() => show(IDLE)}
        />
        {messages}
      </div>
    );
  }

  if (view.kind === 'setup') {
    const qr = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSVG(view.uri))}`;
    return (
      <div className="space-y-4">
        <div>
          <p className="font-medium">Set up your authenticator app</p>
          <p className="text-sm text-muted-foreground">
            Scan the QR code with an authenticator app, then enter the 6-digit
            code it shows.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <img
            src={qr}
            alt="QR code for your authenticator app"
            width={176}
            height={176}
            className="size-44 shrink-0 rounded-lg border bg-white p-2"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">
              Can&apos;t scan it? Enter this key by hand:
            </p>
            <p className="font-mono text-sm break-all">
              {formatSecret(secretFromUri(view.uri))}
            </p>
          </div>
        </div>
        <PromptForm
          value={value}
          onValue={setValue}
          pending={pending}
          submitLabel="Turn on"
          pendingLabel="Checking…"
          onSubmit={() => confirmSetup(view.codes)}
          onCancel={() => show(IDLE)}
        />
        {messages}
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium">Authenticator app</p>
            <p className="text-sm text-muted-foreground">
              Add a second step at sign-in: a 6-digit code from an app on your
              phone.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill on={false} />
            <Button type="button" size="sm" onClick={() => show({ kind: 'start' })}>
              Set up
            </Button>
          </div>
        </div>
        {messages}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium">Authenticator app</p>
          <p className="text-sm text-muted-foreground">
            You are asked for a code from your app when you sign in. If you
            lose your phone, a recovery code signs you in.
          </p>
        </div>
        <StatusPill on />
      </div>

      {view.kind === 'idle' ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => show({ kind: 'regenerate' })}
          >
            Regenerate recovery codes
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => show({ kind: 'disable' })}
          >
            Turn off
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {view.kind === 'disable'
              ? 'Enter your password to turn two-factor authentication off.'
              : 'Enter your password to get a new set. Your current recovery codes will stop working.'}
          </p>
          <PromptForm
            password
            value={value}
            onValue={setValue}
            pending={pending}
            destructive={view.kind === 'disable'}
            submitLabel={view.kind === 'disable' ? 'Turn off' : 'Regenerate codes'}
            pendingLabel="Checking…"
            onSubmit={view.kind === 'disable' ? disable : regenerate}
            onCancel={() => show(IDLE)}
          />
        </div>
      )}
      {messages}
    </div>
  );
}

function StatusPill({ on }: { on: boolean }) {
  return (
    <span
      className={
        on
          ? 'inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
          : 'inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
      }
    >
      {on ? 'On' : 'Off'}
    </span>
  );
}

function PromptForm({
  password,
  value,
  onValue,
  pending,
  destructive,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
}: {
  /** Ask for the account password instead of a 6-digit code. */
  password?: boolean;
  value: string;
  onValue: (value: string) => void;
  pending: boolean;
  destructive?: boolean;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="space-y-2">
        <Label htmlFor="mfa-input">{password ? 'Password' : '6-digit code'}</Label>
        {password ? (
          <Input
            id="mfa-input"
            type="password"
            autoComplete="current-password"
            required
            value={value}
            onChange={(event) => onValue(event.target.value)}
            className="w-56"
          />
        ) : (
          <Input
            id="mfa-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={value}
            onChange={(event) => onValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-32 font-mono tracking-widest"
          />
        )}
      </div>
      <Button
        type="submit"
        variant={destructive ? 'destructive' : 'default'}
        disabled={pending || !value || (!password && value.length !== 6)}
      >
        {pending ? pendingLabel : submitLabel}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
    </form>
  );
}
