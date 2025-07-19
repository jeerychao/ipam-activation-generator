import React, { useEffect, useState } from 'react';

interface HistoryItem {
  id: string;
  serial: string;
  validity: string;
  activationCode: string;
  organization?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  remarks?: string;
  createdAt: string;
}

interface PaginatedResponse {
  data: HistoryItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}

function exportCSV(history: HistoryItem[]) {
  const header = '序列号,有效期,激活码,单位名称,联系人,联系电话,联系邮箱,地址,备注,生成时间\n';
  const rows = history.map(item =>
    [
      item.serial,
      item.validity,
      item.activationCode,
      item.organization || '',
      item.contactPerson || '',
      item.contactPhone || '',
      item.contactEmail || '',
      item.address || '',
      item.remarks || '',
      item.createdAt
    ].map(v => `"${v}"`).join(',')
  ).join('\n');
  const csv = header + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activation-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 10;

export default function ActivationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchHistory = async (pageNum: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/activation-history?${params}`);
      
      if (!response.ok) {
        throw new Error('获取激活历史记录失败');
      }
      
      const result: PaginatedResponse = await response.json();
      setHistory(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setPage(result.currentPage);
    } catch (err) {
      console.error('获取激活历史记录失败:', err);
      setError(err instanceof Error ? err.message : '获取激活历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 搜索防抖
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      fetchHistory(1, searchTerm);
    }, 500);
    
    setSearchTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm, searchTimeout]);

  const handleCopy = (code: string, idx: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 1500);
      }).catch(() => {
        fallbackCopy(code);
      });
    } else {
      fallbackCopy(code);
    }
  };
  
  function fallbackCopy(text: string) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  const handleClearHistory = async () => {
    if (confirm('确定要清空所有激活历史记录吗？此操作不可恢复。')) {
      try {
        const response = await fetch('/api/activation-history', {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('清空激活历史记录失败');
        }
        
        setHistory([]);
        setTotalPages(0);
        setTotal(0);
        setPage(1);
        setSearchTerm('');
      } catch (err) {
        console.error('清空激活历史记录失败:', err);
        setError(err instanceof Error ? err.message : '清空激活历史记录失败');
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchHistory(newPage, searchTerm);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border border-gray-100">
        <div className="text-center text-gray-500 py-6">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border border-gray-100">
        <div className="text-center text-red-500 py-6">{error}</div>
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">激活码生成历史 ({total} 条记录)</h3>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
            onClick={handleClearHistory}
          >
            清空历史
          </button>
          <button
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            onClick={() => exportCSV(history)}
          >
            导出 CSV
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索序列号、单位名称、联系人、电话、邮箱..."
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-1 border">序列号</th>
              <th className="px-2 py-1 border">有效期</th>
              <th className="px-2 py-1 border">激活码</th>
              <th className="px-2 py-1 border">单位名称</th>
              <th className="px-2 py-1 border">联系人</th>
              <th className="px-2 py-1 border">联系电话</th>
              <th className="px-2 py-1 border">联系邮箱</th>
              <th className="px-2 py-1 border">地址</th>
              <th className="px-2 py-1 border">备注</th>
              <th className="px-2 py-1 border">生成时间</th>
              <th className="px-2 py-1 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => (
              <tr key={item.id} className="even:bg-gray-50">
                <td className="px-2 py-1 border font-mono">{item.serial}</td>
                <td className="px-2 py-1 border">{item.validity}</td>
                <td className="px-2 py-1 border font-mono select-all break-all max-w-xs">{item.activationCode}</td>
                <td className="px-2 py-1 border">{item.organization || '-'}</td>
                <td className="px-2 py-1 border">{item.contactPerson || '-'}</td>
                <td className="px-2 py-1 border">{item.contactPhone || '-'}</td>
                <td className="px-2 py-1 border">{item.contactEmail || '-'}</td>
                <td className="px-2 py-1 border max-w-xs truncate" title={item.address || ''}>
                  {item.address || '-'}
                </td>
                <td className="px-2 py-1 border max-w-xs truncate" title={item.remarks || ''}>
                  {item.remarks || '-'}
                </td>
                <td className="px-2 py-1 border">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-2 py-1 border">
                  <button
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    onClick={() => handleCopy(item.activationCode, idx)}
                  >
                    {copiedIndex === idx ? '已复制' : '复制'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            上一页
          </button>
          <span>第 {page} / {totalPages} 页</span>
          <button
            className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
} 