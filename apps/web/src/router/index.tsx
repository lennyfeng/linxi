import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';
import AuthGuard from './AuthGuard';

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
);

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/login/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));

// Users
const UserListPage = lazy(() => import('@/pages/users/UserListPage'));
const DepartmentPage = lazy(() => import('@/pages/users/DepartmentPage'));
const RolePage = lazy(() => import('@/pages/users/RolePage'));
const AuditLogPage = lazy(() => import('@/pages/users/AuditLogPage'));

// Ledger
const TransactionListPage = lazy(() => import('@/pages/ledger/TransactionListPage'));
const BatchEntryPage = lazy(() => import('@/pages/ledger/BatchEntryPage'));
const AccountListPage = lazy(() => import('@/pages/ledger/AccountListPage'));
const CategoryPage = lazy(() => import('@/pages/ledger/CategoryPage'));
const ImportPage = lazy(() => import('@/pages/ledger/ImportPage'));
const ReportsPage = lazy(() => import('@/pages/ledger/ReportsPage'));

// Reconciliation
const ReconOverviewPage = lazy(() => import('@/pages/reconciliation/OverviewPage'));
const PurchaseOrderListPage = lazy(() => import('@/pages/reconciliation/PurchaseOrderListPage'));
const PaymentRequestListPage = lazy(() => import('@/pages/reconciliation/PaymentRequestListPage'));
const DeliveryOrderListPage = lazy(() => import('@/pages/reconciliation/DeliveryOrderListPage'));
const InvoiceListPage = lazy(() => import('@/pages/reconciliation/InvoiceListPage'));
const WorkspacePage = lazy(() => import('@/pages/reconciliation/WorkspacePage'));
const SyncMonitorPage = lazy(() => import('@/pages/reconciliation/SyncMonitorPage'));

// Product Dev
const ProjectListPage = lazy(() => import('@/pages/product-dev/ProjectListPage'));
const KanbanPage = lazy(() => import('@/pages/product-dev/KanbanPage'));
const ProjectDetailPage = lazy(() => import('@/pages/product-dev/ProjectDetailPage'));
const ProjectFormPage = lazy(() => import('@/pages/product-dev/ProjectFormPage'));

// Settings & Others
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const ApprovalCenterPage = lazy(() => import('@/pages/approvals/ApprovalCenterPage'));
const PersonalCenter = lazy(() => import('@/pages/personal/PersonalCenter'));
const NotificationPage = lazy(() => import('@/pages/notifications/NotificationPage'));

// Error pages
const Page403 = lazy(() => import('@/pages/error/Page403'));
const Page404 = lazy(() => import('@/pages/error/Page404'));
const Page500 = lazy(() => import('@/pages/error/Page500'));

const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<Page403 />} />
        <Route path="/500" element={<Page500 />} />

        {/* Authenticated */}
        <Route
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* Users */}
          <Route path="/users" element={<Navigate to="/users/list" replace />} />
          <Route path="/users/list" element={<UserListPage />} />
          <Route path="/users/departments" element={<DepartmentPage />} />
          <Route path="/users/roles" element={<RolePage />} />
          <Route path="/users/audit-log" element={<AuditLogPage />} />

          {/* Ledger */}
          <Route path="/ledger" element={<Navigate to="/ledger/transactions" replace />} />
          <Route path="/ledger/transactions" element={<TransactionListPage />} />
          <Route path="/ledger/transactions/batch" element={<BatchEntryPage />} />
          <Route path="/ledger/accounts" element={<AccountListPage />} />
          <Route path="/ledger/categories" element={<CategoryPage />} />
          <Route path="/ledger/import" element={<ImportPage />} />
          <Route path="/ledger/reports" element={<ReportsPage />} />

          {/* Reconciliation */}
          <Route path="/reconciliation" element={<Navigate to="/reconciliation/overview" replace />} />
          <Route path="/reconciliation/overview" element={<ReconOverviewPage />} />
          <Route path="/reconciliation/purchase-orders" element={<PurchaseOrderListPage />} />
          <Route path="/reconciliation/payment-requests" element={<PaymentRequestListPage />} />
          <Route path="/reconciliation/delivery-orders" element={<DeliveryOrderListPage />} />
          <Route path="/reconciliation/invoices" element={<InvoiceListPage />} />
          <Route path="/reconciliation/workspace" element={<WorkspacePage />} />
          <Route path="/reconciliation/sync" element={<SyncMonitorPage />} />

          {/* Product Dev */}
          <Route path="/product-dev" element={<Navigate to="/product-dev/projects" replace />} />
          <Route path="/product-dev/projects" element={<ProjectListPage />} />
          <Route path="/product-dev/kanban" element={<KanbanPage />} />
          <Route path="/product-dev/projects/new" element={<ProjectFormPage />} />
          <Route path="/product-dev/projects/:id" element={<ProjectDetailPage />} />

          {/* Settings & Others */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/approvals" element={<ApprovalCenterPage />} />
          <Route path="/personal" element={<PersonalCenter />} />
          <Route path="/notifications" element={<NotificationPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Page404 />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
