import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { NOTIFY_CHANNELS, NOTIFY_EVENTS } from '@/features/account/config';

// Settings-form handlers: take the submitted FormData, call the Worker, return the success notice.
// Failures throw; useSettingsForm shows the message (ApiError carries the server's `{ error }`).

const field = (fd: FormData, name: string) => String(fd.get(name) ?? '');
const on = (fd: FormData, name: string) => fd.get(name) === 'on';
type Notice = { notice: string };
const put = (path: string, json: unknown) => api<Notice>(`/account${path}`, { method: 'PUT', json }).then((r) => r.notice);

export const updateProfile = (fd: FormData) =>
  put('/profile', {
    fullName: field(fd, 'fullName'),
    phone: field(fd, 'phone'),
    jobTitle: field(fd, 'jobTitle'),
    timezone: field(fd, 'timezone'),
    language: field(fd, 'language'),
    productUpdates: on(fd, 'productUpdates'),
  });

export const updateCompany = (fd: FormData) =>
  put('/company', Object.fromEntries(
    ['name', 'registrationNo', 'sstNo', 'website', 'industry', 'companySize', 'address', 'city', 'state', 'postcode'].map(
      (k) => [k, field(fd, k)],
    ),
  ));

export const updateNotifications = (fd: FormData) => {
  const channelSet = (key: (c: string) => string) =>
    Object.fromEntries(NOTIFY_CHANNELS.map((c) => [c, on(fd, key(c))]));
  return put('/notification-prefs', {
    channels: channelSet((c) => `channel.${c}`),
    events: Object.fromEntries(NOTIFY_EVENTS.map((e) => [e.id, channelSet((c) => `event.${e.id}.${c}`)])),
    quiet: { enabled: on(fd, 'quietEnabled'), from: field(fd, 'quietFrom'), to: field(fd, 'quietTo') },
  });
};

/** Tells the Worker's activity log / security notification about something better-auth just did. */
export const reportSecurityEvent = (kind: string, target?: string) =>
  api('/account/security-event', { method: 'POST', json: { kind, target } }).catch(() => {});

type AuthResult = { error: { message?: string } | null };
const ok = async (p: Promise<AuthResult>, fallback: string) => {
  const { error } = await p;
  if (error) throw new Error(error.message || fallback);
};

export async function changePassword(fd: FormData) {
  const next = field(fd, 'next');
  if (next.length < 8) throw new Error('New password must be at least 8 characters.');
  if (next !== field(fd, 'confirm')) throw new Error('The new passwords do not match.');
  const res = await authClient.changePassword({ currentPassword: field(fd, 'current'), newPassword: next });
  if (res.error) {
    throw new Error(/invalid password/i.test(res.error.message ?? '') ? 'Your current password is incorrect.' : 'Could not update your password. Please try again.');
  }
  await reportSecurityEvent('password_changed');
  return 'Password updated.';
}

export async function signOutOtherSessions() {
  await ok(authClient.revokeOtherSessions(), 'Could not sign out other devices.');
  await reportSecurityEvent('signed_out_others');
  return 'Signed out of all other devices.';
}

export async function requestEmailChange(fd: FormData) {
  const newEmail = field(fd, 'email').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(newEmail)) throw new Error('Please enter a valid email address.');
  await ok(authClient.changeEmail({ newEmail, callbackURL: '/account/profile' }), 'Could not start the email change. Please try again.');
  await reportSecurityEvent('email_changed', newEmail);
  return `Confirmation link sent. Your sign-in email changes once you approve it from your inbox.`;
}
