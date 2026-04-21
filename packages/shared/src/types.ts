export type ModuleKey = 'auth' | 'users' | 'ledger' | 'reconciliation' | 'product-dev';

export interface ExternalTransactionMatchRule {
  allowOneSystemToManyExternal: true;
  allowManySystemToOneExternal: false;
  requireAmountEqualityForManyExternal: true;
}
