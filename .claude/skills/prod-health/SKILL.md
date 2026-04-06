---
name: prod-health
description: Check health of all production environments — CF Worker, VPS API, staging, local Docker
user-invocable: true
allowed-tools: Bash
---

Check all environments and report status. Run these checks in sequence:

## 1. Public API (via Cloudflare Worker)
```bash
curl -s -o /dev/null -w "%{http_code}" https://api.neurynae.com/v1/health
```
Expected: 200. If not: CF Worker or VPS may be down.

## 2. VPS API (direct — bypasses CF)
```bash
curl -s -o /dev/null -w "%{http_code}" https://origin.neurynae.com/v1/health
```
Expected: 200. If 200 but step 1 failed: CF Worker issue. If both fail: VPS/API down.

## 3. Staging API
```bash
curl -s -o /dev/null -w "%{http_code}" https://staging.neurynae.com/v1/health
```
Expected: 200. Staging outages don't block production.

## 4. VPS Container Health (SSH)
```bash
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod ps --format 'table {{.Name}}\t{{.Status}}'"
```
All containers should show `Up` and `(healthy)`.

## 5. VPS Resources
```bash
ssh deploy@3.111.95.28 "free -h | grep Mem && df -h / | tail -1 && docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'"
```
Alert if: memory > 80% used, disk > 85% used, any container > 90% CPU.

## 6. Local Docker (dev environment)
```bash
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

## 7. npm Package Status
```bash
npm view @neurynae/toolcairn-mcp version 2>/dev/null || echo "package not found"
```

Report all findings in a structured table. Flag any service that is not healthy with a suggested fix command.
