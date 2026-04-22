#!/bin/bash
# Comprehensive API audit - test all endpoints
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')
AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

test_api() {
  local method=$1 url=$2 body=$3 label=$4
  echo ""
  echo "=== $label ==="
  if [ "$method" == "GET" ]; then
    RESP=$(curl -s "$url" -H "$AUTH" 2>&1)
  else
    RESP=$(curl -s -X "$method" "$url" -H "$AUTH" -H "$CT" -d "$body" 2>&1)
  fi
  CODE=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("code","?"))' 2>/dev/null)
  MSG=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("message","?"))' 2>/dev/null)
  DATA_TYPE=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); t=type(d.get("data")).__name__; print(f"{t}"); v=d.get("data"); print(f"  len={len(v)}" if isinstance(v,(list,dict)) else f"  val={str(v)[:100]}")' 2>/dev/null)
  echo "  code=$CODE msg=$MSG data=$DATA_TYPE"
  # If error, show first 200 chars
  if [ "$CODE" != "0" ]; then
    echo "  RESP: $(echo "$RESP" | head -c 300)"
  fi
}

BASE="http://localhost:3101"

# Dashboard
test_api GET "$BASE/dashboard" "" "Dashboard"

# Users module
test_api GET "$BASE/users?page=1&pageSize=5" "" "User List"
test_api GET "$BASE/departments" "" "Departments"
test_api GET "$BASE/roles" "" "Roles"
test_api GET "$BASE/permissions" "" "Permissions"
test_api POST "$BASE/departments" '{"name":"Test Dept"}' "Create Department"
test_api POST "$BASE/roles" '{"roleKey":"test-role","roleName":"Test Role"}' "Create Role"
test_api POST "$BASE/users" '{"username":"testuser","name":"Test User","password":"test123"}' "Create User"

# Ledger module
test_api GET "$BASE/ledger/accounts?pageSize=5" "" "Ledger Accounts"
test_api GET "$BASE/ledger/categories?pageSize=5" "" "Ledger Categories"
test_api GET "$BASE/ledger/transactions?page=1&pageSize=5&startDate=2026-01-01&endDate=2026-12-31" "" "Ledger Transactions"
test_api POST "$BASE/ledger/accounts" '{"accountName":"Test Account","accountType":"bank","currency":"CNY","openingBalance":0,"currentBalance":0}' "Create Account"
test_api POST "$BASE/ledger/categories" '{"categoryName":"Test Cat","categoryType":"expense"}' "Create Category"
test_api POST "$BASE/ledger/transactions" '{"transactionType":"expense","transactionDate":"2026-04-22","amount":100,"currency":"CNY","summary":"test"}' "Create Transaction"

# Reconciliation
test_api GET "$BASE/reconciliation/purchase-orders" "" "Purchase Orders List"
test_api GET "$BASE/reconciliation/payment-requests" "" "Payment Requests List"
test_api GET "$BASE/reconciliation/delivery-orders" "" "Delivery Orders List"
test_api GET "$BASE/reconciliation/invoices" "" "Invoices List"
test_api GET "$BASE/reconciliation/relations" "" "Relations Overview"
test_api GET "$BASE/reconciliation/alerts" "" "Recon Alerts"
test_api GET "$BASE/reconciliation/reports" "" "Recon Reports"

# Product Dev
test_api GET "$BASE/product-dev/projects" "" "Product Dev Projects"
test_api POST "$BASE/product-dev/projects" '{"productName":"Test Product","sku":"TEST-001"}' "Create Project"

# Settings
test_api GET "$BASE/settings" "" "Settings List"
test_api GET "$BASE/sync-jobs" "" "Sync Jobs"

# Saved Views
test_api GET "$BASE/saved-views" "" "Saved Views"

# Approvals
test_api GET "$BASE/approvals" "" "Approvals"

# Notifications
test_api GET "$BASE/notifications" "" "Notifications"

echo ""
echo "=== Audit Complete ==="
