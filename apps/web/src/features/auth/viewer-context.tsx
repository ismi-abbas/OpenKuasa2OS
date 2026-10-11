import { createContext, useContext } from 'react';
import type { Viewer } from '@/features/auth/viewer';

const ViewerContext = createContext<{ viewer: Viewer; refresh: () => Promise<void> } | null>(null);

export function ViewerProvider({
  viewer,
  refresh = async () => {},
  children,
}: {
  viewer: Viewer;
  refresh?: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <ViewerContext.Provider value={{ viewer, refresh }}>{children}</ViewerContext.Provider>
  );
}

function useCtx() {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error('useViewer must be used inside ViewerProvider');
  return ctx;
}

export const useViewer = (): Viewer => useCtx().viewer;

/** Re-fetches GET /api/me; call after changing name, avatar, workspace or role. */
export const useRefreshViewer = () => useCtx().refresh;
