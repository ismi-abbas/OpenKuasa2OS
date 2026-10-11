import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { SaveBar, useSettingsForm } from './settings-form';

export function AiKeyForm({ hasKey, onChanged }: { hasKey: boolean; onChanged: () => void }) {
  // reset: a secret input should clear after each submit.
  const { state, onSubmit, pending } = useSettingsForm(async (fd) => {
    const { notice } = await api<{ notice: string }>('/ai/key', {
      method: 'PUT',
      json: { apiKey: String(fd.get('apiKey') ?? '') },
    });
    onChanged();
    return notice;
  }, true);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api-key">{hasKey ? 'Replace with a new key' : 'OpenRouter API key'}</Label>
        <Input
          id="api-key"
          name="apiKey"
          type="password"
          placeholder="sk-or-v1-…"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <p className="text-xs text-muted-foreground">
          We check the key with OpenRouter, then store it encrypted. It is never shown again; only its last four
          characters are.
        </p>
      </div>
      <SaveBar state={state} pending={pending} label={hasKey ? 'Replace key' : 'Save key'} />
    </form>
  );
}

export function RemoveAiKeyForm({ onChanged }: { onChanged: () => void }) {
  const { state, onSubmit, pending } = useSettingsForm(async () => {
    const { notice } = await api<{ notice: string }>('/ai/key', { method: 'DELETE' });
    onChanged();
    return notice;
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? 'Removing…' : 'Remove key'}
      </Button>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
