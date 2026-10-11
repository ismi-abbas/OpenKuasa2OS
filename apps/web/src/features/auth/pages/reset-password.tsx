import { AuthShell } from '@/features/auth/components/auth-shell';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <title>Set a new password · OpenKuasa OS</title>
      <div className="space-y-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password you&apos;ll remember.
        </p>
      </div>

      <ResetPasswordForm />
    </AuthShell>
  );
}
