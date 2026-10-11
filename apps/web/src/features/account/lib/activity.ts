import { z } from 'zod';

export const ACTIVITY_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'auth', label: 'Sign-ins' },
  { value: 'team', label: 'Team' },
  { value: 'data', label: 'Data' },
  { value: 'security', label: 'Security' },
  { value: 'billing', label: 'Billing' },
] as const;

export const ACTIVITY_PERIODS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: 'all', label: 'All time', days: null },
] as const;

export type ActivityCategoryFilter = (typeof ACTIVITY_CATEGORIES)[number]['value'];
export type ActivityPeriod = (typeof ACTIVITY_PERIODS)[number]['value'];

export type ActivityFilters = {
  category: ActivityCategoryFilter;
  period: ActivityPeriod;
  /** Cursor: only rows created before this timestamp. */
  before?: string;
};

export type ActivityEntry = {
  id: string;
  actorName: string;
  action: string;
  target: string | null;
  category: string;
  createdAt: string;
};

export type ActivityPage = {
  entries: ActivityEntry[];
  /** Cursor for the next (older) page, when there is one. */
  nextBefore: string | null;
};

const DEFAULTS = { category: 'all', period: '30d' } as const;

// Each field falls back on its own, so one bad value does not reset the others.
const filtersSchema = z.object({
  category: z.enum(ACTIVITY_CATEGORIES.map((c) => c.value)).catch(DEFAULTS.category),
  period: z.enum(ACTIVITY_PERIODS.map((p) => p.value)).catch(DEFAULTS.period),
  before: z.iso.datetime({ offset: true }).optional().catch(undefined),
});

export function parseActivityFilters(params: URLSearchParams): ActivityFilters {
  return filtersSchema.parse({
    category: params.get('category') ?? undefined,
    period: params.get('period') ?? undefined,
    before: params.get('before') ?? undefined,
  });
}

/** Query string for the activity page and API; defaults are left out. */
export function activityQuery(filters: ActivityFilters): string {
  const params = new URLSearchParams();
  if (filters.category !== DEFAULTS.category) params.set('category', filters.category);
  if (filters.period !== DEFAULTS.period) params.set('period', filters.period);
  if (filters.before) params.set('before', filters.before);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Link to the activity log with these filters. */
export const activityHref = (filters: ActivityFilters) => `/account/activity${activityQuery(filters)}`;
