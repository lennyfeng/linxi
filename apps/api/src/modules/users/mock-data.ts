export const mockUsers = [
  {
    id: 1,
    name: '系统管理员',
    username: 'admin',
    sourceType: 'local',
    departmentName: '系统管理部',
    status: 'active',
  },
  {
    id: 2,
    name: '财务测试用户',
    username: 'finance.demo',
    sourceType: 'feishu',
    departmentName: '财务部',
    status: 'active',
  },
];

export const mockDepartments = [
  { id: 1, name: '系统管理部', parentId: null, status: 'active' },
  { id: 2, name: '财务部', parentId: null, status: 'active' },
  { id: 3, name: '产品部', parentId: null, status: 'active' },
];

export const mockRoles = [
  { id: 1, roleKey: 'super-admin', roleName: '超级管理员', status: 'active' },
  { id: 2, roleKey: 'system-admin', roleName: '系统管理员', status: 'active' },
  { id: 3, roleKey: 'finance', roleName: '财务', status: 'active' },
  { id: 4, roleKey: 'finance-manager', roleName: '财务主管', status: 'active' },
  { id: 5, roleKey: 'employee', roleName: '普通员工', status: 'active' },
];

export const mockPermissions = [
  { id: 1, permissionKey: 'user.view', permissionName: '查看用户', permissionType: 'action', moduleKey: 'users' },
  { id: 2, permissionKey: 'role.view', permissionName: '查看角色', permissionType: 'action', moduleKey: 'users' },
  { id: 3, permissionKey: 'ledger.view', permissionName: '查看记账', permissionType: 'menu', moduleKey: 'ledger' },
  { id: 4, permissionKey: 'reconciliation.view', permissionName: '查看勾稽', permissionType: 'menu', moduleKey: 'reconciliation' },
];
