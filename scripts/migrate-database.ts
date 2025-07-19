#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 用于更新数据库结构以支持用户单位信息
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

console.log('=== 数据库迁移脚本 ===');

async function runMigration() {
  try {
    console.log('1. 检查 Prisma 配置...');
    
    const schemaPath = resolve(__dirname, '../prisma/schema.prisma');
    if (!existsSync(schemaPath)) {
      throw new Error('Prisma schema 文件不存在');
    }
    
    console.log('2. 生成 Prisma 客户端...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('3. 推送数据库更改...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('4. 验证数据库结构...');
    const prisma = new PrismaClient();
    
    // 检查表结构
    const tableInfo = await prisma.$queryRaw<TableColumn[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'activation_history'
      ORDER BY ordinal_position;
    `;
    
    console.log('数据库表结构:');
    console.table(tableInfo);
    
    // 检查是否有新字段
    const hasNewFields = tableInfo.some((col: TableColumn) => 
      ['organization', 'contact_person', 'contact_phone', 'contact_email', 'address', 'remarks'].includes(col.column_name)
    );
    
    if (hasNewFields) {
      console.log('✅ 数据库迁移成功！新字段已添加。');
    } else {
      console.log('⚠️ 数据库迁移可能未完成，请检查 schema 文件。');
    }
    
    await prisma.$disconnect();
    
    console.log('\n=== 迁移完成 ===');
    console.log('现在可以启动应用并测试新功能了！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', (error as Error).message);
    process.exit(1);
  }
}

// 运行迁移
if (require.main === module) {
  runMigration();
}

export { runMigration }; 