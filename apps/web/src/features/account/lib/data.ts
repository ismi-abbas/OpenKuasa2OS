import type { NotificationPrefs } from '@/features/account/config';
import type { OrgRole } from '@/features/auth/viewer';

// Shapes returned by the Worker's /api/account/* routes.
export type Profile = {
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  phone: string;
  jobTitle: string;
  timezone: string;
  language: string;
  productUpdates: boolean;
  notificationPrefs: NotificationPrefs;
};

export type Company = {
  name: string;
  registrationNo: string;
  sstNo: string;
  website: string;
  industry: string;
  companySize: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
};

export type TeamMember = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: OrgRole;
  isYou: boolean;
};
