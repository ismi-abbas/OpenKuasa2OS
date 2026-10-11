import { CompanyForm } from '@/features/account/components/company-form';
import { PageFrame } from '@/features/account/components/page-frame';
import { useViewer } from '@/features/auth/viewer-context';
import type { Company } from '@/features/account/lib/data';
import { useFetch } from '@/features/account/lib/use-fetch';
import { can } from '@/features/auth/permissions';

export default function CompanyPage() {
  const viewer = useViewer();
  const { data: company, error } = useFetch<Company>('/account/company');

  const readOnlyReason = viewer.isDemo
    ? "You're exploring the demo workspace, so company details are read-only."
    : can(viewer.role, 'manage-company')
      ? null
      : 'Only owners and admins can edit company details.';

  return (
    <PageFrame title="Company details" subtitle="Your organisation's information." loading={!company} error={error}>
      {company ? <CompanyForm company={company} readOnlyReason={readOnlyReason} /> : null}
    </PageFrame>
  );
}
