"use client";
import React, { useState } from 'react';
import { generateActivationCode } from '../lib/generator';
import ActivationHistory from './ActivationHistory';

const validityOptions = [
  { label: '7天（试用）', value: 7 },
  { label: '60天', value: 60 },
  { label: '180天', value: 180 },
  { label: '360天', value: 360 },
  { label: '永久', value: 'permanent' },
];

export default function ActivationForm() {
  const [serial, setSerial] = useState('');
  const [validity, setValidity] = useState<number | 'permanent'>(7);
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSerial(e.target.value.toUpperCase().replace(/[^0-9A-F-]/g, ''));
    setActivationCode('');
    setError('');
  };

  const handleValidityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setValidity(val === 'permanent' ? 'permanent' : parseInt(val, 10));
    setActivationCode('');
    setError('');
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActivationCode('');
    try {
      const code = generateActivationCode(serial, validity);
      setActivationCode(code);
      const item = {
        serial,
        validity: validity === 'permanent' ? '永久' : `${validity}天`,
        activationCode: code,
        time: new Date().toLocaleString(),
      };
      const raw = localStorage.getItem('activation_history');
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(item);
      localStorage.setItem('activation_history', JSON.stringify(arr.slice(0, 100)));
      setHistoryRefresh(v => v + 1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || '生成激活码失败');
      } else {
        setError('生成激活码失败');
      }
    }
  };

  const handleCopy = () => {
    if (activationCode) {
      navigator.clipboard.writeText(activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <>
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center">激活码生成器</h2>
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block mb-1 font-medium">序列号</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-lg tracking-widest uppercase"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={serial}
              onChange={handleSerialChange}
              maxLength={19}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">有效期</label>
            <select
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={validity}
              onChange={handleValidityChange}
            >
              {validityOptions.map(opt => (
                <option key={opt.value.toString()} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-lg transition"
          >
            生成激活码
          </button>
        </form>
        {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
        {activationCode && (
          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="mb-2 font-medium">激活码</div>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 px-2 py-1 font-mono text-base bg-transparent border-none outline-none select-all"
                value={activationCode}
                readOnly
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                type="button"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}
      </div>
      <ActivationHistory key={historyRefresh} />
    </>
  );
} 