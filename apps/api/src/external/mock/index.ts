/**
 * External API Mock Mode
 *
 * When MOCK_EXTERNAL_API=true, all sync functions return mock data
 * instead of calling live Lingxing / Lemon Cloud APIs.
 *
 * Usage: import { isMockMode, getMockPurchaseOrders, ... } from './mock/index.js';
 */

export function isMockMode(): boolean {
  return process.env.MOCK_EXTERNAL_API === 'true';
}

export function getMockPurchaseOrders() {
  return [
    { orderNo: 'MOCK-PO-001', supplierName: 'Mock Supplier A', amount: 10000, invoiceStatus: 'pending', sourceUpdatedAt: new Date().toISOString() },
    { orderNo: 'MOCK-PO-002', supplierName: 'Mock Supplier B', amount: 25000, invoiceStatus: 'invoiced', sourceUpdatedAt: new Date().toISOString() },
    { orderNo: 'MOCK-PO-003', supplierName: 'Mock Supplier A', amount: 5500, invoiceStatus: null, sourceUpdatedAt: new Date().toISOString() },
  ];
}

export function getMockPaymentRequests() {
  return [
    { requestNo: 'MOCK-PR-001', supplierName: 'Mock Supplier A', amount: 8000, status: 'approved', sourceUpdatedAt: new Date().toISOString() },
    { requestNo: 'MOCK-PR-002', supplierName: 'Mock Supplier C', amount: 12000, status: 'pending', sourceUpdatedAt: new Date().toISOString() },
  ];
}

export function getMockDeliveryOrders() {
  return [
    { shipmentId: 'MOCK-DO-001', shipmentName: 'Mock Shipment 1', status: 'shipped', sourceUpdatedAt: new Date().toISOString() },
    { shipmentId: 'MOCK-DO-002', shipmentName: 'Mock Shipment 2', status: 'receiving', sourceUpdatedAt: new Date().toISOString() },
  ];
}

export function getMockInvoices() {
  return [
    { invoiceNo: 'MOCK-INV-001', supplierName: 'Mock Supplier A', amount: 10000, invoiceType: 'VAT', invoiceDate: '2025-01-15', matchStatus: null },
    { invoiceNo: 'MOCK-INV-002', supplierName: 'Mock Supplier B', amount: 25000, invoiceType: 'VAT', invoiceDate: '2025-02-01', matchStatus: 'matched' },
  ];
}

export function getMockExchangeRates() {
  return [
    { currency: 'USD', rateOrg: 7.25, myRate: 7.20, date: new Date().toISOString().split('T')[0] },
    { currency: 'EUR', rateOrg: 7.85, myRate: 7.80, date: new Date().toISOString().split('T')[0] },
    { currency: 'GBP', rateOrg: 9.15, myRate: 9.10, date: new Date().toISOString().split('T')[0] },
  ];
}

export function getMockSuppliers() {
  return [
    { supplierId: 1001, supplierName: 'Mock Supplier A', contactName: 'Alice', phone: '13800000001' },
    { supplierId: 1002, supplierName: 'Mock Supplier B', contactName: 'Bob', phone: '13800000002' },
    { supplierId: 1003, supplierName: 'Mock Supplier C', contactName: 'Charlie', phone: '13800000003' },
  ];
}
