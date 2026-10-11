import { Navigate } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { useViewer } from '@/features/auth/viewer-context';
import { canSee, type Capability } from '@/features/auth/permissions';

/** Replaces the old server-side `requireAccess`: sends viewers without the capability back to /account. */
export function RequireAccess({ cap, children }: { cap: Capability; children: React.ReactNode }) {
  return canSee(useViewer(), cap) ? children : <Navigate to="/account" replace />;
}

/** Page container + heading shared by the data-backed account pages. */
export function PageFrame({
  title,
  subtitle,
  wide,
  loading,
  error,
  children,
}: {
  title: string;
  subtitle: React.ReactNode;
  wide?: boolean;
  loading?: boolean;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'} px-6 py-8`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
