import { NextResponse } from 'next/server';
import { ActivationHistoryService } from '@/lib/database';

// GET - 获取激活历史统计信息
export async function GET() {
  try {
    // 在构建时跳过数据库操作
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const statistics = await ActivationHistoryService.getStatistics();
    return NextResponse.json(statistics);
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    );
  }
} 