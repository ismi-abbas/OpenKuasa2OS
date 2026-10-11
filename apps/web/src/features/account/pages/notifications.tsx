import { NotificationsForm } from '@/features/account/components/notifications-form';
import { PageFrame } from '@/features/account/components/page-frame';
import { useViewer } from '@/features/auth/viewer-context';
import type { Profile } from '@/features/account/lib/data';
import { useFetch } from '@/features/account/lib/use-fetch';

export default function NotificationsPage() {
  const viewer = useViewer();
  const { data: profile, error } = useFetch<Profile>('/account/profile');

  return (
    <PageFrame title="Notifications" subtitle="Choose what we tell you and how." loading={!profile} error={error}>
      {profile ? (
        <NotificationsForm
          prefs={profile.notificationPrefs}
          email={profile.email}
          timezone={profile.timezone}
          readOnly={viewer.isDemo}
        />
      ) : null}
    </PageFrame>
  );
}
