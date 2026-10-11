import { Link } from 'react-router';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { MfaRecoverForm } from '@/features/auth/components/mfa-recover-form';
import { SignOutButton } from '@/features/auth/components/sign-out-button';

export default function MfaRecoverPage() {
  return (
    <AuthShell>
      <title>Use a recovery code · OpenKuasa OS</title>
      <div className="space-y-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Use a recovery code
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter one of the recovery codes you saved when you set up two-factor
          authentication.
        </p>
      </div>

      <p
        role="note"
        className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
      >
        A recovery code works once. After signing in, generate a fresh set of
        recovery codes from your security settings.
      </p>

      <MfaRecoverForm />

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Have your phone after all?{' '}
          <Link
            to="/mfa/verify"
            className="font-semibold text-primary hover:underline"
          >
            Enter a code instead
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
