import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Input, List, Tag, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface SearchResult {
  id: number;
  type: string;
  module: string;
  title: string;
  subtitle: string;
}

const moduleLinks: Record<string, (id: number) => string> = {
  ledger: (id) => `/ledger/transactions?highlight=${id}`,
  'product-dev': (id) => `/product-dev/projects/${id}`,
  reconciliation: () => `/reconciliation`,
};

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    try {
      const res = await apiClient.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(res.data?.data?.results ?? []);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (item: SearchResult) => {
    const linkFn = moduleLinks[item.module];
    if (linkFn) navigate(linkFn(item.id));
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: 280 }}>
      <Input
        placeholder="搜索... (Ctrl+K)"
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        allowClear
        size="small"
      />
      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 36, left: 0, right: 0, zIndex: 1000,
          background: '#FFF', border: '1px solid #D9D9D9', borderRadius: 6,
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)', maxHeight: 360, overflow: 'auto',
        }}>
          {results.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无结果" style={{ padding: 16 }} /> : (
            <List size="small" dataSource={results} renderItem={(item) => (
              <List.Item onClick={() => handleSelect(item)} style={{ cursor: 'pointer', padding: '8px 12px' }}>
                <div>
                  <Tag color="blue" style={{ marginRight: 6 }}>{item.module}</Tag>
                  <strong>{item.title}</strong>
                  {item.subtitle && <span style={{ color: '#8C8C8C', marginLeft: 8 }}>{item.subtitle}</span>}
                </div>
              </List.Item>
            )} />
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
