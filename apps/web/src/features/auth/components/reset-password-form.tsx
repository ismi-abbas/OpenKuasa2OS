import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

// better-auth's email link lands here as /reset-password?token=... (or ?error=INVALID_TOKEN).
export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const token = useSearchParams()[0].get('token');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return navigate('/login?notice=reset_expired');
    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: String(new FormData(e.currentTarget).get('password')),
      token,
    });
    setPending(false);
    if (error) return setError('Your reset link has expired. Request a new one.');
    navigate('/login');
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
