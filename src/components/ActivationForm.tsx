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

interface UserInfo {
  organization: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  remarks: string;
}

export default function ActivationForm() {
  const [serial, setSerial] = useState('');
  const [validity, setValidity] = useState<number | 'permanent'>(7);
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // 用户单位信息
  const [userInfo, setUserInfo] = useState<UserInfo>({
    organization: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    remarks: ''
  });

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

  const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActivationCode('');
    setIsSaving(true);

    try {
      const code = generateActivationCode(serial, validity);
      setActivationCode(code);
      
      // 保存到数据库
      const validityText = validity === 'permanent' ? '永久' : `${validity}天`;
      
      const response = await fetch('/api/activation-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serial,
          validity: validityText,
          activationCode: code,
          organization: userInfo.organization || undefined,
          contactPerson: userInfo.contactPerson || undefined,
          contactPhone: userInfo.contactPhone || undefined,
          contactEmail: userInfo.contactEmail || undefined,
          address: userInfo.address || undefined,
          remarks: userInfo.remarks || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('保存激活历史记录失败');
      }

      setHistoryRefresh(v => v + 1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || '生成激活码失败');
      } else {
        setError('生成激活码失败');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (activationCode) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(activationCode).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }).catch(() => {
          fallbackCopy(activationCode);
        });
      } else {
        fallbackCopy(activationCode);
      }
    }
  };

  function fallbackCopy(text: string) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <div className="max-w-2xl w-full mt-12 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center">激活码生成器</h2>
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* 序列号和有效期 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* 用户单位信息 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">用户单位信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium text-sm">单位名称</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请输入单位名称"
                  value={userInfo.organization}
                  onChange={(e) => handleUserInfoChange('organization', e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">联系人</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请输入联系人姓名"
                  value={userInfo.contactPerson}
                  onChange={(e) => handleUserInfoChange('contactPerson', e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">联系电话</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请输入联系电话"
                  value={userInfo.contactPhone}
                  onChange={(e) => handleUserInfoChange('contactPhone', e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">联系邮箱</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请输入联系邮箱"
                  value={userInfo.contactEmail}
                  onChange={(e) => handleUserInfoChange('contactEmail', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-1 font-medium text-sm">地址</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="请输入详细地址"
                value={userInfo.address}
                onChange={(e) => handleUserInfoChange('address', e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label className="block mb-1 font-medium text-sm">备注</label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="请输入备注信息"
                rows={3}
                value={userInfo.remarks}
                onChange={(e) => handleUserInfoChange('remarks', e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '生成中...' : '生成激活码'}
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
      <div className="w-full flex justify-center">
        <div className="max-w-4xl w-full">
          <ActivationHistory key={historyRefresh} />
        </div>
      </div>
    </div>
  );
} 