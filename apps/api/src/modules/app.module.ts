import { authModule } from './auth/index.js';
import { usersModule } from './users/index.js';
import { ledgerModule } from './ledger/index.js';
import { reconciliationModule } from './reconciliation/index.js';
import { productDevModule } from './product-dev/index.js';
import { savedViewsModule } from './saved-views/index.js';

export const AppModule = {
  modules: [authModule, usersModule, ledgerModule, reconciliationModule, productDevModule, savedViewsModule],
};
