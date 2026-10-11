import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRefreshViewer } from '@/features/auth/viewer-context';
import { api } from '@/lib/api';
import { roleLabel } from '@/features/auth/permissions';
import type { Workspace } from '@/features/account/lib/team';

/** Lists the viewer's workspaces; renders nothing unless they belong to several. */
export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const refresh = useRefreshViewer();
  const navigate = useNavigate();

  useEffect(() => {
    api<Workspace[]>('/team/workspaces').then(setWorkspaces, () => {});
  }, []);

  if (workspaces.length < 2) return null;

  const switchTo = async (orgId: string) => {
    setError(null);
    setPending(true);
    try {
      await api('/team/switch', { method: 'POST', json: { orgId } });
      await refresh();
      navigate('/account');
      setWorkspaces(await api<Workspace[]>('/team/workspaces'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-bold">Workspaces</h2>
      <div className="mt-3 divide-y">
        {workspaces.map((w) => (
          <div
            key={w.orgId}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{w.name}</p>
              <p className="text-sm text-muted-foreground">
                {roleLabel(w.role)}
              </p>
            </div>
            {w.isCurrent ? (
              <Badge variant="secondary">Current</Badge>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                aria-label={`Switch to ${w.name}`}
                onClick={() => switchTo(w.orgId)}
              >
                Switch
              </Button>
            )}
          </div>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
