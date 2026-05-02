# API Contract: ASIN 新品机会分析工作流

Base path: `/asin-opportunities`

All endpoints require authentication unless explicitly listed otherwise.

Write endpoints additionally enforce operation permissions:

- Analysis retry: `asin-opportunities.analysis.retry`
- Product decisions: `asin-opportunities.decision.write`
- Design submission: `asin-opportunities.design.submit`
- Design review: `asin-opportunities.design.review`
- Cost/sample submission: `asin-opportunities.sample.submit`

---

## 1. Create Batch

`POST /asin-opportunities/batches`

Request:

```json
{
  "name": "Garden tools opportunity scan",
  "marketplace": "US",
  "product_direction": "garden tools",
  "target_category": "Patio, Lawn & Garden",
  "asin_input": "B0XXXXXX1\nB0XXXXXX2\nhttps://www.amazon.com/dp/B0XXXXXX3",
  "remark": "April scan"
}
```

Response:

```json
{
  "id": 1,
  "batch_no": "ASIN202604290001",
  "total_count": 3,
  "invalid_items": [],
  "duplicate_count": 0
}
```

---

## 2. List Batches

`GET /asin-opportunities/batches?page=1&page_size=20&status=completed&keyword=garden`

Response:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

---

## 3. Get Batch Detail

`GET /asin-opportunities/batches/:id`

Response includes batch and summary counts.

---

## 4. List Batch Items

`GET /asin-opportunities/batches/:id/items?page=1&page_size=20&status=recommended&keyword=B0`

Response includes ASIN analysis items.

---

## 5. Get Batch Metrics

`GET /asin-opportunities/batches/:id/metrics`

Response:

```json
{
  "rejectionReasonDistribution": [
    {
      "reason": "competition_too_high",
      "count": 3
    }
  ]
}
```

Used by the batch detail page to show why opportunities are rejected or terminated most often.

---

## 6. Get Item Report

`GET /asin-opportunities/items/:id/report`

Response:

```json
{
  "item": {},
  "snapshots": [],
  "reviews": [],
  "design_evaluation": null,
  "sample_evaluation": null
}
```

---

## 7. Retry Analysis

`POST /asin-opportunities/items/:id/retry-analysis`

Retries one failed item.

---

## 8. Batch Retry Failed Items

`POST /asin-opportunities/batches/:id/retry-failed`

Retries all failed items in one batch.

---

## 9. Make Decision

`POST /asin-opportunities/items/:id/decision`

Request:

```json
{
  "action": "next_round",
  "reason": "Market demand and design improvement opportunity are clear",
  "comment": "Proceed to design evaluation"
}
```

Allowed actions:

- `next_round`
- `reject`
- `override_next_round`
- `terminate`
- `hold`

---

## 10. Submit Design Evaluation

`POST /asin-opportunities/items/:id/design-evaluation`

Request:

```json
{
  "target_user": "Home gardeners",
  "usage_scenario": "Outdoor garden maintenance",
  "pain_points": "Current products are hard to store and rust easily",
  "design_direction": "Foldable rust-resistant kit",
  "material_suggestion": "Aluminum alloy + stainless steel",
  "structure_suggestion": "Foldable handles and modular pouch",
  "package_suggestion": "Compact carrying bag",
  "selling_points": "Portable, rust-resistant, organized storage",
  "attachments": []
}
```

---

## 11. Review Design Evaluation

`POST /asin-opportunities/items/:id/design-review`

Request:

```json
{
  "decision": "approve",
  "comment": "Design opportunity is clear"
}
```

Allowed decisions:

- `approve`
- `reject`
- `request_changes`

---

## 12. Submit Sample Evaluation

`POST /asin-opportunities/items/:id/sample-evaluation`

Request:

```json
{
  "target_price": 29.99,
  "estimated_cost": 8.5,
  "gross_margin": 45,
  "moq": 500,
  "supplier": "Supplier A",
  "sample_cost": 120,
  "sample_cycle_days": 15,
  "decision": "approve_sampling",
  "comment": "Cost structure is acceptable"
}
```
