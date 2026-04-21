import type { ThemeConfig } from 'antd';

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#00B894',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    colorInfo: '#1890FF',
    colorBgLayout: '#F5F7FA',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBorder: '#E8ECF0',
    colorBorderSecondary: '#F0F2F5',
    colorText: '#1A2332',
    colorTextSecondary: '#6B7B8D',
    colorTextTertiary: '#A0AEC0',
    colorTextQuaternary: '#CBD5E0',
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading2: 24,
    fontSizeHeading1: 30,
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 40,
  },
  components: {
    Layout: {
      siderBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      bodyBg: '#F5F7FA',
      headerHeight: 56,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#E8FBF5',
      itemSelectedColor: '#00B894',
      itemHoverBg: '#F5F7FA',
      itemActiveBg: '#E8FBF5',
      iconSize: 18,
      itemHeight: 44,
      itemMarginBlock: 2,
      itemMarginInline: 8,
      itemBorderRadius: 8,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      primaryShadow: 'none',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Table: {
      headerBg: '#FAFBFC',
      headerColor: '#6B7B8D',
      headerSplitColor: 'transparent',
      rowHoverBg: '#F5F7FA',
      borderColor: '#F0F2F5',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      headerBorderRadius: 0,
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    Drawer: {
      borderRadius: 0,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Badge: {
      dotSize: 8,
    },
    Tabs: {
      inkBarColor: '#00B894',
      itemSelectedColor: '#00B894',
      itemHoverColor: '#00D9A5',
    },
  },
};

export default themeConfig;
