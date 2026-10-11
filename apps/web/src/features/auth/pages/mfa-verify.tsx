import { Link, useSearchParams } from 'react-router';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { MfaVerifyForm } from '@/features/auth/components/mfa-verify-form';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { safeNext } from '@/features/auth/paths';

export default function MfaVerifyPage() {
  // Where to go once the code is accepted, e.g. back to an invite link.
  const next = safeNext(useSearchParams()[0].get('next'));

  return (
    <AuthShell>
      <title>Two-factor authentication · OpenKuasa OS</title>
      <div className="space-y-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Enter your code</h1>
        <p className="text-sm text-muted-foreground">
          Open your authenticator app and enter the 6-digit code for OpenKuasa
          OS.
        </p>
      </div>

      <MfaVerifyForm next={next} />

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Lost your phone?{' '}
          <Link
            to="/mfa/recover"
            className="font-semibold text-primary hover:underline"
          >
            Use a recovery code
          </Link>
        </p>
        <div>
          <SignOutButton className="font-medium hover:text-foreground hover:underline">
            Sign out
          </SignOutButton>
        </div>
      </div>
    </AuthShell>
  );
}
