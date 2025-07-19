import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 在构建时跳过数据库操作
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'not_available',
          reason: 'Building or no database connection'
        },
        { status: 503 }
      );
    }

    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
} 