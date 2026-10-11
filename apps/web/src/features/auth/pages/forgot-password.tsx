import { Link } from 'react-router';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <title>Reset password · OpenKuasa OS</title>
      <div className="space-y-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
