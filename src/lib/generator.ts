// 激活码生成核心逻辑

// 简单 hash 实现（与客户端一致）
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// 生成随机盐值
function randomSalt(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

// 有效期转换
export function getValidUntil(days: number | 'permanent'): number {
  if (days === 'permanent') return 0;
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

// Base64 编码（与验证器保持一致）
function base64Encode(str: string): string {
  // 在浏览器环境中使用 TextEncoder 和 btoa
  if (typeof window !== 'undefined') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  }
  // 在 Node.js 环境中使用 Buffer
  return Buffer.from(str).toString('base64');
}

// 激活码生成主函数
export function generateActivationCode(serial: string, validityDays: number | 'permanent'): string {
  // 校验序列号格式
  if (!serial.match(/^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/)) {
    throw new Error('序列号格式无效');
  }
  const salt = randomSalt();
  let hash = simpleHash(serial + salt);
  hash += simpleHash(hash + serial);
  // 只取前8位
  const serialHash = hash.slice(0, 8);
  const validity = getValidUntil(validityDays).toString();
  const data = `${serialHash}:${validity}:${salt}`;
  return base64Encode(data);
} 