---
description: Connect to remote servers via plink and execute commands
---

## Server: 192.168.1.251

- SSH user: `sql`
- SSH password: `Linxi@sql`
- MySQL user: `metabase`
- MySQL password: `Linxi#sql123`
- Tool: `D:\Program Files\PuTTY\plink.exe`

## How to run remote commands

Use plink with `-batch` flag. Wrap the remote command in a single argument:

```powershell
& 'D:\Program Files\PuTTY\plink.exe' -ssh sql@192.168.1.251 -pw 'Linxi@sql' -batch '<REMOTE_COMMAND>'
```

## How to run MySQL commands remotely

// turbo
```powershell
& 'D:\Program Files\PuTTY\plink.exe' -ssh sql@192.168.1.251 -pw 'Linxi@sql' -batch "mysql -u metabase -p'Linxi#sql123' -e '<SQL>'"
```

## How to upload files via pscp

```powershell
& 'D:\Program Files\PuTTY\pscp.exe' -pw 'Linxi@sql' <LOCAL_FILE> sql@192.168.1.251:<REMOTE_PATH>
```
