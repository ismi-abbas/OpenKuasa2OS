import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRefreshViewer } from '@/features/auth/viewer-context';
import { api } from '@/lib/api';
import { AVATAR_ACCEPT, avatarFileError } from './avatar-rules';
import type { SettingsState } from './settings-form';
import { UserAvatar } from './user-avatar';

export function ProfilePhotoCard({
  initials,
  avatarUrl,
  readOnly,
}: {
  initials: string;
  avatarUrl: string | null;
  readOnly: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<SettingsState>(undefined);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [url, setUrl] = useState(avatarUrl);
  const refresh = useRefreshViewer();

  const run = async (kind: 'upload' | 'remove', request: () => Promise<{ notice: string; avatarUrl?: string }>) => {
    setBusy(kind);
    setState(undefined);
    try {
      const r = await request();
      setUrl(r.avatarUrl ?? null);
      await refresh();
      setState({ notice: r.notice });
    } catch (e) {
      setState({ error: e instanceof Error ? e.message : 'Could not save your photo. Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  const upload = (file: File) => {
    const invalid = avatarFileError(file);
    if (invalid) return setState({ error: invalid });
    const body = new FormData();
    body.set('file', file);
    void run('upload', () => api('/account/avatar', { method: 'POST', body }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile photo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <UserAvatar
          initials={initials}
          avatarUrl={url}
          className="size-16"
          fallbackClassName="text-lg font-bold"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose a profile photo"
              disabled={readOnly || busy !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Clear the input so picking the same file again still fires.
                event.target.value = '';
                if (file) upload(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly || busy !== null}
              onClick={() => inputRef.current?.click()}
            >
              {busy === 'upload' ? 'Uploading…' : url ? 'Change photo' : 'Upload photo'}
            </Button>
            {url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={readOnly || busy !== null}
                onClick={() => void run('remove', () => api('/account/avatar', { method: 'DELETE' }))}
              >
                {busy === 'remove' ? 'Removing…' : 'Remove'}
              </Button>
            ) : null}
          </div>
          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : state?.notice ? (
            <p role="status" className="text-sm text-muted-foreground">
              {state.notice}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? 'Photos can’t be changed in the demo workspace.'
                : url
                  ? 'JPG, PNG or WebP, up to 2MB.'
                  : 'Your initials are shown until you add a photo. JPG, PNG or WebP, up to 2MB.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
