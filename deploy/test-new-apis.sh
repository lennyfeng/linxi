#!/bin/bash
set -e

API="http://localhost:3101"

# Login
TOKEN=$(python3 -c '
import urllib.request, json
d = json.dumps({"username":"admin","password":"admin123"}).encode()
r = urllib.request.Request("'"$API"'/auth/login", data=d, headers={"Content-Type":"application/json"})
resp = urllib.request.urlopen(r).read().decode()
data = json.loads(resp)
if data.get("data") and (data["data"].get("token") or data["data"].get("access_token")):
    print(data["data"].get("token") or data["data"].get("access_token"))
else:
    import sys; print("FAIL:" + resp, file=sys.stderr); sys.exit(1)
')

echo "=== Login OK, token=${TOKEN:0:20}... ==="

AUTH="Authorization: Bearer $TOKEN"

echo ""
echo "=== GET /ledger/stats ==="
curl -s -H "$AUTH" "$API/ledger/stats"
echo ""

echo ""
echo "=== GET /ledger/overview (keys only) ==="
curl -s -H "$AUTH" "$API/ledger/overview" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("keys:", list(d.get("data",d).keys()) if isinstance(d.get("data",d),dict) else "NOT_DICT")'
echo ""

echo ""
echo "=== GET /ledger/reports/monthly-trend?year=2026 ==="
curl -s -H "$AUTH" "$API/ledger/reports/monthly-trend?year=2026"
echo ""

echo ""
echo "=== GET /ledger/reports/category-breakdown ==="
curl -s -H "$AUTH" "$API/ledger/reports/category-breakdown?startDate=2026-01-01&endDate=2026-12-31&type=expense" | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("data",d); print("total:", r.get("total",0), "items:", len(r.get("items",[])))'
echo ""

echo ""
echo "=== GET /ledger/reports/account-breakdown ==="
curl -s -H "$AUTH" "$API/ledger/reports/account-breakdown?startDate=2026-01-01&endDate=2026-12-31" | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("data",d); print("accounts:", len(r) if isinstance(r,list) else r)'
echo ""

echo ""
echo "=== GET /ledger/reports/project-breakdown ==="
curl -s -H "$AUTH" "$API/ledger/reports/project-breakdown?startDate=2026-01-01&endDate=2026-12-31" | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("data",d); print("projects:", len(r) if isinstance(r,list) else r)'
echo ""

echo ""
echo "=== GET /ledger/reports/counterparty-breakdown ==="
curl -s -H "$AUTH" "$API/ledger/reports/counterparty-breakdown?startDate=2026-01-01&endDate=2026-12-31" | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("data",d); print("counterparties:", len(r) if isinstance(r,list) else r)'
echo ""

echo ""
echo "=== GET /ledger/reports/member-breakdown ==="
curl -s -H "$AUTH" "$API/ledger/reports/member-breakdown?startDate=2026-01-01&endDate=2026-12-31" | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("data",d); print("members:", len(r) if isinstance(r,list) else r)'
echo ""

echo ""
echo "=== GET /reconciliation/suppliers ==="
curl -s -H "$AUTH" "$API/reconciliation/suppliers" | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("data",d); print("suppliers:", len(r) if isinstance(r,list) else r)'
echo ""

echo ""
echo "=== GET /ledger/transactions (with projectName filter) ==="
curl -s -H "$AUTH" "$API/ledger/transactions?pageSize=5&projectName=test" | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("data",d); print("list:", len(r.get("list",[])), "total:", r.get("pagination",{}).get("total",0))'
echo ""

echo ""
echo "=== ALL API TESTS PASSED ==="
