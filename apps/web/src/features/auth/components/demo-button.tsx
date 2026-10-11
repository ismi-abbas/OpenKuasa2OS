import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

export function DemoButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const onClick = async () => {
    setError(null);
    setPending(true);
    try {
      const { error: anonErr } = await authClient.signIn.anonymous();
      if (anonErr) throw anonErr;
      await api('/team/demo', { method: 'POST' });
      navigate('/command');
    } catch {
      await authClient.signOut().catch(() => {});
      setError('Demo is unavailable right now.');
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        size="lg"
        disabled={pending}
        onClick={onClick}
      >
        {pending ? 'Loading demo…' : 'Try the demo'}
      </Button>
      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
