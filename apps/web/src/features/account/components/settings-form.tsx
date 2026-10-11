import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SettingsState = { error?: string; notice?: string } | undefined;

/**
 * Submit handler for a settings form: `action` gets the FormData and returns
 * the success notice (throw to show an error). Fields keep their values after
 * a save unless `reset` is set (password forms).
 */
export function useSettingsForm(action: (formData: FormData) => Promise<string>, reset = false) {
  const [state, setState] = useState<SettingsState>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setState(undefined);
    try {
      setState({ notice: await action(new FormData(form)) });
      if (reset) form.reset();
    } catch (e) {
      setState({ error: e instanceof Error ? e.message : 'Something went wrong. Please try again.' });
    } finally {
      setPending(false);
    }
  };

  return { state, onSubmit, pending };
}

export function ReadOnlyNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="note"
      className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
    >
      <Lock className="size-4 shrink-0" />
      {children}
    </p>
  );
}

export function SaveBar({
  state,
  pending,
  disabled,
  label = 'Save changes',
}: {
  state: SettingsState;
  pending: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-4">
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.notice ? (
        <p role="status" className="text-sm text-muted-foreground">
          {state.notice}
        </p>
      ) : null}
      <Button type="submit" disabled={disabled || pending}>
        {pending ? 'Saving…' : label}
      </Button>
    </div>
  );
}
