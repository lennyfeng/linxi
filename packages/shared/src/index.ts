export const APP_NAME = 'internal-platform';

export const MODULE_KEYS = {
  AUTH: 'auth',
  USERS: 'users',
  LEDGER: 'ledger',
  RECONCILIATION: 'reconciliation',
  PRODUCT_DEV: 'product-dev',
  SAVED_VIEWS: 'saved-views',
} as const;

export * from './types/api.js';
export * from './types/pagination.js';
export * from './types/entities.js';
