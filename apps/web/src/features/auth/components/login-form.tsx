import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { safeNext } from '@/features/auth/paths';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const next = safeNext(useSearchParams()[0].get('next'));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    const { data, error } = await authClient.signIn.email({
      email: String(f.get('email')).trim(),
      password: String(f.get('password')),
      rememberMe: f.get('remember') === 'on',
    });
    setPending(false);
    if (error) {
      return setError(
        error.status === 403
          ? 'Confirm your email first. We sent you a link.'
          : 'Incorrect email or password.',
      );
    }
    // With an authenticator enrolled the password is only half of signing in.
    if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
      return navigate('/mfa/verify' + (next ? `?next=${encodeURIComponent(next)}` : ''));
    }
    navigate(next ?? '/command');
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email / Username</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-4 rounded border-input accent-primary"
          />
          Remember me
        </label>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
