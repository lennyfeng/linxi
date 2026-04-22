#!/bin/bash
# Full functional test - test all data entry pages/APIs

BASE="http://localhost:3101"
CT="Content-Type: application/json"
PASS=0
FAIL=0
WARN=0

# Login
TOKEN=$(curl -s -X POST $BASE/auth/login -H "$CT" \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')
AUTH="Authorization: Bearer $TOKEN"

test_api() {
  local method=$1 url=$2 body=$3 label=$4 expect_code=${5:-0}
  local RESP
  if [ "$method" == "GET" ]; then
    RESP=$(curl -s "$url" -H "$AUTH" 2>&1)
  else
    RESP=$(curl -s -X "$method" "$url" -H "$AUTH" -H "$CT" -d "$body" 2>&1)
  fi
  local CODE=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("code","?"))' 2>/dev/null)
  local MSG=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("message","?"))' 2>/dev/null)
  
  if [ "$CODE" == "$expect_code" ]; then
    echo "  ✓ $label (code=$CODE)"
    PASS=$((PASS+1))
  else
    local DETAIL=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); det=d.get("data",{}).get("details",""); print(str(det)[:200])' 2>/dev/null)
    echo "  ✗ $label (code=$CODE msg=$MSG detail=$DETAIL)"
    FAIL=$((FAIL+1))
  fi
  # Return the response for chaining
  echo "$RESP" > /tmp/_last_resp.json
}

extract_id() {
  python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("id",""))' < /tmp/_last_resp.json 2>/dev/null
}

extract_list_count() {
  python3 -c 'import sys,json; d=json.load(sys.stdin); data=d.get("data",{}); lst=data.get("list",data) if isinstance(data,dict) else data; print(len(lst) if isinstance(lst,list) else "?")' < /tmp/_last_resp.json 2>/dev/null
}

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Full Functional Test - $(date '+%Y-%m-%d %H:%M')        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════
echo "▸ Module 1: Dashboard"
# ═══════════════════════════════════════════
test_api GET "$BASE/dashboard" "" "Dashboard load"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 2: Users / Departments / Roles / Permissions"
# ═══════════════════════════════════════════
test_api GET "$BASE/departments" "" "List departments"
test_api POST "$BASE/departments" '{"name":"Finance Dept"}' "Create department"
DEPT_ID=$(extract_id)
test_api PUT "$BASE/departments/$DEPT_ID" '{"name":"Finance Department"}' "Update department"

test_api GET "$BASE/roles" "" "List roles"
test_api POST "$BASE/roles" '{"roleKey":"finance-mgr","roleName":"Finance Manager"}' "Create role"
ROLE_ID=$(extract_id)
test_api PUT "$BASE/roles/$ROLE_ID" '{"roleName":"Finance Manager Updated"}' "Update role"

test_api GET "$BASE/permissions" "" "List permissions"

test_api GET "$BASE/users?page=1&pageSize=10" "" "List users"
test_api POST "$BASE/users" '{"username":"test_fin","name":"Test Finance User","password":"Test@123"}' "Create user"
USER_ID=$(extract_id)

