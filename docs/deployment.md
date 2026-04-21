# Production Deployment Guide

Target server: **47.111.184.254** (Aliyun)

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local builds)
- MySQL 8.0+ accessible (192.168.1.251 or cloud instance)
- SSH access: `root@47.111.184.254` with key `~/.ssh/id_ed25519.ppk`

## 1. Clone & Configure

```bash
ssh root@47.111.184.254
cd /opt
git clone <repo-url> internal-platform
cd internal-platform
```

### API Environment

```bash
cp apps/api/.env.example apps/api/.env
# Edit with production values:
# - NODE_ENV=production
# - DB_HOST=192.168.1.251 (or cloud DB)
# - DB_USER=metabase
# - DB_PASSWORD=Linxi#sql123
# - JWT_SECRET=<generate-random-64-char-string>
# - LINGXING_APP_ID / APP_SECRET (from Lingxing dashboard)
# - LEMONCLOUD keys
vi apps/api/.env
```

### Web Environment

```bash
cp apps/web/.env.example apps/web/.env
# For production behind Nginx, leave VITE_API_BASE_URL empty
vi apps/web/.env
```

## 2. Database Setup

Run migrations on the target MySQL:

```bash
mysql -h 192.168.1.251 -u metabase -p internal_platform < apps/api/src/database/migrations/001_users.sql
mysql -h 192.168.1.251 -u metabase -p internal_platform < apps/api/src/database/migrations/002_ledger.sql
mysql -h 192.168.1.251 -u metabase -p internal_platform < apps/api/src/database/migrations/003_reconciliation.sql
mysql -h 192.168.1.251 -u metabase -p internal_platform < apps/api/src/database/migrations/004_product_dev.sql
mysql -h 192.168.1.251 -u metabase -p internal_platform < apps/api/src/database/migrations/005_system.sql
```

## 3. Build & Deploy with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# Verify
docker compose ps
docker compose logs -f api
```

Services:
- **api** — port 3101 (host network mode)
- **web** — port 3201 → 3200
- **minio** — port 9000 (API) / 9001 (console)

## 4. Nginx Reverse Proxy

Install Nginx on the host if not using the Docker web container:

```bash
apt install nginx -y
cp deploy/nginx.conf /etc/nginx/sites-available/internal-platform
ln -sf /etc/nginx/sites-available/internal-platform /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

For production with the Docker web container, adjust the Nginx config to proxy port 80 → 3201.

## 5. SSL (Optional)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

## 6. Verify Deployment

```bash
# Health check
curl http://localhost:3101/health

# Web
curl -I http://localhost:3201
```

## 7. Maintenance

### Logs

```bash
docker compose logs -f api --tail=100
docker compose logs -f web --tail=100
```

### Update

```bash
cd /opt/internal-platform
git pull
docker compose up -d --build
```

### Backup Database

```bash
mysqldump -h 192.168.1.251 -u metabase -p internal_platform > backup_$(date +%Y%m%d).sql
```

### Restart Services

```bash
docker compose restart api
docker compose restart web
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API can't connect to DB | Check `DB_HOST`, firewall rules, MySQL user grants |
| Web shows blank page | Check `VITE_API_BASE_URL`, Nginx config, `try_files` |
| Sync jobs not running | Check `sync_jobs` table status, API logs |
| MinIO not accessible | Check port 9000/9001, `MINIO_ROOT_USER/PASSWORD` |
