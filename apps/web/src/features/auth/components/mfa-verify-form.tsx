import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export function MfaVerifyForm({ next }: { next: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Authenticator apps show the code as "123 456"; accept it either way.
    const code = String(new FormData(e.currentTarget).get('code')).replace(/\s+/g, '');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your authenticator app.');
    setError(null);
    setPending(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (error) {
      return setError(
        error.status === 401 && !/code/i.test(error.message ?? '')
          ? 'Your sign-in expired. Sign in again.'
          : 'That code is not right. Check your authenticator app and try again.',
      );
    }
    navigate(next ?? '/command');
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="code">Authentication code</Label>
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          placeholder="123456"
          className="text-center font-mono tracking-[0.4em]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'code-error' : undefined}
          autoFocus
          required
        />
      </div>

      {error ? (
        <p id="code-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? 'Verifying…' : 'Verify'}
      </Button>
    </form>
  );
}
