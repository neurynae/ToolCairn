---
name: db-ops
description: Database operations for ToolCairn — Prisma migrations, backups (PostgreSQL/Memgraph/Qdrant), restores, and collection stats
user-invocable: true
allowed-tools: Bash, Read
---

Database operations across all three databases (PostgreSQL, Memgraph, Qdrant) plus Redis.

First, specify what you need:
- **migrate** — run Prisma migrations on staging or production
- **backup** — dump all databases to local files
- **restore** — restore from backup (always do staging first)
- **stats** — show collection/table sizes and health

---

## Run Prisma Migrations

```bash
# Local dev
npx prisma migrate dev

# Staging (via SSH)
ssh deploy@staging.neurynae.com "cd ~/toolcairn && docker compose --env-file .env.staging run --rm api npx prisma migrate deploy"

# Production (via SSH) — CONFIRM with user first
ssh deploy@3.111.95.28 "cd ~/toolcairn && docker compose --env-file .env.prod run --rm api npx prisma migrate deploy"
```

---

## Backup All Databases

```bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL — pg_dump
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec -T postgres pg_dump -U toolcairn toolcairn" > postgres_${BACKUP_DATE}.sql
echo "PostgreSQL backup: postgres_${BACKUP_DATE}.sql ($(wc -c < postgres_${BACKUP_DATE}.sql) bytes)"

# Memgraph — Cypher dump
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec memgraph mgconsole --execute 'DUMP DATABASE;'" > memgraph_${BACKUP_DATE}.cypher
echo "Memgraph backup: memgraph_${BACKUP_DATE}.cypher ($(wc -l < memgraph_${BACKUP_DATE}.cypher) lines)"

# Qdrant — create snapshot
ssh deploy@3.111.95.28 "curl -s -X POST http://localhost:6333/collections/tools/snapshots"
# Then download the snapshot file from the container

# Redis — trigger RDB save
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec redis redis-cli BGSAVE && sleep 2 && docker compose --env-file .env.prod exec redis redis-cli LASTSAVE"
```

---

## Restore from Backup

**Always restore to staging first and verify before touching production.**

```bash
# Restore PostgreSQL
cat postgres_YYYYMMDD.sql | ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec -T postgres psql -U toolcairn toolcairn"

# Restore Memgraph (pipe Cypher)
ssh deploy@3.111.95.28 "cat /tmp/memgraph_YYYYMMDD.cypher | docker compose --env-file .env.prod exec -T memgraph mgconsole"
```

---

## Collection / Table Stats

```bash
# PostgreSQL — table sizes
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec postgres psql -U toolcairn toolcairn -c 'SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;'"

# Memgraph — node/edge counts
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec memgraph mgconsole --execute 'MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC;'"

# Qdrant — collection info
curl -s http://localhost:6333/collections/tools | jq '.result.points_count'

# Redis — memory usage
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec redis redis-cli info memory | grep used_memory_human"
```

---

Report findings in a structured format with row/point counts, backup file sizes, and any warnings.
