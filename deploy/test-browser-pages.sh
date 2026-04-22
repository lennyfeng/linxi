#!/bin/bash
echo "=== Test page responses ==="
for path in / /login /product-dev/projects /ledger/transactions /dashboard /users/list /settings; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: text/html" http://localhost:3201$path)
  SIZE=$(curl -s -H "Accept: text/html" http://localhost:3201$path | wc -c)
  echo "  $path => HTTP $STATUS, $SIZE bytes"
done

echo ""
echo "=== Check main JS bundle loads ==="
JS_FILE=$(curl -s -H "Accept: text/html" http://localhost:3201/ | grep -oP 'src="/assets/index-[^"]+\.js"' | head -1 | sed 's/src="//;s/"//')
echo "Main JS: $JS_FILE"
if [ -n "$JS_FILE" ]; then
  JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3201$JS_FILE)
  JS_SIZE=$(curl -s http://localhost:3201$JS_FILE | wc -c)
  echo "  HTTP $JS_STATUS, $JS_SIZE bytes"
fi

echo ""
echo "=== Check CSS bundle loads ==="
CSS_FILE=$(curl -s -H "Accept: text/html" http://localhost:3201/ | grep -oP 'href="/assets/index-[^"]+\.css"' | head -1 | sed 's/href="//;s/"//')
echo "Main CSS: $CSS_FILE"
if [ -n "$CSS_FILE" ]; then
  CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3201$CSS_FILE)
  echo "  HTTP $CSS_STATUS"
fi

echo ""
echo "=== Check lazy-loaded ProductListPage chunk ==="
# Find the chunk name from build output
PROD_CHUNK=$(docker logs internal-platform-web 2>&1 | grep -o 'ProjectListPage-[^ ]*\.js' | head -1)
echo "ProductListPage chunk: $PROD_CHUNK"
if [ -n "$PROD_CHUNK" ]; then
  CHUNK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3201/assets/$PROD_CHUNK)
  echo "  HTTP $CHUNK_STATUS"
fi
