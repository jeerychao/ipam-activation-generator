# ipam-activation-generator 部署指南

## 一、Docker Compose 一键部署（推荐）

### 1. 启动服务

```bash
# 在项目根目录下执行
docker-compose up -d
```

- Web 服务默认监听 3000 端口。
- PostgreSQL 数据库监听 5433（宿主机）端口，数据库名/用户/密码均为 postgres。
- 数据库数据持久化在本地 volume `pgdata`。

### 2. 访问服务

浏览器访问：http://localhost:3000

---

## 二、单独 Docker 部署

### 1. 构建镜像

```bash
# 构建镜像（可自定义镜像名）
docker build -t ipam-activation-generator:latest .
```

### 2. 运行 PostgreSQL

```bash
docker run -d --name ipam-activation-generator-db -e POSTGRES_DB=ipam_activation_generator -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 -v pgdata:/var/lib/postgresql/data postgres:15-alpine
```

### 3. 运行 Web 服务

```bash
docker run -d --name ipam-activation-generator-app --link ipam-activation-generator-db:db -e DATABASE_URL=postgresql://postgres:postgres@db:5432/ipam_activation_generator -p 3000:3000 ipam-activation-generator:latest
```

---

## 三、Linux 物理/虚拟机独立部署

### 1. 安装依赖

- Node.js 18+ 或 20+
- npm 9+（或使用 yarn/pnpm）
- PostgreSQL 15+

```bash
# 以 Ubuntu/Debian 为例
sudo apt update
sudo apt install -y nodejs npm postgresql
```

### 2. 配置数据库

```bash
sudo -u postgres psql
CREATE DATABASE ipam_activation_generator;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE ipam_activation_generator TO postgres;
```

### 3. 安装依赖包

```bash
cd /path/to/ipam-activation-generator
npm install
```

### 4. 配置环境变量

在 `.env` 或环境变量中设置：
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ipam_activation_generator
```

### 5. 构建生产包

```bash
npm run build
```

### 6. 启动服务

```bash
npm start
```

### 7. 访问服务

浏览器访问：http://<服务器IP>:3000

---

## 四、常见问题

- 如需修改端口，可在 `package.json` 的 `start` 脚本或 `next.config.ts` 中配置。
- 如需挂载 Nginx/Apache 反向代理，建议将 3000 端口代理为 80/443。
- 如遇权限或依赖问题，建议升级 Node.js/PostgreSQL 版本或检查防火墙设置。

---

如有其他部署需求，请联系开发者。 