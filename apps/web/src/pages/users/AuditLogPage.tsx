import React, { useCallback, useEffect, useState } from 'react';
import { Card, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface AuditRow {
  id: number;
  logType: string;
  moduleKey: string;
  objectType: string | null;
  objectId: number | null;
  action: string;
  operatorId: number | null;
  operatorName: string | null;
  resultStatus: string;
  errorMessage: string | null;
  requestId: string;
  createdAt: string;
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (moduleFilter) params.set('module', moduleFilter);
      const res = await apiClient.get(`/audit-logs?${params.toString()}`);
      const data = res.data?.data;
      if (Array.isArray(data)) {
        setLogs(data);
        setTotal(data.length);
      } else {
        setLogs(data?.list ?? []);
        setTotal(data?.pagination?.total ?? 0);
      }
    } catch {
      // audit-logs endpoint may not exist yet, show empty
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, moduleFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns: ColumnsType<AuditRow> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '时间', dataIndex: 'createdAt', width: 170, render: (v) => v ? new Date(v).toLocaleString() : '-' },
    { title: '模块', dataIndex: 'moduleKey', width: 100, render: (v) => <Tag>{v}</Tag> },
    { title: '操作', dataIndex: 'action', width: 140 },
    { title: '对象', width: 130, render: (_, r) => r.objectType ? `${r.objectType} #${r.objectId}` : '-' },
    { title: '操作人', dataIndex: 'operatorName', width: 100, render: (v) => v || '-' },
    {
      title: '结果', dataIndex: 'resultStatus', width: 80,
      render: (v) => <Tag color={v === 'success' ? 'green' : 'red'}>{v}</Tag>,
    },
    { title: '请求ID', dataIndex: 'requestId', width: 280, ellipsis: true },
  ];

  return (
    <Card title={<Typography.Title level={4} style={{ margin: 0 }}>审计日志</Typography.Title>}>
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={moduleFilter}
          onChange={setModuleFilter}
          style={{ width: 150 }}
          options={[
            { label: '全部模块', value: '' },
            { label: '认证', value: 'auth' },
            { label: '用户', value: 'users' },
            { label: '财务', value: 'ledger' },
            { label: '对账', value: 'reconciliation' },
          ]}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </Card>
  );
};

export default AuditLogPage;
