import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Spin, Drawer, message } from 'antd';
import { SyncOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface SyncJob {
  id: number;
  name: string;
  job_type: string;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  retry_count: number;
  interval_seconds: number | null;
}

interface SyncJobLog {
  id: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  records_processed: number | null;
  error_message: string | null;
}

const statusColor: Record<string, string> = {
  idle: 'default', running: 'processing', failed: 'error', disabled: 'warning', success: 'success',
};

const SyncMonitorPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [logDrawer, setLogDrawer] = useState<{ open: boolean; jobId: number; jobName: string }>({ open: false, jobId: 0, jobName: '' });
  const [logs, setLogs] = useState<SyncJobLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/sync-jobs');
      setJobs(res.data?.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadJobs(); }, []);

  const handleTrigger = async (jobId: number) => {
    try {
      await apiClient.post(`/api/sync-jobs/${jobId}/trigger`);
      message.success('任务已触发');
      setTimeout(loadJobs, 2000);
    } catch { message.error('触发失败'); }
  };

  const handleViewLogs = async (jobId: number, jobName: string) => {
    setLogDrawer({ open: true, jobId, jobName });
    setLogsLoading(true);
    try {
      const res = await apiClient.get(`/api/sync-jobs/${jobId}/logs`);
      setLogs(res.data?.data ?? []);
    } catch { /* ignore */ }
    setLogsLoading(false);
  };

  const jobColumns: ColumnsType<SyncJob> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'job_type', key: 'job_type', width: 200 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v}</Tag> },
    { title: '上次运行', dataIndex: 'last_run_at', key: 'last_run_at', width: 180, render: (v: string) => v || '-' },
    { title: '下次运行', dataIndex: 'next_run_at', key: 'next_run_at', width: 180, render: (v: string) => v || '-' },
    { title: '重试', dataIndex: 'retry_count', key: 'retry_count', width: 80, align: 'center' },
    { title: '操作', key: 'actions', width: 200, render: (_: unknown, record: SyncJob) => (
      <Space>
        <Button size="small" icon={<SyncOutlined />} onClick={() => handleTrigger(record.id)}>触发</Button>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewLogs(record.id, record.name)}>日志</Button>
      </Space>
    ) },
  ];

  const logColumns: ColumnsType<SyncJobLog> = [
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: string) => <Tag color={v === 'success' ? 'green' : 'red'}>{v}</Tag> },
    { title: '开始时间', dataIndex: 'started_at', key: 'started_at', width: 180 },
    { title: '时长', dataIndex: 'duration_ms', key: 'duration_ms', width: 100,
      render: (v: number | null) => v != null ? `${(v / 1000).toFixed(1)}s` : '-' },
    { title: '记录数', dataIndex: 'records_processed', key: 'records_processed', width: 80, align: 'center' },
    { title: '错误', dataIndex: 'error_message', key: 'error_message', ellipsis: true },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>同步任务</Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={loadJobs}>刷新</Button>
      </div>

      {loading ? <Spin /> : (
        <Table dataSource={jobs} columns={jobColumns} rowKey="id" size="small" pagination={false} />
      )}

      <Drawer
        title={`日志: ${logDrawer.jobName}`}
        open={logDrawer.open}
        onClose={() => setLogDrawer({ open: false, jobId: 0, jobName: '' })}
        width={700}
      >
        {logsLoading ? <Spin /> : (
          <Table dataSource={logs} columns={logColumns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
        )}
      </Drawer>
    </div>
  );
};

export default SyncMonitorPage;
