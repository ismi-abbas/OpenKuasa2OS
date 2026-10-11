import { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { api, ApiError } from '@/lib/api';
import type { Viewer } from '@/features/auth/viewer';
import { ViewerProvider } from './viewer-context';

// Loads GET /api/me once, then renders the child routes inside ViewerProvider.
// signed out -> /login, no workspace -> /onboarding.
// (2FA needs no state here: better-auth issues a session only after the code passes.)
export function RequireViewer() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { pathname, search } = useLocation();

  const load = useCallback(async () => {
    try {
      setViewer(await api<Viewer>('/me'));
    } catch (e) {
      if (!(e instanceof ApiError)) return setError('Could not reach the server.');
      if (e.status === 401) setRedirectTo('/login');
      else if (e.status === 409) setRedirectTo('/onboarding');
      else setError(e.message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (redirectTo) {
    const next = redirectTo === '/login' ? `?next=${encodeURIComponent(pathname + search)}` : '';
    return <Navigate to={redirectTo + next} replace />;
  }
  if (error) return <p role="alert" className="p-8 text-sm text-destructive">{error}</p>;
  if (!viewer) return null;
  return (
    <ViewerProvider viewer={viewer} refresh={load}>
      <Outlet />
    </ViewerProvider>
  );
}
