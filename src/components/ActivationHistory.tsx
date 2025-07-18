import React, { useEffect, useState } from 'react';

interface HistoryItem {
  serial: string;
  validity: string;
  activationCode: string;
  time: string;
}

function exportCSV(history: HistoryItem[]) {
  const header = '序列号,有效期,激活码,生成时间\n';
  const rows = history.map(item =>
    [item.serial, item.validity, item.activationCode, item.time].map(v => `"${v}"`).join(',')
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

  useEffect(() => {
    const raw = localStorage.getItem('activation_history');
    if (raw) {
      setHistory(JSON.parse(raw));
    }
  }, []);

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

  if (history.length === 0) return null;

  // 分页逻辑
  const totalPages = Math.ceil(history.length / PAGE_SIZE);
  const pagedHistory = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">激活码生成历史</h3>
        <button
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          onClick={() => exportCSV(history)}
        >
          导出 CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-1 border">序列号</th>
              <th className="px-2 py-1 border">有效期</th>
              <th className="px-2 py-1 border">激活码</th>
              <th className="px-2 py-1 border">生成时间</th>
              <th className="px-2 py-1 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedHistory.map((item, idx) => (
              <tr key={idx} className="even:bg-gray-50">
                <td className="px-2 py-1 border font-mono">{item.serial}</td>
                <td className="px-2 py-1 border">{item.validity}</td>
                <td className="px-2 py-1 border font-mono select-all break-all max-w-xs">{item.activationCode}</td>
                <td className="px-2 py-1 border">{item.time}</td>
                <td className="px-2 py-1 border">
                  <button
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    onClick={() => handleCopy(item.activationCode, idx + (page - 1) * PAGE_SIZE)}
                  >
                    {copiedIndex === idx + (page - 1) * PAGE_SIZE ? '已复制' : '复制'}
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          <span>第 {page} / {totalPages} 页</span>
          <button
            className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
} 