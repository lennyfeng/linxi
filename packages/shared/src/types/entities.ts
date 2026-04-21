// ── Users & Permissions ──

export interface User {
  id: number;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  departmentId: number | null;
  lingxingUid: string | null;
  status: 'active' | 'disabled';
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

export interface Department {
  id: number;
  name: string;
  parentId: number | null;
  sortOrder: number;
  children?: Department[];
}

// ── Ledger ──

export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund';
export type TransactionStatus = 'draft' | 'submitted';

export interface Account {
  id: number;
  name: string;
  type: 'bank' | 'airwallex' | 'cash' | 'other';
  currency: string;
  bankName: string | null;
  accountNumber: string | null;
  openingBalance: number;
  openingDate: string;
  status: 'active' | 'disabled';
}

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  sortOrder: number;
  children?: Category[];
}

export interface Transaction {
  id: number;
  type: TransactionType;
  date: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  cnyEquivalent: number;
  accountId: number;
  accountName?: string;
  categoryId: number | null;
  categoryName?: string;
  counterparty: string | null;
  summary: string | null;
  remark: string | null;
  status: TransactionStatus;
  reimbursementFlag: boolean;
  invoiceFlag: boolean;
  linkedReconId: number | null;
  // Transfer-specific
  toAccountId: number | null;
  toAmount: number | null;
  toCurrency: string | null;
  exchangeGainLoss: number | null;
  // Meta
  attachmentCount: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  yearMonth: string;
  income: number;
  expense: number;
  balance: number;
}

export interface DateGroup {
  date: string;
  transactions: Transaction[];
}

// ── Reconciliation ──

export type ReconEntityType = 'purchase_order' | 'payment_request' | 'delivery_order' | 'invoice';
export type ReconLinkStatus = 'not_linked' | 'partially_linked' | 'fully_linked' | 'do_not_remind';

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
  status: string;
  linkStatus: ReconLinkStatus;
  linkedAmount: number;
  lingxingId: string;
  syncedAt: string;
}

export interface PaymentRequest {
  id: number;
  prNumber: string;
  supplierName: string;
  amount: number;
  currency: string;
  requestDate: string;
  status: string;
  linkStatus: ReconLinkStatus;
  linkedAmount: number;
  lingxingId: string;
  syncedAt: string;
}

export interface DeliveryOrder {
  id: number;
  doNumber: string;
  supplierName: string;
  status: string;
  linkStatus: ReconLinkStatus;
  linkedAmount: number;
  shipDate: string;
  lingxingId: string;
  syncedAt: string;
}

export interface Invoice {
  id: number;
  invoiceCode: string;
  invoiceNumber: string;
  invoiceDate: string;
  amountWithTax: number;
  amountWithoutTax: number;
  taxAmount: number;
  taxRate: number;
  sellerName: string;
  buyerName: string;
  status: string;
  linkStatus: ReconLinkStatus;
  linkedAmount: number;
  source: 'lemon_cloud' | 'manual';
  syncedAt: string;
}

export interface ReconRelation {
  id: number;
  sourceType: ReconEntityType;
  sourceId: number;
  targetType: ReconEntityType;
  targetId: number;
  amount: number;
  createdBy: number;
  createdAt: string;
}

// ── Product Development ──

export type ProjectStage =
  | 'pending_research'
  | 'researching'
  | 'sampling_approval'
  | 'sampling_rejected'
  | 'sampling'
  | 'pending_quote'
  | 'pending_project_approval'
  | 'project_confirmed'
  | 'project_rejected'
  | 'pending_finalization'
  | 'pending_online'
  | 'synced_to_lingxing'
  | 'first_order_placed';

export interface Project {
  id: number;
  name: string;
  sku: string;
  spu: string | null;
  type: string;
  material: string | null;
  tags: string[];
  developerId: number;
  developerName?: string;
  ownerId: number;
  ownerName?: string;
  stage: ProjectStage;
  targetPlatform: string | null;
  targetMarket: string | null;
  competitorLinks: string[];
  expectedCost: number | null;
  targetPrice: number | null;
  marginTarget: number | null;
  imageUrls: string[];
  daysInStage: number;
  createdAt: string;
  updatedAt: string;
}

export interface SamplingRound {
  id: number;
  projectId: number;
  roundNumber: number;
  supplierId: number | null;
  supplierName?: string;
  cost: number | null;
  timeline: string | null;
  imageUrls: string[];
  reviewResult: 'pending' | 'approved' | 'rejected' | null;
  rejectionReason: string | null;
  improvementNotes: string | null;
  confirmedAt: string | null;
}

export interface SupplierQuote {
  id: number;
  projectId: number;
  supplierId: number | null;
  lingxingSupplierId: string | null;
  supplierName: string;
  purchaseUrls: string[];
  notes: string | null;
  leadTime: number | null;
  isPreferred: boolean;
  currency: string;
  taxIncluded: boolean;
  taxRate: number | null;
  moq: number | null;
  tiers: QuoteTier[];
}

export interface QuoteTier {
  id: number;
  quoteId: number;
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
}

export interface ProfitCalc {
  id: number;
  projectId: number;
  productName: string;
  imageUrl: string | null;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  actualWeightKg: number;
  costRmb: number;
  accessoriesRmb: number;
  sellingPriceUsd: number;
  exchangeRate: number;
  expressRatePerKg: number;
  airRatePerKg: number;
  seaRatePerKg: number;
  fbaFeeUsd: number;
  // Calculated
  expressMargin: number;
  airMargin: number;
  seaMargin: number;
  createdAt: string;
}

export interface Approval {
  id: number;
  projectId: number;
  node: 'sampling' | 'project' | 'finalization' | 'online';
  approverId: number;
  approverName?: string;
  submittedAt: string;
  result: 'pending' | 'approved' | 'rejected' | null;
  opinion: string | null;
  rejectionReason: string | null;
  decidedAt: string | null;
}

// ── System ──

export type SyncJobStatus = 'idle' | 'running' | 'success' | 'failed' | 'retry';

export interface SyncJob {
  id: number;
  jobType: string;
  cronExpr: string;
  enabled: boolean;
  status: SyncJobStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  result: string | null;
  error: string | null;
  retryCount: number;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'sync_failure' | 'approval_pending' | 'recon_alert' | 'system';
  title: string;
  content: string;
  module: string | null;
  entityType: string | null;
  entityId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface SavedView {
  id: number;
  userId: number;
  pageKey: string;
  name: string;
  filterConfig: Record<string, unknown>;
  columnConfig: Record<string, unknown>;
  sortConfig: Record<string, unknown>;
}
