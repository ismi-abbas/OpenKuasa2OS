import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MfaCard } from '@/features/account/components/mfa-card';
import { PageFrame } from '@/features/account/components/page-frame';
import { PasswordForm, SignOutOthersForm } from '@/features/account/components/security-forms';
import { ReadOnlyNotice } from '@/features/account/components/settings-form';
import { useViewer } from '@/features/auth/viewer-context';
import { authClient } from '@/lib/auth-client';

export default function SecurityPage() {
  const viewer = useViewer();
  const { data: session, refetch } = authClient.useSession();
  const enabled = session?.user.twoFactorEnabled === true;

  return (
    <PageFrame title="Security" subtitle="Password, 2FA & sessions.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            {viewer.isDemo ? (
              <ReadOnlyNotice>Demo sessions have no password. Sign up to create your own account.</ReadOnlyNotice>
            ) : (
              <PasswordForm />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
          </CardHeader>
          <CardContent>
            {viewer.isDemo ? (
              <ReadOnlyNotice>
                Two-factor authentication is not available in the demo workspace. Sign up to protect your own account.
              </ReadOnlyNotice>
            ) : (
              <MfaCard enabled={enabled} onChanged={() => void refetch()} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">This browser</p>
                <p className="text-sm text-muted-foreground">Signed in as {viewer.email ?? 'a demo guest'}</p>
              </div>
              <span className="text-sm text-muted-foreground">Active now</span>
            </div>
            {viewer.isDemo ? null : <SignOutOthersForm />}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
