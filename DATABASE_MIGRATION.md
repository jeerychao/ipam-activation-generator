# 激活码生成器数据库迁移指南

## 概述

本指南将帮助您将激活码生成器从 localStorage 存储迁移到 PostgreSQL 数据库存储，并支持用户单位信息管理。

## 迁移变化

### 迁移前 (localStorage)
- 数据存储在浏览器 localStorage 中
- 数据随浏览器清理而丢失
- 不支持多用户并发访问
- 数据管理功能有限
- 无法记录用户单位信息

### 迁移后 (PostgreSQL)
- 数据存储在 PostgreSQL 数据库中
- 数据持久化，容器重启不丢失
- 支持多用户并发访问
- 完整的数据管理和备份功能
- **新增：用户单位信息管理**
  - 单位名称
  - 联系人
  - 联系电话
  - 联系邮箱
  - 地址
  - 备注

## 新功能特性

### 用户单位信息管理
- **单位名称**: 记录软件授权给哪个单位
- **联系人**: 记录具体联系人姓名
- **联系电话**: 便于后续联系
- **联系邮箱**: 电子联系方式
- **地址**: 单位详细地址
- **备注**: 其他重要信息

### 搜索和筛选功能
- 支持按序列号搜索
- 支持按单位名称搜索
- 支持按联系人搜索
- 支持按联系电话搜索
- 支持按联系邮箱搜索
- 支持按地址搜索
- 支持按备注搜索

### 数据导出功能
- 导出 CSV 包含所有用户单位信息
- 便于数据备份和分析

## 部署步骤

### 1. 环境准备

确保您的系统已安装：
- Docker 和 Docker Compose
- Node.js 18+ (用于本地开发)

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp env.example .env.local
```

编辑 `.env.local` 文件：
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ipam_activation_generator"

# Next.js Configuration
NODE_ENV=development
```

### 3. 安装依赖

```bash
npm install
```

### 4. 生成 Prisma 客户端

```bash
npx prisma generate
```

### 5. 运行数据库迁移

```bash
# 运行用户单位信息迁移
npm run db:migrate-user-info

# 或者手动运行
npx prisma db push
```

### 6. 启动服务

#### 使用 Docker Compose (推荐)

```bash
# 启动数据库和应用
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 本地开发

```bash
# 启动数据库
docker-compose up -d db

# 等待数据库启动后，运行迁移
npx prisma db push

# 启动开发服务器
npm run dev
```

### 7. 验证部署

访问 http://localhost:3000 验证应用是否正常运行。

## 数据库操作

### 查看数据库

```bash
# 使用 Prisma Studio
npx prisma studio

# 或直接连接数据库
docker-compose exec db psql -U postgres -d ipam_activation_generator
```

### 备份数据库

```bash
# 备份数据
docker-compose exec db pg_dump -U postgres ipam_activation_generator > backup.sql

