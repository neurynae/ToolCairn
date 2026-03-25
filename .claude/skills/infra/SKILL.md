---
name: infra
description: Check health of all infrastructure services
user-invocable: true
allowed-tools: Bash
---

Check all infrastructure services:

1. Docker containers: `docker compose ps`
2. Memgraph: `docker compose exec memgraph mgconsole --execute "RETURN 1;"`
3. Qdrant: `curl -s http://localhost:6333/healthz`
4. PostgreSQL: `docker compose exec postgres pg_isready`
5. Redis: `docker compose exec redis redis-cli ping`

Report status of each service (healthy/unhealthy/not running).
If any service is down, suggest the fix command.
