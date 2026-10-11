import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { Button } from '@/components/ui/button';
import {
  InviteAcceptForm,
  InviteJoinButton,
} from '@/features/account/components/invite-accept-form';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { roleLabel } from '@/features/auth/permissions';
import { inviteProblem, type InviteDetails } from '@/features/account/lib/team';

function Heading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Unusable({ message }: { message: string }) {
  return (
    <AuthShell>
      <Heading title="Invite unavailable">{message}</Heading>
      <Button asChild className="w-full" size="lg">
        <Link to="/login">Go to sign in</Link>
      </Button>
    </AuthShell>
  );
}

const INVALID = 'This invite link is not valid. Check that you copied the whole link.';

export default function InvitePage() {
  const { token = '' } = useParams();
  // Not RequireViewer: this page must also work signed-out.
  const { data: session, isPending, refetch } = authClient.useSession();
  const [invite, setInvite] = useState<InviteDetails | null | undefined>();

  useEffect(() => {
    api<InviteDetails>(`/team/invite/${token}`).then(setInvite, () => setInvite(null));
  }, [token]);

  if (invite === undefined || isPending) return null;
  if (!invite) return <Unusable message={INVALID} />;
  const problem = inviteProblem(invite.status);
  if (problem) return <Unusable message={problem} />;

  const user = session?.user;
  const isGuest = user?.isAnonymous === true;
  const signedInAs = user && !isGuest ? user.email : null;
  const matches = signedInAs?.toLowerCase() === invite.email.toLowerCase();

  return (
    <AuthShell>
      <title>Join a workspace · OpenKuasa OS</title>
      <Heading title={`Join ${invite.orgName}`}>
        You have been invited to {invite.orgName} on OpenKuasa OS.
      </Heading>

      <dl className="divide-y rounded-lg border text-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt className="text-muted-foreground">Workspace</dt>
          <dd className="truncate font-medium">{invite.orgName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt className="text-muted-foreground">Invited email</dt>
          <dd className="truncate font-medium">{invite.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt className="text-muted-foreground">Role</dt>
          <dd className="font-medium">{roleLabel(invite.role)}</dd>
        </div>
      </dl>

      {!user ? (
        <InviteAcceptForm token={token} email={invite.email} orgName={invite.orgName} />
      ) : matches ? (
        <InviteJoinButton token={token} orgName={invite.orgName} />
      ) : (
        <div className="space-y-4">
          <p
            role="note"
            className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
          >
            {isGuest
              ? `You are browsing as a demo guest. Sign out of the demo, then sign in or create an account as ${invite.email} to join.`
              : `You are signed in as ${signedInAs ?? 'another account'}, but this invite is for ${invite.email}. Sign out, then open it again with that email.`}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={async () => {
              await authClient.signOut();
              refetch();
            }}
          >
            Sign out
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
