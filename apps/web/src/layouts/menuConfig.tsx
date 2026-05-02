import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Link,
  Rocket,
  Settings,
} from 'lucide-react';

export interface MenuItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  permission?: string;
  children?: MenuItem[];
}

const menuConfig: MenuItem[] = [
  {
    path: '/',
    name: '工作台',
    icon: <LayoutDashboard size={18} />,
  },
  {
    path: '/users',
    name: '用户与权限',
    icon: <Users size={18} />,
    permission: 'users',
    children: [
      { path: '/users/list', name: '用户管理', icon: <></> },
      { path: '/users/departments', name: '部门管理', icon: <></> },
      { path: '/users/roles', name: '角色管理', icon: <></> },
      { path: '/users/audit-log', name: '审计日志', icon: <></> },
    ],
  },
  {
    path: '/ledger',
    name: '财务记账',
    icon: <Wallet size={18} />,
    permission: 'ledger',
    children: [
      { path: '/ledger/overview', name: '总览', icon: <></> },
      { path: '/ledger/transactions', name: '流水记录', icon: <></> },
      { path: '/ledger/accounts', name: '账户管理', icon: <></> },
      { path: '/ledger/categories', name: '分类管理', icon: <></> },
      { path: '/ledger/import', name: '导入', icon: <></> },
      { path: '/ledger/reports', name: '报表', icon: <></> },
      { path: '/ledger/projects', name: '项目', icon: <></> },
      { path: '/ledger/counterparties', name: '商家', icon: <></> },
    ],
  },
  {
    path: '/reconciliation',
    name: '对账中心',
    icon: <Link size={18} />,
    permission: 'reconciliation',
    children: [
      { path: '/reconciliation/overview', name: '总览', icon: <></> },
      { path: '/reconciliation/purchase-orders', name: '采购单', icon: <></> },
      { path: '/reconciliation/payment-requests', name: '请款单', icon: <></> },
      { path: '/reconciliation/delivery-orders', name: '发货单', icon: <></> },
      { path: '/reconciliation/invoices', name: '发票', icon: <></> },
      { path: '/reconciliation/workspace', name: '匹配工作台', icon: <></> },
      { path: '/reconciliation/sync', name: '同步监控', icon: <></> },
      { path: '/reconciliation/suppliers', name: '供应商', icon: <></> },
    ],
  },
  {
    path: '/product-dev',
    name: '产品开发',
    icon: <Rocket size={18} />,
    permission: 'product-dev',
    children: [
      { path: '/product-dev/overview', name: '总览', icon: <></> },
      { path: '/product-dev/projects', name: '项目管理', icon: <></> },
      { path: '/product-dev/kanban', name: '流程看板', icon: <></> },
      { path: '/product-dev/asin-opportunities', name: 'ASIN机会分析', icon: <></> },
    ],
  },
  {
    path: '/settings',
    name: '系统设置',
    icon: <Settings size={18} />,
    permission: 'settings',
  },
];

export default menuConfig;
