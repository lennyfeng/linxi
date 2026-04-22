#!/bin/bash
# Debug Lingxing API sign - comprehensive test

APP_ID="ak_lxYsroy8y1VK9"
APP_SECRET="S6VOAQcQ7pWSlLw/fWNB6w=="

# Step 1: Get fresh access token
echo "=== Step 1: Get access token ==="
AUTH_RESP=$(curl -s -X POST https://openapi.lingxing.com/api/auth-server/oauth/access-token \
  -F "appId=$APP_ID" \
  -F "appSecret=$APP_SECRET")
echo "Auth: $AUTH_RESP"

ACCESS_TOKEN=$(echo "$AUTH_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')
REFRESH_TOKEN=$(echo "$AUTH_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("refresh_token",""))')
EXPIRES=$(echo "$AUTH_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("expires_in",""))')
echo "token=[$ACCESS_TOKEN] refresh=[$REFRESH_TOKEN] expires=$EXPIRES"

# Step 2: Try to refresh for a new token
echo ""
echo "=== Step 2: Refresh token ==="
REFRESH_RESP=$(curl -s -X POST https://openapi.lingxing.com/api/auth-server/oauth/refresh \
  -F "appId=$APP_ID" \
  -F "refreshToken=$REFRESH_TOKEN")
echo "Refresh: $REFRESH_RESP"

NEW_TOKEN=$(echo "$REFRESH_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))' 2>/dev/null)
NEW_EXPIRES=$(echo "$REFRESH_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("expires_in",""))' 2>/dev/null)
if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "" ]; then
  ACCESS_TOKEN="$NEW_TOKEN"
  echo "Refreshed! new token=[$ACCESS_TOKEN] expires=$NEW_EXPIRES"
fi

APP_KEY="$APP_ID"

# Step 3: Test with seconds timestamp
TS_SEC=$(date +%s)
SIGN_SEC=$(echo -n "${ACCESS_TOKEN}${APP_KEY}${TS_SEC}" | md5sum | awk '{print $1}')
echo ""
echo "=== Step 3: Test with seconds timestamp: $TS_SEC ==="
RESP=$(curl -s "https://openapi.lingxing.com/erp/sc/data/account/lists?access_token=${ACCESS_TOKEN}&timestamp=${TS_SEC}&sign=${SIGN_SEC}&app_key=${APP_KEY}")
echo "$RESP" | head -c 200
echo ""

# Step 4: Test with milliseconds timestamp
TS_MS=$(date +%s%3N)
SIGN_MS=$(echo -n "${ACCESS_TOKEN}${APP_KEY}${TS_MS}" | md5sum | awk '{print $1}')
echo ""
echo "=== Step 4: Test with milliseconds timestamp: $TS_MS ==="
RESP=$(curl -s "https://openapi.lingxing.com/erp/sc/data/account/lists?access_token=${ACCESS_TOKEN}&timestamp=${TS_MS}&sign=${SIGN_MS}&app_key=${APP_KEY}")
echo "$RESP" | head -c 200
echo ""

# Step 5: Try UPPERCASE md5 sign
SIGN_UP=$(echo -n "${ACCESS_TOKEN}${APP_KEY}${TS_SEC}" | md5sum | awk '{print toupper($1)}')
echo ""
echo "=== Step 5: Test with UPPERCASE sign ==="
RESP=$(curl -s "https://openapi.lingxing.com/erp/sc/data/account/lists?access_token=${ACCESS_TOKEN}&timestamp=${TS_SEC}&sign=${SIGN_UP}&app_key=${APP_KEY}")
echo "$RESP" | head -c 200
echo ""

# Step 6: Direct header approach (as reference code does)
echo ""
echo "=== Step 6: Header approach X-App-Id + X-App-Secret ==="
RESP=$(curl -s "https://openapi.lingxing.com/erp/sc/data/account/lists" \
  -H "Content-Type: application/json" \
  -H "X-App-Id: $APP_ID" \
  -H "X-App-Secret: $APP_SECRET")
echo "$RESP" | head -c 200
echo ""

# Step 7: Header approach with token
echo ""
echo "=== Step 7: Header approach X-App-Id + X-Access-Token ==="
RESP=$(curl -s "https://openapi.lingxing.com/erp/sc/data/account/lists" \
  -H "Content-Type: application/json" \
  -H "X-App-Id: $APP_ID" \
  -H "X-Access-Token: $ACCESS_TOKEN")
echo "$RESP" | head -c 200
echo ""

echo ""
echo "=== Done ==="
