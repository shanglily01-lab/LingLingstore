# 云服务器依赖安装指引

> 适用于 Ubuntu 22.04 LTS / Debian 12. 其他发行版自行调整包名.
> 假设你的云服务器有 sudo 权限, 公网可访问.

本文档帮你在云服务器上准备好 **PostgreSQL 16** 与 **Redis 7**, 让本地开发的 NestJS 后端可以远程连接.

---

## 1. 系统基础

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim build-essential ca-certificates gnupg lsb-release
```

---

## 2. 安装 Node.js 20 (LTS)

应用代码若要在服务器上跑(部署), 也需要 Node. 仅本地开发时可跳过这一步.

```bash
# 用 NodeSource 官方源
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 启用 corepack 用以管理 pnpm
sudo corepack enable
corepack prepare pnpm@9.15.0 --activate

# 验证
node -v   # v20.x
pnpm -v   # 9.15.0
```

---

## 3. 安装 PostgreSQL 16

```bash
# 添加官方 PostgreSQL apt 源
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16

# 启动并设置开机自启
sudo systemctl enable --now postgresql

# 验证
sudo -u postgres psql -c "SELECT version();"
```

### 3.1 创建数据库与专用用户

```bash
sudo -u postgres psql <<'SQL'
CREATE USER web3mall WITH PASSWORD 'CHANGE_ME_TO_STRONG_PASSWORD';
CREATE DATABASE web3_mall OWNER web3mall ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE web3_mall TO web3mall;
SQL
```

> 注意: 把 `CHANGE_ME_TO_STRONG_PASSWORD` 改成强密码(20 字符 +, 含大小写/数字/特殊字符), 然后记下来填到 `.env` 的 `DATABASE_URL`.

### 3.2 开启远程访问

默认 PG 只监听 127.0.0.1, 需要开放远程访问.

```bash
# 监听所有网卡 (生产环境建议改为指定 IP)
PG_CONF="/etc/postgresql/16/main/postgresql.conf"
sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"

# 允许指定来源 IP 用密码连接
# !! 必须填你的开发机出口 IP, 不要用 0.0.0.0/0 (任何人可来)
PG_HBA="/etc/postgresql/16/main/pg_hba.conf"
echo "host    web3_mall    web3mall    YOUR_DEV_IP/32    scram-sha-256" | sudo tee -a "$PG_HBA"

# 重启生效
sudo systemctl restart postgresql
```

### 3.3 防火墙开放 5432

```bash
# 仅允许你的开发机 IP 访问 PG 端口
sudo ufw allow from YOUR_DEV_IP to any port 5432 proto tcp comment 'Postgres from dev'
sudo ufw reload
```

### 3.4 测试连接 (从本地开发机)

```bash
# 在本地装个 psql 客户端
psql "postgresql://web3mall:你的密码@云服务器IP:5432/web3_mall"
# 进入交互后输入 \conninfo 确认连接信息, \q 退出
```

---

## 4. 安装 Redis 7

```bash
# 添加官方 Redis 源
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

sudo apt update
sudo apt install -y redis

# 启动
sudo systemctl enable --now redis-server
redis-cli ping   # 应返回 PONG
```

### 4.1 设置密码与远程访问

```bash
# 修改配置: 设置密码 + 监听公网
REDIS_CONF="/etc/redis/redis.conf"
sudo sed -i 's/^bind 127.0.0.1 -::1/bind 0.0.0.0/' "$REDIS_CONF"
sudo sed -i 's/^protected-mode yes/protected-mode no/' "$REDIS_CONF"
sudo sed -i 's/^# requirepass foobared/requirepass CHANGE_ME_TO_STRONG_PASSWORD/' "$REDIS_CONF"

sudo systemctl restart redis-server

# 验证密码生效
redis-cli
> AUTH 你的密码
> PING
PONG
```

### 4.2 防火墙开放 6379

```bash
sudo ufw allow from YOUR_DEV_IP to any port 6379 proto tcp comment 'Redis from dev'
sudo ufw reload
```

### 4.3 测试远程连接

```bash
# 本地装 redis-cli (Ubuntu: apt install redis-tools)
redis-cli -h 云服务器IP -p 6379 -a 你的密码 PING
# 返回 PONG 即成功
```

---

## 5. 在本地配置 .env

回到本地项目 `d:/web3-mall/`:

```bash
cp .env.example .env
```

编辑 `.env`, 把 PG 与 Redis 的连接串填进去:

```
DATABASE_URL=postgresql://web3mall:你的PG密码@云服务器IP:5432/web3_mall?schema=public
REDIS_URL=redis://:你的Redis密码@云服务器IP:6379
```

注意 Redis URL 格式: 密码前有冒号, 没有用户名 (`redis://:password@host:port`).

---

## 6. 安全 checklist

部署前务必逐项检查:

- [ ] PG 与 Redis 密码已改成强随机串 (20 字符 +)
- [ ] `.env` 文件已加入 `.gitignore`, 永远不要 commit
- [ ] 防火墙仅开放给你的开发机 IP, 不要 `0.0.0.0/0`
- [ ] PG 用 scram-sha-256 (不要用 md5), Redis 用 `requirepass`
- [ ] 关闭 PG / Redis 不必要的 server 端命令 (Redis 可以 rename-command FLUSHDB / FLUSHALL "")
- [ ] 服务器系统定期 `apt upgrade`
- [ ] 配置自动备份 (PG `pg_dump` 定时任务 / Redis `save` 配置)
- [ ] 监控连接数与磁盘使用 (避免 dev 误操作打爆资源)

---

## 7. 常见问题

### Q: psql 连不上, 提示 "no pg_hba.conf entry"
A: `pg_hba.conf` 没有你的来源 IP 条目. 确认你的公网 IP (访问 https://api.ipify.org 看), 加进去, 重启 PG.

### Q: redis-cli 连接报 "Connection refused"
A: 多半是 `bind 127.0.0.1` 没改. 编辑 `/etc/redis/redis.conf` 后必须 `systemctl restart redis-server`.

### Q: NestJS 启动报 "P1001: Can't reach database"
A: 三步排查:
1. 本地 `psql DATABASE_URL` 能不能连上, 不行说明 PG / 网络问题
2. 能连上但 NestJS 不行, 检查 `.env` 文件的 `DATABASE_URL` 是否有特殊字符未 URL 编码 (例如密码里的 `@` 必须写成 `%40`)
3. 还不行检查 NestJS 启动日志 (`pnpm dev:api` 控制台)

### Q: 我的开发机 IP 经常变 (家用宽带动态 IP), 防火墙怎么配?
A: 三种方案任选一:
- 用 ddns 服务把动态 IP 映射成域名, ufw 规则用 IP 写不了域名, 可以写个脚本定时 resolve 更新规则
- 开放给 IP 段 (例如运营商分配段), 不严但好用
- 用 SSH 隧道转发, 防火墙只开 22, PG/Redis 端口不对公网开: `ssh -L 5432:localhost:5432 user@云服务器`, 然后 .env 用 `localhost:5432`

---

## 8. 参考链接

- [PostgreSQL 官方 apt 安装指引](https://www.postgresql.org/download/linux/ubuntu/)
- [Redis 官方 apt 安装指引](https://redis.io/docs/install/install-redis/install-redis-on-linux/)
- [Prisma 连接字符串文档](https://www.prisma.io/docs/orm/reference/connection-urls)
- [ioredis 连接选项](https://github.com/redis/ioredis#connect-to-redis)