test_api PUT "$BASE/users/$USER_ID/roles" "{\"roleIds\":[$ROLE_ID]}" "Assign role to user"
test_api POST "$BASE/users/$USER_ID/reset-password" '{}' "Reset user password"
test_api PUT "$BASE/users/$USER_ID/status" '{"enabled":false}' "Disable user"
test_api PUT "$BASE/users/$USER_ID/status" '{"enabled":true}' "Re-enable user"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 3: Ledger - Accounts"
# ═══════════════════════════════════════════
test_api GET "$BASE/ledger/accounts?pageSize=100" "" "List accounts"
test_api POST "$BASE/ledger/accounts" '{"accountName":"Functional Test Bank","accountType":"bank","currency":"CNY","openingBalance":10000,"currentBalance":10000,"status":"active","remark":"test account"}' "Create account"
ACCT_ID=$(extract_id)
test_api GET "$BASE/ledger/accounts/$ACCT_ID" "" "Get account detail"
test_api PUT "$BASE/ledger/accounts/$ACCT_ID" '{"accountName":"Functional Test Bank Updated","remark":"updated"}' "Update account"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 3: Ledger - Categories"
# ═══════════════════════════════════════════
test_api GET "$BASE/ledger/categories?pageSize=100" "" "List categories"
test_api POST "$BASE/ledger/categories" '{"categoryName":"Office Supplies","categoryType":"expense"}' "Create expense category"
CAT_ID=$(extract_id)
test_api POST "$BASE/ledger/categories" '{"categoryName":"Sales Revenue","categoryType":"income"}' "Create income category"
ICAT_ID=$(extract_id)
test_api GET "$BASE/ledger/categories/$CAT_ID" "" "Get category detail"
test_api PUT "$BASE/ledger/categories/$CAT_ID" '{"categoryName":"Office Supplies & Equipment"}' "Update category"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 3: Ledger - Transactions"
# ═══════════════════════════════════════════
test_api POST "$BASE/ledger/transactions" "{\"transactionType\":\"expense\",\"transactionDate\":\"2026-04-22\",\"accountId\":$ACCT_ID,\"amount\":500.50,\"currency\":\"CNY\",\"categoryId\":$CAT_ID,\"counterpartyName\":\"Amazon\",\"summary\":\"Buy office supplies\",\"status\":\"submitted\"}" "Create expense transaction"
TX_ID=$(extract_id)
test_api GET "$BASE/ledger/transactions/$TX_ID" "" "Get transaction detail"
test_api PUT "$BASE/ledger/transactions/$TX_ID" '{"summary":"Buy office supplies - updated","remark":"test update"}' "Update transaction"

test_api POST "$BASE/ledger/transactions" "{\"transactionType\":\"income\",\"transactionDate\":\"2026-04-22\",\"accountId\":$ACCT_ID,\"amount\":2000,\"currency\":\"CNY\",\"categoryId\":$ICAT_ID,\"counterpartyName\":\"Client A\",\"summary\":\"Payment received\"}" "Create income transaction"
TX_ID2=$(extract_id)

test_api GET "$BASE/ledger/transactions?page=1&pageSize=50&startDate=2026-04-01&endDate=2026-04-30" "" "List transactions with date filter"

test_api POST "$BASE/ledger/transactions/batch" "{\"transactions\":[{\"transactionType\":\"expense\",\"transactionDate\":\"2026-04-21\",\"accountId\":$ACCT_ID,\"amount\":100,\"currency\":\"CNY\",\"summary\":\"Batch item 1\"},{\"transactionType\":\"expense\",\"transactionDate\":\"2026-04-21\",\"accountId\":$ACCT_ID,\"amount\":200,\"currency\":\"CNY\",\"summary\":\"Batch item 2\"}]}" "Batch create transactions"

test_api GET "$BASE/ledger/transactions/$TX_ID/attachments" "" "List transaction attachments"

