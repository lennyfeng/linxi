import React, { useEffect, useState } from 'react';
import { Steps, Form, Input, InputNumber, Select, Button, Space, Typography, Card, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '@/api/client';

const { Step } = Steps;

const steps = ['基本信息', '调研', '目标', '提交'];

const ProjectFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const next = async () => {
    try { await form.validateFields(); setCurrent(current + 1); } catch { /* validation error */ }
  };

  const prev = () => setCurrent(current - 1);

  useEffect(() => {
    if (isEdit && id) {
      apiClient.get(`/product-dev/projects/${id}`)
        .then((res) => {
          const proj = res.data?.data?.project ?? res.data?.data ?? null;
          if (proj) {
            form.setFieldsValue({
              productName: proj.productName,
              sku: proj.sku,
              developerName: proj.developerName,
              ownerName: proj.ownerName,
              targetPlatform: proj.targetPlatform,
              targetMarket: proj.targetMarket,
              estimatedCost: proj.estimatedCost,
              targetPrice: proj.targetPrice,
              grossMarginTarget: proj.grossMarginTarget,
            });
          }
        })
        .catch(() => message.error('加载项目失败'))
        .finally(() => {});
    }
  }, [id]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (isEdit && id) {
        await apiClient.put(`/product-dev/projects/${id}`, values);
        message.success('项目已更新');
      } else {
        await apiClient.post('/product-dev/projects', values);
        message.success('项目已创建');
      }
      navigate('/product-dev/projects');
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <Typography.Title level={4}>{isEdit ? '编辑项目' : '创建新项目'}</Typography.Title>

      <Steps current={current} style={{ marginBottom: 32 }}>
        {steps.map((s) => <Step key={s} title={s} />)}
      </Steps>

      <Card>
        <Form form={form} layout="vertical">
          {current === 0 && (
            <>
              <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="sku" label="SKU">
                <Input />
              </Form.Item>
              <Form.Item name="developerName" label="开发人">
                <Input />
              </Form.Item>
              <Form.Item name="ownerName" label="负责人">
                <Input />
              </Form.Item>
            </>
          )}
          {current === 1 && (
            <>
              <Form.Item name="targetPlatform" label="目标平台">
                <Select options={[
                  { value: 'Amazon US', label: 'Amazon US' },
                  { value: 'Amazon EU', label: 'Amazon EU' },
                  { value: 'Amazon JP', label: 'Amazon JP' },
                  { value: 'Shopify', label: 'Shopify' },
                ]} allowClear placeholder="选择平台" />
              </Form.Item>
              <Form.Item name="targetMarket" label="目标市场">
                <Input placeholder="如 北美" />
              </Form.Item>
            </>
          )}
          {current === 2 && (
            <>
              <Form.Item name="estimatedCost" label="预估成本 (¥)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="targetPrice" label="目标售价 ($)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="grossMarginTarget" label="目标毛利率 (%)">
                <InputNumber min={0} max={100} precision={1} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {current === 3 && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Typography.Title level={5}>{isEdit ? '确认修改' : '准备提交'}</Typography.Title>
              <Typography.Text type="secondary">请检查信息后点击{isEdit ? '保存修改' : '提交创建项目'}。</Typography.Text>
            </div>
          )}
        </Form>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => navigate('/product-dev/projects')}>取消</Button>
          <Space>
            {current > 0 && <Button onClick={prev}>上一步</Button>}
            {current < steps.length - 1 && <Button type="primary" onClick={next}>下一步</Button>}
            {current === steps.length - 1 && <Button type="primary" onClick={handleSubmit} loading={submitting}>{isEdit ? '保存' : '提交'}</Button>}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProjectFormPage;
