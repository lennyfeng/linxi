import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const Page401: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="warning"
        title="401"
        subTitle="请先登录以访问此页面。"
        extra={<Button type="primary" onClick={() => navigate('/login')}>去登录</Button>}
      />
    </div>
  );
};

export default Page401;
