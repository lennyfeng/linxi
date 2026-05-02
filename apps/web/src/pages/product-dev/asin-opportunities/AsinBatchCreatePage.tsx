import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Statistic, Tag, Typography, message, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import asinOpportunityApi from '@/api/asinOpportunities';

function parseAsinInputPreview(input: unknown) {
  const text = String(input || '');
  const parts = text
    .split(/[\s,;，；]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const validAsins: string[] = [];
  const invalidItems: string[] = [];
  let duplicateCount = 0;

  for (const part of parts) {
    const matched = part.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i) || part.match(/\b([A-Z0-9]{10})\b/i);
    if (!matched?.[1]) {
      invalidItems.push(part);
      continue;
    }
    const asin = matched[1].toUpperCase();
    if (validAsins.includes(asin)) {
      duplicateCount += 1;
      continue;
    }
    validAsins.push(asin);
  }

  return { validAsins, invalidItems, duplicateCount, rawCount: parts.length };
}

const PRODUCT_DIRECTIONS = [
  '家居厨房', '户外运动', '宠物用品', '母婴用品', '美妆个护',
  '汽车配件', '电子配件', '办公用品', '服装配饰', '玩具游戏',
];

const TARGET_CATEGORIES = [
  'Kitchen & Dining', 'Home & Kitchen', 'Sports & Outdoors', 'Pet Supplies',
  'Baby Products', 'Beauty & Personal Care', 'Automotive', 'Electronics',
  'Office Products', 'Clothing Shoes & Jewelry', 'Toys & Games',
  'Health & Household', 'Garden & Outdoor', 'Tools & Home Improvement',
];

const QUICK_TEMPLATES = [
  { name: '厨房用品机会扫描', marketplace: 'US', productDirection: '家居厨房', targetCategory: 'Kitchen & Dining' },
  { name: '宠物用品机会扫描', marketplace: 'US', productDirection: '宠物用品', targetCategory: 'Pet Supplies' },
  { name: '户外运动机会扫描', marketplace: 'US', productDirection: '户外运动', targetCategory: 'Sports & Outdoors' },
  { name: '美妆个护机会扫描', marketplace: 'US', productDirection: '美妆个护', targetCategory: 'Beauty & Personal Care' },
];

const AsinBatchCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const asinInput = Form.useWatch('asinInput', form);
  const asinPreview = useMemo(() => parseAsinInputPreview(asinInput), [asinInput]);

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await asinOpportunityApi.createBatch({
        name: values.name,
        marketplace: values.marketplace,
        product_direction: values.productDirection,
        target_category: values.targetCategory,
        asin_input: values.asinInput,
        remark: values.remark,
      });
      message.success('批次创建成功');
      navigate('/product-dev/asin-opportunities');
    } catch {
      // handled by form or request
    }
    setSubmitting(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Card>
        <Typography.Title level={4}>新建 ASIN 批次</Typography.Title>
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">快速模板：</Typography.Text>
          <Space wrap style={{ marginTop: 4 }}>
            {QUICK_TEMPLATES.map((t) => (
              <Button key={t.name} size="small" onClick={() => form.setFieldsValue({ name: t.name, marketplace: t.marketplace, productDirection: t.productDirection, targetCategory: t.targetCategory })}>
                {t.name}
              </Button>
            ))}
          </Space>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="批次名称" rules={[{ required: true, message: '请输入批次名称' }]}>
            <Input placeholder="例如：厨房用品机会扫描" />
          </Form.Item>
          <Form.Item name="marketplace" label="站点" initialValue="US" rules={[{ required: true }]}>
            <Select options={[
              { value: 'US', label: 'US (美国)' },
              { value: 'UK', label: 'UK (英国)' },
              { value: 'DE', label: 'DE (德国)' },
              { value: 'FR', label: 'FR (法国)' },
              { value: 'IT', label: 'IT (意大利)' },
              { value: 'ES', label: 'ES (西班牙)' },
              { value: 'JP', label: 'JP (日本)' },
              { value: 'CA', label: 'CA (加拿大)' },
              { value: 'AU', label: 'AU (澳大利亚)' },
              { value: 'MX', label: 'MX (墨西哥)' },
            ]} />
          </Form.Item>
          <Form.Item name="productDirection" label="产品方向">
            <Select allowClear showSearch placeholder="选择或输入产品方向" options={PRODUCT_DIRECTIONS.map((d) => ({ value: d, label: d }))} />
          </Form.Item>
          <Form.Item name="targetCategory" label="目标类目">
            <Select allowClear showSearch placeholder="选择或输入目标类目" options={TARGET_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="asinInput" label="ASIN 列表" rules={[{ required: true, message: '请输入 ASIN 列表' }]} extra="支持每行一个 ASIN（如 B09XYZ1234）、逗号/分号分隔，或直接粘贴 Amazon 产品链接。系统将自动提取去重。">
            <Input.TextArea rows={10} placeholder="每行一个 ASIN，或粘贴 Amazon 链接&#10;示例：B09XYZ1234&#10;https://www.amazon.com/dp/B09XYZ1234" />
          </Form.Item>
          <Card size="small" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={6}><Statistic title="输入条目" value={asinPreview.rawCount} /></Col>
              <Col span={6}><Statistic title="有效 ASIN" value={asinPreview.validAsins.length} valueStyle={{ color: '#3f8600' }} /></Col>
              <Col span={6}><Statistic title="重复条目" value={asinPreview.duplicateCount} valueStyle={{ color: asinPreview.duplicateCount ? '#fa8c16' : undefined }} /></Col>
              <Col span={6}><Statistic title="无效条目" value={asinPreview.invalidItems.length} valueStyle={{ color: asinPreview.invalidItems.length ? '#cf1322' : undefined }} /></Col>
            </Row>
            {asinPreview.duplicateCount > 0 && (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message={`已自动去重 ${asinPreview.duplicateCount} 条重复 ASIN，最终将提交 ${asinPreview.validAsins.length} 个唯一 ASIN。`}
              />
            )}
            {asinPreview.validAsins.length > 500 && (
              <Alert
                style={{ marginTop: 12 }}
                type="error"
                showIcon
                message={`单批次最多支持 500 个 ASIN，当前 ${asinPreview.validAsins.length} 个，请拆分提交。`}
              />
            )}
            {asinPreview.validAsins.length > 0 && (
              <Space wrap style={{ marginTop: 12 }}>
                {asinPreview.validAsins.slice(0, 20).map((asin) => <Tag key={asin} color="blue">{asin}</Tag>)}
                {asinPreview.validAsins.length > 20 && <Tag>还有 {asinPreview.validAsins.length - 20} 个</Tag>}
              </Space>
            )}
            {asinPreview.invalidItems.length > 0 && (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="存在无法识别的输入"
                description={`以下条目无法解析为有效 ASIN：${asinPreview.invalidItems.slice(0, 10).join('、')}${asinPreview.invalidItems.length > 10 ? '…等' : ''}`}
              />
            )}
          </Card>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
        <Space>
          <Button onClick={() => navigate('/product-dev/asin-opportunities')}>取消</Button>
          <Button type="primary" onClick={submit} loading={submitting} disabled={!asinPreview.validAsins.length || asinPreview.validAsins.length > 500}>提交分析</Button>
        </Space>
      </Card>
    </div>
  );
};

export default AsinBatchCreatePage;
