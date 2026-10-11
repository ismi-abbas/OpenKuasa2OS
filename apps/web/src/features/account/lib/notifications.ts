export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  /** App-relative link, already checked by the Worker. */
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationFeed = {
  items: NotificationItem[];
  unreadCount: number;
};

export const EMPTY_FEED: NotificationFeed = { items: [], unreadCount: 0 };

/** True for same-app paths like "/account/security"; rejects other origins. */
export function isAppHref(href: string | null | undefined): href is string {
  return (
    typeof href === 'string' &&
    href.startsWith('/') &&
    !href.startsWith('//') &&
    !href.includes('\\')
  );
}

/** "Just now", "2m ago", "3h ago", "4d ago", then a short date. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(then);
}
