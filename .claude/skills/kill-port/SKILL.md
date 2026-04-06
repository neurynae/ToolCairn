# Kill Port Skill

Kill whatever process is holding a port. Works on Windows via PowerShell.

## Usage
/kill-port <port>

## Steps

1. Find the PID holding the port:
```bash
powershell -Command "Get-NetTCPConnection -LocalPort <PORT> -State Listen | Select-Object -ExpandProperty OwningProcess"
```

2. Kill it:
```bash
powershell -Command "Stop-Process -Id <PID> -Force"
```

3. Confirm it's free:
```bash
curl -s --max-time 2 http://localhost:<PORT> 2>&1 || echo "Port <PORT> is now free"
```

Run all three steps automatically without asking. Print the PID that was killed.
