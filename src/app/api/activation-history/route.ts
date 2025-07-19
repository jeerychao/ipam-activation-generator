import { NextRequest, NextResponse } from 'next/server';
import { ActivationHistoryService } from '@/lib/database';

// GET - 获取激活历史记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    let result;
    if (search) {
      result = await ActivationHistoryService.searchActivationHistory(search, page, pageSize);
    } else {
      result = await ActivationHistoryService.getActivationHistoryPaginated(page, pageSize);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取激活历史记录失败:', error);
    return NextResponse.json(
      { error: '获取激活历史记录失败' },
      { status: 500 }
    );
  }
}

// POST - 保存激活历史记录
export async function POST(request: NextRequest) {
  try {
    const {
      serial,
      validity,
      activationCode,
      organization,
      contactPerson,
      contactPhone,
      contactEmail,
      address,
      remarks
    } = await request.json();

    if (!serial || !validity || !activationCode) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = await ActivationHistoryService.saveActivationHistory({
      serial,
      validity,
      activationCode,
      organization,
      contactPerson,
      contactPhone,
      contactEmail,
      address,
      remarks
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('保存激活历史记录失败:', error);
    return NextResponse.json(
      { error: '保存激活历史记录失败' },
      { status: 500 }
    );
  }
}

// DELETE - 清空所有激活历史记录
export async function DELETE() {
  try {
    await ActivationHistoryService.clearAllActivationHistory();
    return NextResponse.json({ message: '激活历史记录已清空' });
  } catch (error) {
    console.error('清空激活历史记录失败:', error);
    return NextResponse.json(
      { error: '清空激活历史记录失败' },
      { status: 500 }
    );
  }
} 