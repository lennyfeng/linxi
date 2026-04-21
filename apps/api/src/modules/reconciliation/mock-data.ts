export const mockPurchaseOrders = [
  {
    id: 1,
    orderNo: 'PO-20260418-001',
    supplierName: '深圳优选供应链',
    amount: 5000,
    invoiceStatus: 'partial',
    reminderDisabled: 0,
    reminderDisabledReason: '',
  },
  {
    id: 2,
    orderNo: 'PO-20260418-002',
    supplierName: '东莞卓越包装',
    amount: 3200,
    invoiceStatus: 'pending',
    reminderDisabled: 1,
    reminderDisabledReason: '供应商不开票',
  },
];

export const mockPaymentRequests = [
  {
    id: 1,
    requestNo: 'PR-20260418-001',
    supplierName: '深圳优选供应链',
    amount: 5000,
    invoiceStatus: 'partial',
    reminderDisabled: 0,
    reminderDisabledReason: '',
  },
  {
    id: 2,
    requestNo: 'PR-20260418-002',
    supplierName: '东莞卓越包装',
    amount: 3200,
    invoiceStatus: 'pending',
    reminderDisabled: 1,
    reminderDisabledReason: '已线下处理',
  },
];

export const mockDeliveryOrders = [
  {
    id: 1,
    orderNo: 'DO-20260418-001',
    supplierName: '深圳优选供应链',
    amount: 3000,
    invoiceStatus: 'matched',
    reminderDisabled: 0,
    reminderDisabledReason: '',
  },
  {
    id: 2,
    orderNo: 'DO-20260418-002',
    supplierName: '深圳优选供应链',
    amount: 2000,
    invoiceStatus: 'partial',
    reminderDisabled: 0,
    reminderDisabledReason: '',
  },
  {
    id: 3,
    orderNo: 'DO-20260418-003',
    supplierName: '东莞卓越包装',
    amount: 3200,
    invoiceStatus: 'pending',
    reminderDisabled: 1,
    reminderDisabledReason: '供应商不开票',
  },
];

export const mockInvoices = [
  {
    id: 1,
    invoiceNo: 'INV-20260418-001',
    invoiceType: '增值税专票',
    supplierName: '深圳优选供应链',
    amount: 3000,
    invoiceDate: '2026-04-18',
    matchStatus: 'matched',
  },
  {
    id: 2,
    invoiceNo: 'INV-20260418-002',
    invoiceType: '增值税普票',
    supplierName: '深圳优选供应链',
    amount: 1000,
    invoiceDate: '2026-04-19',
    matchStatus: 'partial',
  },
];

export const mockInvoicePurchaseRelations = [
  { id: 1, invoiceId: 1, purchaseOrderId: 1, relationAmount: 3000, remark: '首批对应' },
  { id: 2, invoiceId: 2, purchaseOrderId: 1, relationAmount: 1000, remark: '第二张发票部分对应' },
];

export const mockInvoicePaymentRequestRelations = [
  { id: 1, invoiceId: 1, paymentRequestId: 1, relationAmount: 3000, remark: '请款对应发票' },
  { id: 2, invoiceId: 2, paymentRequestId: 1, relationAmount: 1000, remark: '请款部分覆盖' },
];

export const mockInvoiceDeliveryRelations = [
  { id: 1, invoiceId: 1, deliveryOrderId: 1, relationAmount: 3000, remark: '发票全额对应发货单1' },
  { id: 2, invoiceId: 2, deliveryOrderId: 2, relationAmount: 1000, remark: '发票部分对应发货单2' },
];

export const mockStatusSnapshots = [
  { id: 1, businessType: 'purchase', businessId: 1, amountTotal: 5000, amountCovered: 4000, relationStatus: 'partial' },
  { id: 2, businessType: 'payment_request', businessId: 1, amountTotal: 5000, amountCovered: 4000, relationStatus: 'partial' },
  { id: 3, businessType: 'delivery', businessId: 1, amountTotal: 3000, amountCovered: 3000, relationStatus: 'matched' },
  { id: 4, businessType: 'delivery', businessId: 2, amountTotal: 2000, amountCovered: 1000, relationStatus: 'partial' },
  { id: 5, businessType: 'delivery', businessId: 3, amountTotal: 3200, amountCovered: 0, relationStatus: 'pending' },
  { id: 6, businessType: 'invoice', businessId: 1, amountTotal: 3000, amountCovered: 3000, relationStatus: 'matched' },
  { id: 7, businessType: 'invoice', businessId: 2, amountTotal: 1000, amountCovered: 1000, relationStatus: 'matched' },
];
