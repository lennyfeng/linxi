import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { BrowserRouter } from 'react-router-dom';
import themeConfig from '@/theme/themeConfig';
import '@/theme/variables.css';
import AppRouter from '@/router';

dayjs.locale('zh-cn');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={themeConfig} locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