# 恢复数据
docker-compose exec -T db psql -U postgres ipam_activation_generator < backup.sql
```

### 清空数据

```bash
# 通过应用界面清空
# 或直接操作数据库
docker-compose exec db psql -U postgres -d ipam_activation_generator -c "DELETE FROM activation_history;"
```

## 使用说明

### 生成激活码
1. 输入序列号（格式：XXXX-XXXX-XXXX-XXXX）
2. 选择有效期
3. **填写用户单位信息**（可选但推荐）
   - 单位名称：软件授权单位
   - 联系人：具体负责人
   - 联系电话：便于联系
   - 联系邮箱：电子联系方式
   - 地址：单位地址
   - 备注：其他重要信息
4. 点击"生成激活码"

### 查看历史记录
- 显示所有激活码生成记录
- 包含完整的用户单位信息
- 支持搜索和筛选
- 支持分页浏览

### 搜索功能
- 在搜索框中输入关键词
- 支持搜索：序列号、单位名称、联系人、电话、邮箱、地址、备注
- 实时搜索，输入后自动筛选结果

### 数据导出
- 点击"导出 CSV"按钮
- 导出文件包含所有字段信息
- 便于数据备份和分析

## 故障排除

### 数据库连接失败

1. 检查数据库容器是否运行：
   ```bash
   docker-compose ps
   ```

2. 检查数据库日志：
   ```bash
   docker-compose logs db
   ```

3. 重启数据库：
   ```bash
   docker-compose restart db
   ```

### 应用启动失败

1. 检查应用日志：
   ```bash
   docker-compose logs app
   ```

2. 重新构建应用：
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Prisma 错误

1. 重新生成 Prisma 客户端：
   ```bash
   npx prisma generate
   ```

2. 重置数据库：
   ```bash
   npx prisma db push --force-reset
   ```

### 数据库迁移问题

1. 检查数据库表结构：
   ```sql
   \d activation_history
   ```

2. 手动添加缺失字段：
   ```sql
   ALTER TABLE activation_history ADD COLUMN organization VARCHAR(200);
   ALTER TABLE activation_history ADD COLUMN contact_person VARCHAR(100);
   ALTER TABLE activation_history ADD COLUMN contact_phone VARCHAR(50);
   ALTER TABLE activation_history ADD COLUMN contact_email VARCHAR(100);
   ALTER TABLE activation_history ADD COLUMN address VARCHAR(500);
   ALTER TABLE activation_history ADD COLUMN remarks TEXT;
   ```

## 数据迁移

如果您有现有的 localStorage 数据需要迁移到数据库，可以：

1. 导出 localStorage 数据：
   ```javascript
   // 在浏览器控制台执行
   const data = localStorage.getItem('activation_history');
   console.log(JSON.stringify(JSON.parse(data), null, 2));
   ```

2. 将数据导入数据库：
   ```sql
   INSERT INTO activation_history (
     id, serial, validity, "activationCode", 
     organization, "contactPerson", "contactPhone", 
     "contactEmail", address, remarks, 
     "createdAt", "updatedAt"
   )
   VALUES 
   (
     'clx1234567890', 'ABCD-1234-EFGH-5678', '30天', 
     'NWZmNGMxZDA6MTc1NTQ5MDU2MzI0NTpsNHV0OG0xeA==',
     '示例单位', '张三', '13800138000',
     'zhangsan@example.com', '北京市朝阳区xxx街道', '测试备注',
     NOW(), NOW()
   );
   ```

## 性能优化

### 数据库索引

为常用查询添加索引：

```sql
-- 为序列号添加索引
CREATE INDEX idx_activation_history_serial ON activation_history(serial);

-- 为创建时间添加索引
CREATE INDEX idx_activation_history_created_at ON activation_history("createdAt");

-- 为单位名称添加索引
CREATE INDEX idx_activation_history_organization ON activation_history(organization);

-- 为联系人添加索引
CREATE INDEX idx_activation_history_contact_person ON activation_history("contactPerson");

-- 为联系电话添加索引
CREATE INDEX idx_activation_history_contact_phone ON activation_history("contactPhone");
```

### 连接池配置

在 `prisma/schema.prisma` 中添加连接池配置：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

## 监控和维护

### 日志监控

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f db
```

### 数据库维护

```bash
# 分析数据库
docker-compose exec db psql -U postgres -d ipam_activation_generator -c "ANALYZE;"

# 清理日志
docker-compose exec db psql -U postgres -d ipam_activation_generator -c "VACUUM;"
```

## 安全注意事项

1. **数据库密码**：生产环境中使用强密码
2. **网络访问**：限制数据库端口访问
3. **数据备份**：定期备份数据库
4. **日志管理**：避免在日志中记录敏感信息
5. **用户信息保护**：确保用户单位信息的安全性

## 支持

如果遇到问题，请：

1. 检查日志文件
2. 验证环境变量配置
3. 确认数据库连接
4. 查看本文档的故障排除部分

---

**注意**：迁移完成后，原有的 localStorage 数据将不再使用。建议在迁移前备份重要数据。

**新功能**：现在支持完整的用户单位信息管理，便于追踪软件授权情况。 