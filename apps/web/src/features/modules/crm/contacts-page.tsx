import { useCallback, useEffect, useState } from 'react';
import ContactsScreen, { type CrmContact } from '@/features/modules/reach/contacts';
import { useViewer } from '@/features/auth/viewer-context';
import { api } from '@/lib/api';

/** Air contacts: live from the API; falls back to the sample view if it can't load. */
export default function CrmContactsPage() {
  const { role } = useViewer();
  const [live, setLive] = useState<{ contacts: CrmContact[]; total: number } | null>(null);

  const load = useCallback(
    () =>
      api<{ contacts: CrmContact[]; total: number }>('/crm/contacts?limit=20')
        .then(setLive)
        .catch((e) => console.error('[crm/contacts] could not load contacts', e)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  if (!live) return <ContactsScreen />;
  return (
    <ContactsScreen
      contacts={live.contacts}
      totalContacts={live.total}
      // Viewers can read contacts but the API refuses their writes.
      onCreateContact={
        role === 'viewer'
          ? undefined
          : async (json) => {
              await api('/crm/contacts', { method: 'POST', json });
              await load();
            }
      }
    />
  );
}
