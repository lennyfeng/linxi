/**
 * Query cache configuration for react-query / SWR-style caching.
 *
 * Stale times are in milliseconds.
 */

/** Reference data that rarely changes – 5 minute stale time */
export const REFERENCE_DATA_STALE_TIME = 5 * 60 * 1000;

/** Transactional data – 30 second stale time */
export const TRANSACTIONAL_STALE_TIME = 30 * 1000;

/** Dashboard data – 60 second stale time */
export const DASHBOARD_STALE_TIME = 60 * 1000;

/** Default stale time for all queries */
export const DEFAULT_STALE_TIME = 60 * 1000;

/** Reference data query keys that should use longer cache */
export const REFERENCE_QUERY_KEYS = [
  'users',
  'suppliers',
  'categories',
  'exchange-rates',
  'departments',
  'roles',
] as const;

/** Check if a query key is reference data */
export function isReferenceQuery(key: string): boolean {
  return REFERENCE_QUERY_KEYS.includes(key as (typeof REFERENCE_QUERY_KEYS)[number]);
}

/** Get stale time for a given query key */
export function getStaleTime(key: string): number {
  if (isReferenceQuery(key)) return REFERENCE_DATA_STALE_TIME;
  if (key === 'dashboard') return DASHBOARD_STALE_TIME;
  return TRANSACTIONAL_STALE_TIME;
}