test_api GET "$BASE/ledger/monthly-summary" "" "Monthly summary"
test_api GET "$BASE/ledger/counterparties?keyword=Am&limit=5" "" "Counterparty suggest"
test_api GET "$BASE/ledger/exchange-rate?currency=USD&date=2026-04-22" "" "Exchange rate"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 3: Ledger - Imports"
# ═══════════════════════════════════════════
test_api GET "$BASE/ledger/imports?pageSize=20" "" "List import batches"
test_api GET "$BASE/ledger/external-transactions?pageSize=20" "" "List external transactions"
test_api GET "$BASE/ledger/matches?pageSize=20" "" "List matches"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 4: Reconciliation"
# ═══════════════════════════════════════════
test_api GET "$BASE/reconciliation/purchase-orders" "" "List purchase orders"
test_api GET "$BASE/reconciliation/payment-requests" "" "List payment requests"
test_api GET "$BASE/reconciliation/delivery-orders" "" "List delivery orders"
test_api GET "$BASE/reconciliation/invoices" "" "List invoices"
test_api GET "$BASE/reconciliation/relations" "" "Relations overview"
test_api GET "$BASE/reconciliation/status-snapshots" "" "Status snapshots"
test_api GET "$BASE/reconciliation/alerts" "" "Reconciliation alerts"
test_api GET "$BASE/reconciliation/reports" "" "Reconciliation reports"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 5: Product Development"
# ═══════════════════════════════════════════
test_api POST "$BASE/product-dev/projects" '{"productName":"Smart LED Lamp","sku":"LED-001","developerName":"Zhang San","ownerName":"Li Si","targetPlatform":"Amazon US","targetMarket":"North America","estimatedCost":45.00,"targetPrice":29.99,"grossMarginTarget":35.0}' "Create project"
PROJ_ID=$(extract_id)
test_api GET "$BASE/product-dev/projects" "" "List projects"
test_api GET "$BASE/product-dev/projects/$PROJ_ID" "" "Get project detail"
test_api PUT "$BASE/product-dev/projects/$PROJ_ID" '{"productName":"Smart LED Lamp V2","targetPrice":32.99}' "Update project"

# Quotes
test_api POST "$BASE/product-dev/quotes" "{\"projectId\":$PROJ_ID,\"supplierName\":\"Shenzhen Factory A\",\"supplierErpId\":\"SUP-001\",\"currency\":\"CNY\",\"quotePrice\":35.00,\"moq\":500,\"taxIncluded\":1,\"deliveryDays\":15,\"preferred\":1}" "Create supplier quote"
QUOTE_ID=$(extract_id)
test_api GET "$BASE/product-dev/quotes" "" "List quotes"
test_api PUT "$BASE/product-dev/quotes/$QUOTE_ID" "{\"projectId\":$PROJ_ID,\"supplierName\":\"Shenzhen Factory A\",\"quotePrice\":32.50,\"moq\":300,\"deliveryDays\":12}" "Update quote"

# Profit Calculations
test_api POST "$BASE/product-dev/profit-calculations" "{\"projectId\":$PROJ_ID,\"salesPriceUsd\":29.99,\"exchangeRate\":7.24,\"productCostRmb\":35.00,\"accessoryCostRmb\":5.00,\"shippingExpress\":8.50,\"shippingAir\":6.00,\"shippingSea\":3.50,\"selectedPlan\":\"sea\",\"selectedProfit\":5.20,\"selectedProfitRate\":0.1737,\"calculatedBy\":1}" "Create profit calculation"
PROFIT_ID=$(extract_id)
test_api GET "$BASE/product-dev/profit-calculations" "" "List profit calculations"
test_api PUT "$BASE/product-dev/profit-calculations/$PROFIT_ID" "{\"projectId\":$PROJ_ID,\"salesPriceUsd\":32.99,\"selectedProfit\":7.50,\"selectedProfitRate\":0.2273}" "Update profit calculation"

# Samples
test_api POST "$BASE/product-dev/samples" "{\"projectId\":$PROJ_ID,\"roundNo\":1,\"supplierName\":\"Shenzhen Factory A\",\"sampleFee\":200.00,\"reviewResult\":\"pass\",\"improvementNotes\":\"Good quality, minor color adjustment needed\"}" "Create sample record"
SAMPLE_ID=$(extract_id)
test_api PUT "$BASE/product-dev/samples/$SAMPLE_ID" "{\"projectId\":$PROJ_ID,\"roundNo\":1,\"supplierName\":\"Shenzhen Factory A\",\"sampleFee\":200.00,\"reviewResult\":\"pass\",\"improvementNotes\":\"Approved after color fix\"}" "Update sample record"

# Sync records
test_api POST "$BASE/product-dev/sync-records" "{\"projectId\":$PROJ_ID,\"syncStatus\":\"success\",\"syncedBy\":\"admin\",\"syncTime\":\"2026-04-22T10:00:00Z\",\"resultMessage\":\"Synced to Lingxing successfully\"}" "Create sync record"
SYNC_ID=$(extract_id)
test_api GET "$BASE/product-dev/sync-records" "" "List sync records"

