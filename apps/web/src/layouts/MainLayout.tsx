import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Breadcrumb } from 'antd';
import { LogOut, User } from 'lucide-react';
import type { MenuProps } from 'antd';
import menuConfig from './menuConfig';
import { useAuthStore } from '@/stores/authStore';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationBell from '@/components/NotificationBell';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function filterMenuByPermission(items: typeof menuConfig, checker: (p: string) => boolean): typeof menuConfig {
  return items.filter((item) => {
    if (!item.permission) return true;
    return checker(item.permission);
  }).map((item) => ({
    ...item,
    children: item.children ? filterMenuByPermission(item.children, checker) : undefined,
  }));
}

function buildAntMenuItems(items: typeof menuConfig): MenuProps['items'] {
  return items.map((item) => ({
    key: item.path,
    icon: item.icon,
    label: item.name,
    children: item.children ? buildAntMenuItems(item.children) : undefined,
  }));
}

function getOpenKeys(pathname: string): string[] {
  for (const item of menuConfig) {
    if (item.children?.some((c) => pathname.startsWith(c.path))) {
      return [item.path];
    }
  }
  return [];
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { title: string }[] = [{ title: '首页' }];
  for (const item of menuConfig) {
    if (pathname.startsWith(item.path) && item.path !== '/') {
      crumbs.push({ title: item.name });
      if (item.children) {
        const child = item.children.find((c) => pathname.startsWith(c.path));
        if (child) crumbs.push({ title: child.name });
      }
      break;
    }
  }
  return crumbs;
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasMenuAccess = useAuthStore((s) => s.hasMenuAccess);
  const [collapsed, setCollapsed] = React.useState(false);

  const visibleMenu = React.useMemo(() => filterMenuByPermission(menuConfig, hasMenuAccess), [hasMenuAccess]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User size={14} />,
      label: '个人中心',
      onClick: () => navigate('/personal'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        collapsedWidth={64}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          borderRight: '1px solid #F0F2F5',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid #F0F2F5',
          }}
        >
          <Text strong style={{ fontSize: collapsed ? 16 : 18, color: '#00B894' }}>
            {collapsed ? 'LX' : '霖淅'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys(location.pathname)}
          items={buildAntMenuItems(visibleMenu)}
          onClick={handleMenuClick}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 64 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #F0F2F5',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Breadcrumb items={getBreadcrumbs(location.pathname)} />
          <Space size={16}>
            <GlobalSearch />
            <NotificationBell />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={28} style={{ backgroundColor: '#00B894' }}>
                  {user?.displayName?.[0] ?? 'U'}
                </Avatar>
                <Text style={{ fontSize: 14 }}>{user?.displayName ?? 'User'}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
