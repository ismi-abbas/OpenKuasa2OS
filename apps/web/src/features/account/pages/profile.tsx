import { PageFrame } from '@/features/account/components/page-frame';
import { ProfileEmailForm } from '@/features/account/components/profile-email-form';
import { ProfileForm } from '@/features/account/components/profile-form';
import { ProfilePhotoCard } from '@/features/account/components/profile-photo-card';
import { ReadOnlyNotice } from '@/features/account/components/settings-form';
import { useViewer } from '@/features/auth/viewer-context';
import type { Profile } from '@/features/account/lib/data';
import { useFetch } from '@/features/account/lib/use-fetch';

export default function ProfilePage() {
  const viewer = useViewer();
  const { data: profile, error } = useFetch<Profile>('/account/profile');

  return (
    <PageFrame title="My Profile" subtitle="Your personal details." loading={!profile} error={error}>
      {profile ? (
        <div className="space-y-6">
          {viewer.isDemo ? (
            <ReadOnlyNotice>
              You&apos;re exploring the demo workspace, so this profile is read-only.
            </ReadOnlyNotice>
          ) : null}
          <ProfilePhotoCard initials={viewer.initials} avatarUrl={profile.avatarUrl} readOnly={viewer.isDemo} />
          <ProfileForm profile={profile} readOnly={viewer.isDemo} />
          <ProfileEmailForm email={profile.email} readOnly={viewer.isDemo} />
        </div>
      ) : null}
    </PageFrame>
  );
}