# Project workflow
test_api POST "$BASE/product-dev/projects/$PROJ_ID/transition" '{"targetStatus":"待报价"}' "Transition project status"
# Approve only works in '待立项审批' stage - advance to it first
test_api POST "$BASE/product-dev/projects/$PROJ_ID/transition" '{"targetStatus":"待立项审批"}' "Transition to pending approval"
test_api POST "$BASE/product-dev/projects/$PROJ_ID/approve" '{"comments":"Looks good"}' "Approve project"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 6: Settings"
# ═══════════════════════════════════════════
test_api GET "$BASE/settings" "" "List settings"
test_api PUT "$BASE/settings/company_name" '{"value":"Linxi Trading Co.","description":"Company name"}' "Set company_name"
test_api GET "$BASE/settings/company_name" "" "Get company_name"
test_api PUT "$BASE/settings/default_currency" '{"value":"CNY","description":"Default currency"}' "Set default_currency"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 7: Sync Jobs"
# ═══════════════════════════════════════════
test_api GET "$BASE/sync-jobs" "" "List sync jobs"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 8: Saved Views"
# ═══════════════════════════════════════════
test_api POST "$BASE/saved-views" '{"module_key":"ledger","view_name":"My Monthly View","view_config":{"filters":{"type":"expense"},"sort":"date_desc"},"is_default":false}' "Create saved view"
SV_ID=$(extract_id)
test_api GET "$BASE/saved-views?module_key=ledger" "" "List saved views"
if [ -n "$SV_ID" ] && [ "$SV_ID" != "" ]; then
  test_api PUT "$BASE/saved-views/$SV_ID" '{"view_name":"My Monthly View Updated","view_config":{"filters":{"type":"expense"},"sort":"amount_desc"},"is_default":true}' "Update saved view"
  test_api DELETE "$BASE/saved-views/$SV_ID" "" "Delete saved view"
fi

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 9: Approvals"
# ═══════════════════════════════════════════
test_api GET "$BASE/approvals?page=1&pageSize=20" "" "List approvals"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 10: Notifications"
# ═══════════════════════════════════════════
test_api GET "$BASE/notifications?page=1&pageSize=20" "" "List notifications"

# ═══════════════════════════════════════════
echo ""
echo "▸ Module 11: Audit Logs"
# ═══════════════════════════════════════════
test_api GET "$BASE/audit-logs?page=1&pageSize=20" "" "List audit logs"

# ═══════════════════════════════════════════
echo ""
echo "▸ Cleanup: Delete test data"
# ═══════════════════════════════════════════
if [ -n "$TX_ID" ] && [ "$TX_ID" != "" ]; then
  test_api DELETE "$BASE/ledger/transactions/$TX_ID" "" "Delete test transaction"
fi
if [ -n "$SYNC_ID" ] && [ "$SYNC_ID" != "" ]; then
  test_api DELETE "$BASE/product-dev/sync-records/$SYNC_ID" "" "Delete test sync record"
fi
if [ -n "$SAMPLE_ID" ] && [ "$SAMPLE_ID" != "" ]; then
  test_api DELETE "$BASE/product-dev/samples/$SAMPLE_ID" "" "Delete test sample"
fi
if [ -n "$PROFIT_ID" ] && [ "$PROFIT_ID" != "" ]; then
  test_api DELETE "$BASE/product-dev/profit-calculations/$PROFIT_ID" "" "Delete test profit calc"
fi
if [ -n "$QUOTE_ID" ] && [ "$QUOTE_ID" != "" ]; then
  test_api DELETE "$BASE/product-dev/quotes/$QUOTE_ID" "" "Delete test quote"
fi

# ═══════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════"
echo "  RESULTS: ✓ $PASS passed | ✗ $FAIL failed"
echo "══════════════════════════════════════════"
