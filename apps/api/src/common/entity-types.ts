// ============================
// Reconciliation Module
// ============================

export interface PurchaseOrder {
  id: number;
  orderNo: string;
  supplierName: string;
  amount: number;
  invoiceStatus: string | null;
  reminderDisabled: number;
  reminderDisabledReason: string | null;
  sourceUpdatedAt?: string | null;
}

export interface PaymentRequest {
  id: number;
  requestNo: string;
  supplierName: string;
  amount: number;
  invoiceStatus: string | null;
  reminderDisabled: number;
  reminderDisabledReason: string | null;
  sourceUpdatedAt?: string | null;
}

export interface DeliveryOrder {
  id: number;
  orderNo: string;
  supplierName: string;
  amount: number;
  invoiceStatus: string | null;
  reminderDisabled: number;
  reminderDisabledReason: string | null;
  sourceUpdatedAt?: string | null;
}

export interface InvoiceRecord {
  id: number;
  invoiceNo: string;
  invoiceType: string | null;
  supplierName: string;
  amount: number;
  invoiceDate: string | null;
  matchStatus: string | null;
  sourceUpdatedAt?: string | null;
}

export interface InvoicePurchaseRelation {
  id: number;
  invoiceId: number;
  purchaseOrderId: number;
  relationAmount: number;
  remark: string | null;
}

export interface InvoicePaymentRequestRelation {
  id: number;
  invoiceId: number;
  paymentRequestId: number;
  relationAmount: number;
  remark: string | null;
}

export interface InvoiceDeliveryRelation {
  id: number;
  invoiceId: number;
  deliveryOrderId: number;
  relationAmount: number;
  remark: string | null;
}

export interface StatusSnapshot {
  id: number;
  businessType: string;
  businessId: number;
  amountTotal: number;
  amountCovered: number;
  relationStatus: string;
  updatedAt: string | null;
}

// ============================
// Product Dev Module
// ============================

export interface ProductDevProject {
  id: number;
  projectCode: string;
  productName: string;
  sku: string | null;
  developerName: string | null;
  ownerName: string | null;
  targetPlatform: string | null;
  targetMarket: string | null;
  estimatedCost: number | null;
  targetPrice: number | null;
  grossMarginTarget: number | null;
  projectStatus: string;
}

export interface SupplierQuote {
  id: number;
  projectId: number;
  supplierName: string;
  supplierErpId: string | null;
  currency: string;
  quotePrice: number;
  moq: number | null;
  taxIncluded: number;
  deliveryDays: number | null;
  preferred: number;
}

export interface ProfitCalculation {
  id: number;
  projectId: number;
  salesPriceUsd: number | null;
  exchangeRate: number | null;
  productCostRmb: number | null;
  accessoryCostRmb: number | null;
  shippingExpress: number | null;
  shippingAir: number | null;
  shippingSea: number | null;
  selectedPlan: string | null;
  selectedProfit: number | null;
  selectedProfitRate: number | null;
  calculatedBy: string | null;
}

export interface SampleRecord {
  id: number;
  projectId: number;
  roundNo: number;
  supplierName: string | null;
  sampleFee: number | null;
  reviewResult: string | null;
  improvementNotes: string | null;
}

export interface SyncRecord {
  id: number;
  projectId: number;
  syncStatus: string;
  syncedBy: string | null;
  syncTime: string | null;
  resultMessage: string | null;
}

// ============================
// Users Module
// ============================

export interface User {
  id: number;
  name: string;
  username: string;
  email: string | null;
  mobile: string | null;
  sourceType: string;
  departmentId: number | null;
  departmentName: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface Department {
  id: number;
  name: string;
  parentId: number | null;
  code: string | null;
  status: string;
}

export interface Role {
  id: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  status: string;
}

export interface Permission {
  id: number;
  permissionKey: string;
  permissionName: string;
  permissionType: string | null;
  moduleKey: string | null;
}

// ============================
// Saved Views Module
// ============================

export interface SavedView {
  id: number;
  module_key: string;
  view_name: string;
  view_config: unknown;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ============================
// Ledger Module
// ============================

export interface LedgerAccount {
  id: number;
  accountName: string;
  accountType: string;
  accountSourceType: string | null;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  status: string;
  remark?: string | null;
  accountGroup?: string | null;
  includeInAssets?: number;
  bankName?: string | null;
  accountNumber?: string | null;
}

export interface LedgerCategory {
  id: number;
  parentId: number | null;
  categoryName: string;
  categoryType: string;
  sortNo: number;
  status: string;
}

export interface LedgerTransaction {
  id: number;
  transactionNo: string;
  transactionType: string;
  transactionDate: string;
  postingDate?: string | null;
  accountId: number | null;
  transferOutAccountId?: number | null;
  transferInAccountId?: number | null;
  amount: number;
  transferInAmount?: number | null;
  currency: string;
  exchangeRate?: number | null;
  amountCny?: number | null;
  paymentAccount?: string | null;
  categoryId: number | null;
  counterpartyId?: number | null;
  counterpartyName: string | null;
  projectId?: number | null;
  projectName?: string | null;
  summary?: string | null;
  remark?: string | null;
  reimbursementRequired?: number;
  reimbursementStatus?: string | null;
  invoiceRequired?: number;
  status?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  thumbnailUrl?: string | null;
}

export interface ImportBatch {
  id: number;
  batchNo: string;
  sourceType: string | null;
  fileName: string | null;
  importedBy: string | null;
  status: string;
  createdAt: string | null;
}

export interface ExternalTransaction {
  id: number;
  importBatchId: number;
  sourceType: string;
  externalNo: string | null;
  transactionDate: string | null;
  amount: number;
  currency: string;
  paymentAccount: string | null;
  counterpartyAccount: string | null;
  counterpartyName: string | null;
  bankSummary: string | null;
  matchStatus: string;
}

export interface TransactionMatch {
  id: number;
  transactionId: number;
  externalTransactionId: number | null;
  matchStatus: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export interface TransactionAttachment {
  id: number;
  transactionId: number;
  fileKey?: string | null;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  fileUrl: string | null;
}

// ============================
// Payload types for create/update
// ============================

export interface InvoicePurchaseRelationPayload {
  invoiceId: number;
  purchaseOrderId: number;
  relationAmount: number;
  remark: string | null;
}

export interface InvoicePaymentRequestRelationPayload {
  invoiceId: number;
  paymentRequestId: number;
  relationAmount: number;
  remark: string | null;
}

export interface InvoiceDeliveryRelationPayload {
  invoiceId: number;
  deliveryOrderId: number;
  relationAmount: number;
  remark: string | null;
}

export interface StatusSnapshotPayload {
  businessType: string;
  businessId: number;
  amountTotal: number;
  amountCovered: number;
  relationStatus: string;
}
