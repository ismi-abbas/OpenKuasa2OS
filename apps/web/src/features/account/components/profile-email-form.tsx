import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestEmailChange } from '@/features/account/lib/actions';
import { SaveBar, useSettingsForm } from './settings-form';

export function ProfileEmailForm({
  email,
  readOnly,
}: {
  email: string | null;
  readOnly: boolean;
}) {
  const { state, onSubmit, pending } = useSettingsForm(requestEmailChange);
  const disabled = readOnly || !email;

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Sign-in email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current-email">Current email</Label>
              <Input
                id="current-email"
                type="email"
                value={email ?? ''}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">New email</Label>
              <Input
                id="new-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {disabled
              ? 'The demo workspace has no sign-in email to change.'
              : 'We’ll email an approval link to your current address. Nothing changes until you open it: until then you keep signing in with your current email.'}
          </p>
          <SaveBar
            state={state}
            pending={pending}
            disabled={disabled}
            label="Send approval link"
          />
        </CardContent>
      </Card>
    </form>
  );
}
