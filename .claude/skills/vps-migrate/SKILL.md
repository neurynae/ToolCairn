---
name: vps-migrate
description: Step-by-step guide for migrating ToolCairn VPS from AWS to another provider, including Docker volumes, DNS, GitHub Secrets, and CF Worker updates
user-invocable: true
allowed-tools: Bash, Read
---

Complete VPS migration playbook. This covers moving all services from current AWS EC2 (3.111.95.28, Mumbai) to a new provider. Takes ~2-4 hours with ~5 minutes of downtime at DNS cutover.

## Phase 1: Prepare Backups on Current VPS

```bash
# SSH to current VPS
ssh deploy@3.111.95.28

# Backup PostgreSQL
docker compose --env-file .env.prod exec postgres pg_dump -U toolcairn toolcairn > /tmp/postgres_backup_$(date +%Y%m%d).sql

# Backup Memgraph (Cypher dump)
docker compose --env-file .env.prod exec memgraph mgconsole --execute "DUMP DATABASE;" > /tmp/memgraph_backup_$(date +%Y%m%d).cypher

# Backup Qdrant (snapshot)
curl -s -X POST "http://localhost:6333/collections/tools/snapshots"
# Note the snapshot name from response, then copy from container

# Backup Redis (RDB snapshot)
docker compose --env-file .env.prod exec redis redis-cli BGSAVE
docker compose --env-file .env.prod cp redis:/data/dump.rdb /tmp/redis_backup_$(date +%Y%m%d).rdb

# Package all backups
tar -czf ~/toolcairn_backup_$(date +%Y%m%d).tar.gz /tmp/*.sql /tmp/*.cypher /tmp/*.rdb
```

## Phase 2: Provision New VPS

On the new server (as root):
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy || (useradd -m -s /bin/bash deploy && usermod -aG docker deploy)

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Install Caddy
apt-get install -y caddy

# Create deploy user SSH authorized_keys
mkdir -p /home/deploy/.ssh
# Add your SSH public key to /home/deploy/.ssh/authorized_keys
```

## Phase 3: Transfer Files to New VPS

```bash
# From local machine — transfer backup
scp deploy@3.111.95.28:~/toolcairn_backup_*.tar.gz deploy@<NEW_VPS_IP>:~/

# Transfer compose files and env
scp deploy@3.111.95.28:~/toolcairn/docker-compose.prod.yml deploy@<NEW_VPS_IP>:~/toolcairn/
scp deploy@3.111.95.28:~/toolcairn/.env.prod deploy@<NEW_VPS_IP>:~/toolcairn/
scp deploy@3.111.95.28:~/toolcairn/Caddyfile deploy@<NEW_VPS_IP>:~/toolcairn/
```

## Phase 4: Restore on New VPS

```bash
ssh deploy@<NEW_VPS_IP>

# Extract backups
cd ~ && tar -xzf toolcairn_backup_*.tar.gz

# Pull Docker images
cd ~/toolcairn
docker compose --env-file .env.prod pull

# Start infrastructure (NOT the API yet)
docker compose --env-file .env.prod up -d memgraph qdrant postgres redis

# Wait for health checks (~30s)
sleep 30 && docker compose --env-file .env.prod ps

# Restore PostgreSQL
cat /tmp/postgres_backup_*.sql | docker compose --env-file .env.prod exec -T postgres psql -U toolcairn toolcairn

# Restore Memgraph (pipe Cypher dump)
docker compose --env-file .env.prod exec -T memgraph mgconsole < /tmp/memgraph_backup_*.cypher

# Restore Redis
docker compose --env-file .env.prod cp /tmp/redis_backup_*.rdb redis:/data/dump.rdb
docker compose --env-file .env.prod restart redis

# Start API
docker compose --env-file .env.prod up -d api

# Verify health (direct, before DNS change)
curl http://localhost:3001/v1/health
```

## Phase 5: DNS Cutover (5 min downtime window)

In Cloudflare DNS:
1. Change `origin.neurynae.com` A record → `<NEW_VPS_IP>`
2. Keep proxy status: **DNS only** (gray cloud) — required for CF Worker to route correctly
3. TTL: 1 minute (set this BEFORE the cutover for fast propagation)

Update CF Worker secret:
```bash
cd apps/worker
# If IP changed but domain stayed same — no change needed
# If you changed origin domain, update:
npx wrangler secret put API_ORIGIN_URL   # enter: https://origin.neurynae.com
```

## Phase 6: Update GitHub Secrets

In GitHub → NEURYNAE/ToolCairn → Settings → Secrets:
- `VPS_HOST` → `<NEW_VPS_IP>`
- `VPS_SSH_KEY` → private key for `deploy` user on new VPS

## Phase 7: Verify Everything

```bash
# From local machine after DNS propagates
curl -s https://api.neurynae.com/v1/health        # CF Worker → new VPS
curl -s https://origin.neurynae.com/v1/health     # direct to new VPS
curl -s https://staging.neurynae.com/v1/health    # staging (if separate)

# From new VPS
ssh deploy@<NEW_VPS_IP> "docker compose --env-file .env.prod ps"
```

## Phase 8: Decommission Old VPS

Only after 48 hours of stable operation on new VPS:
```bash
# Stop all containers on old VPS
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod down"
# Then terminate the AWS EC2 instance via AWS Console
```

## Cloudflare Account Migration (if also moving CF account)

1. Export Worker source: `cd apps/worker && npx wrangler download`
2. In new CF account: create Worker `toolcairn-api`, deploy source
3. Set secrets: `API_ORIGIN_URL`, `ORIGIN_SECRET`
4. Update DNS zone → transfer domain or update nameservers
5. Re-configure KV namespaces and update `wrangler.toml` binding IDs
6. Update `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in GitHub Secrets
