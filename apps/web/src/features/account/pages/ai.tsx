import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AiKeyForm, RemoveAiKeyForm } from '@/features/account/components/ai-key-form';
import { ReadOnlyNotice } from '@/features/account/components/settings-form';
import { useViewer } from '@/features/auth/viewer-context';
import type { ChatStatusForViewer } from '@/features/command/chat-key-notice';
import { api } from '@/lib/api';

export default function AiKeyPage() {
  const viewer = useViewer();
  const [status, setStatus] = useState<ChatStatusForViewer | null>(null);
  const load = useCallback(() => api<ChatStatusForViewer>('/ai/status').then(setStatus).catch(() => {}), []);
  useEffect(() => {
    if (!viewer.isDemo) void load();
  }, [viewer.isDemo, load]);
  const canManage = !!status?.canManageKey;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">AI key</h1>
        <p className="text-sm text-muted-foreground">
          Chat runs on your own OpenRouter account.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Add one OpenRouter key for {viewer.orgName} and everyone in the
              workspace chats on it, billed to your OpenRouter account with no
              limit from us. Set a spending limit on the key in OpenRouter.
            </p>
            <p>
              Without a key, each person gets{' '}
              {status?.freeLimit ?? 3} free questions a week across all the
              assistants.
            </p>
            <p>
              Create a key at{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                openrouter.ai/keys
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!status ? (
              <ReadOnlyNotice>
                The demo workspace shows sample answers and does not use a key.
                Sign up to add your own.
              </ReadOnlyNotice>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {status.hasKey ? status.keyHint : 'No key added'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {status.hasKey
                        ? 'Chat is running on your OpenRouter account.'
                        : `You have ${status.freeRemaining} of ${status.freeLimit} free questions left this week.`}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {status.hasKey ? 'Active' : 'Not set'}
                  </span>
                </div>

                {!canManage ? (
                  <ReadOnlyNotice>
                    Only owners and admins can add or change the workspace key.
                  </ReadOnlyNotice>
                ) : (
                  <>
                    <AiKeyForm hasKey={status.hasKey} onChanged={load} />
                    {status.hasKey ? <RemoveAiKeyForm onChanged={load} /> : null}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
