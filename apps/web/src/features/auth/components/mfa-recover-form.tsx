import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export function MfaRecoverForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.twoFactor.verifyBackupCode({
      code: String(new FormData(e.currentTarget).get('code')).trim(),
    });
    setPending(false);
    if (error) return setError('That recovery code is not right.');
    navigate('/account/security?notice=recovered');
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="code">Recovery code</Label>
        <Input
          id="code"
          name="code"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="XXXXX-XXXXX"
          className="text-center font-mono tracking-widest"
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
        {pending ? 'Checking…' : 'Use recovery code'}
      </Button>
    </form>
  );
}
