import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const Page500: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="500"
        title="500"
        subTitle="抱歉，服务器出错了。"
        extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
      />
    </div>
  );
};

export default Page500;
