import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** GET `path` from the Worker (refetches when it changes). `error` is the server's message. */
export function useFetch<T>(path: string) {
  const [state, setState] = useState<{ path: string; data?: T; error?: string }>({ path });
  useEffect(() => {
    let live = true;
    api<T>(path).then(
      (data) => live && setState({ path, data }),
      (e: Error) => live && setState({ path, error: e.message }),
    );
    return () => {
      live = false;
    };
  }, [path]);
  // Stale result for an older path counts as still loading.
  return state.path === path ? state : { path };
}
