import { Link, useSearchParams } from 'react-router';
import { ScrollText } from 'lucide-react';
import { ActivityFilters } from '@/features/account/components/activity-filters';
import { ActivityTable } from '@/features/account/components/activity-table';
import { PageFrame } from '@/features/account/components/page-frame';
import { useViewer } from '@/features/auth/viewer-context';
import { EmptyState } from '@/components/screen/empty-state';
import { activityHref, activityQuery, parseActivityFilters, type ActivityPage } from '@/features/account/lib/activity';
import { useFetch } from '@/features/account/lib/use-fetch';

const PAGER_LINK = 'text-sm font-medium text-primary hover:underline';

export default function ActivityPage() {
  const viewer = useViewer();
  const [params] = useSearchParams();
  const filters = parseActivityFilters(params);
  const { data: activity, error } = useFetch<ActivityPage>(`/account/activity${activityQuery(filters)}`);

  return (
    <PageFrame
      wide
      title="Activity log"
      subtitle={`A record of actions across ${viewer.orgName}.`}
      loading={!activity}
      error={error}
    >
      {activity ? (
        <>
          <ActivityFilters filters={filters} />

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {activity.entries.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title={filters.before ? 'No older activity' : 'No activity in this period'}
                description={
                  filters.before
                    ? 'You have reached the start of the log for these filters.'
                    : 'Sign-ins, team changes and data edits will show up here. Try a wider period or another category.'
                }
              />
            ) : (
              <ActivityTable entries={activity.entries} />
            )}
          </div>

          {filters.before || activity.nextBefore ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              {filters.before ? (
                <Link to={activityHref({ ...filters, before: undefined })} className={PAGER_LINK}>
                  Back to latest
                </Link>
              ) : (
                <span />
              )}
              {activity.nextBefore ? (
                <Link to={activityHref({ ...filters, before: activity.nextBefore })} className={PAGER_LINK}>
                  Load older
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </PageFrame>
  );
}
