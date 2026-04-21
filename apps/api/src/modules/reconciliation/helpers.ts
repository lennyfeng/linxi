import {
  mockDeliveryOrders,
  mockInvoiceDeliveryRelations,
  mockInvoicePaymentRequestRelations,
  mockInvoicePurchaseRelations,
  mockInvoices,
  mockPaymentRequests,
  mockPurchaseOrders,
  mockStatusSnapshots,
} from './mock-data.js';

export function getReconciliationStatus(businessType: string, businessId: number) {
  return mockStatusSnapshots.find((item) => item.businessType === businessType && item.businessId === businessId) || null;
}

export function getInvoiceBidirectionalDetail(invoiceId: number) {
  return {
    invoice: mockInvoices.find((item) => item.id === invoiceId) || null,
    purchaseRelations: mockInvoicePurchaseRelations
      .filter((item) => item.invoiceId === invoiceId)
      .map((relation) => ({ relation, purchaseOrder: mockPurchaseOrders.find((item) => item.id === relation.purchaseOrderId) || null })),
    paymentRequestRelations: mockInvoicePaymentRequestRelations
      .filter((item) => item.invoiceId === invoiceId)
      .map((relation) => ({ relation, paymentRequest: mockPaymentRequests.find((item) => item.id === relation.paymentRequestId) || null })),
    deliveryRelations: mockInvoiceDeliveryRelations
      .filter((item) => item.invoiceId === invoiceId)
      .map((relation) => ({ relation, deliveryOrder: mockDeliveryOrders.find((item) => item.id === relation.deliveryOrderId) || null })),
    status: getReconciliationStatus('invoice', invoiceId),
  };
}

export function getPurchaseBidirectionalDetail(purchaseOrderId: number) {
  const purchaseOrder = mockPurchaseOrders.find((item) => item.id === purchaseOrderId) || null;
  const invoiceRelations = mockInvoicePurchaseRelations.filter((item) => item.purchaseOrderId === purchaseOrderId);

  const relatedPaymentRequests = mockPaymentRequests.filter((item) => item.id === purchaseOrderId);
  const relatedDeliveryOrders = mockDeliveryOrders.filter((item) => item.id === purchaseOrderId || item.id === purchaseOrderId + 1);

  return {
    purchaseOrder,
    invoices: invoiceRelations.map((relation) => ({ relation, invoice: mockInvoices.find((item) => item.id === relation.invoiceId) || null })),
    paymentRequests: relatedPaymentRequests,
    deliveryOrders: relatedDeliveryOrders,
    status: getReconciliationStatus('purchase', purchaseOrderId),
  };
}

export function getPaymentRequestBidirectionalDetail(paymentRequestId: number) {
  const paymentRequest = mockPaymentRequests.find((item) => item.id === paymentRequestId) || null;
  const invoiceRelations = mockInvoicePaymentRequestRelations.filter((item) => item.paymentRequestId === paymentRequestId);
  const relatedPurchaseOrders = mockPurchaseOrders.filter((item) => item.id === paymentRequestId);
  const relatedDeliveryOrders = mockDeliveryOrders.filter((item) => item.id === paymentRequestId || item.id === paymentRequestId + 1);

  return {
    paymentRequest,
    invoices: invoiceRelations.map((relation) => ({ relation, invoice: mockInvoices.find((item) => item.id === relation.invoiceId) || null })),
    purchaseOrders: relatedPurchaseOrders,
    deliveryOrders: relatedDeliveryOrders,
    status: getReconciliationStatus('payment_request', paymentRequestId),
  };
}

export function getDeliveryBidirectionalDetail(deliveryOrderId: number) {
  const deliveryOrder = mockDeliveryOrders.find((item) => item.id === deliveryOrderId) || null;
  const invoiceRelations = mockInvoiceDeliveryRelations.filter((item) => item.deliveryOrderId === deliveryOrderId);
  const relatedPurchaseOrders = mockPurchaseOrders.filter((item) => item.id === 1 || (deliveryOrderId === 3 && item.id === 2));
  const relatedPaymentRequests = mockPaymentRequests.filter((item) => item.id === 1 || (deliveryOrderId === 3 && item.id === 2));

  return {
    deliveryOrder,
    invoices: invoiceRelations.map((relation) => ({ relation, invoice: mockInvoices.find((item) => item.id === relation.invoiceId) || null })),
    purchaseOrders: relatedPurchaseOrders,
    paymentRequests: relatedPaymentRequests,
    status: getReconciliationStatus('delivery', deliveryOrderId),
  };
}
