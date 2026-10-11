import { expect, test } from 'vitest';
import { AVATAR_MAX_BYTES, avatarFileError } from '@/features/account/components/avatar-rules';
import { formatSecret, recoveryCodesFileText } from '@/features/account/components/mfa-helpers';
import { activityHref, parseActivityFilters } from './activity';
import { isAppHref, relativeTime } from './notifications';

const q = (s: string) => new URLSearchParams(s);

test('avatar rules', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    expect(avatarFileError({ type, size: AVATAR_MAX_BYTES })).toBeNull();
  }
  for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', '']) {
    expect(avatarFileError({ type, size: 10 })).toMatch(/JPG, PNG or WebP/);
  }
  expect(avatarFileError({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 })).toMatch(/2MB/);
  expect(avatarFileError({ type: 'image/png', size: 0 })).toMatch(/empty/);
});

test('activity filters default, keep valid values and fall back per field', () => {
  expect(parseActivityFilters(q(''))).toEqual({ category: 'all', period: '30d' });
  const before = '2026-10-01T08:15:30.123456+00:00';
  expect(parseActivityFilters(q(`category=security&period=7d&before=${encodeURIComponent(before)}`))).toEqual({
    category: 'security', period: '7d', before,
  });
  expect(parseActivityFilters(q('category=nonsense&period=90d&before=yesterday'))).toEqual({ category: 'all', period: '90d' });
});

test('activityHref omits defaults and round-trips the cursor', () => {
  expect(activityHref({ category: 'all', period: '30d' })).toBe('/account/activity');
  const before = '2026-10-01T08:15:30.123456+00:00';
  const href = activityHref({ category: 'team', period: 'all', before });
  expect(parseActivityFilters(new URL(href, 'http://x').searchParams)).toEqual({ category: 'team', period: 'all', before });
});

test('relativeTime and isAppHref', () => {
  const NOW = Date.parse('2026-10-10T12:00:00.000Z');
  const ago = (ms: number) => new Date(NOW - ms).toISOString();
  expect(relativeTime(ago(20_000), NOW)).toBe('Just now');
  expect(relativeTime(ago(2 * 60_000), NOW)).toBe('2m ago');
  expect(relativeTime(ago(3 * 3_600_000), NOW)).toBe('3h ago');
  expect(relativeTime(ago(4 * 86_400_000), NOW)).toBe('4d ago');
  expect(relativeTime('not a date', NOW)).toBe('');
  expect(isAppHref('/account/security')).toBe(true);
  for (const h of ['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', 'account', null]) {
    expect(isAppHref(h)).toBe(false);
  }
});

test('mfa helpers', () => {
  expect(formatSecret('ABCDEFGHIJ')).toBe('ABCD EFGH IJ');
  expect(recoveryCodesFileText(['a-1', 'b-2'])).toContain('a-1\nb-2');
});
