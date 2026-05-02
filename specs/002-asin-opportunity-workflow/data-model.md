# Data Model: ASIN 新品机会分析工作流

## 1. asin_analysis_batches

Represents one ASIN analysis batch submitted by a user.

| Field | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| batch_no | VARCHAR(50) | Unique business number |
| name | VARCHAR(200) | Batch name |
| marketplace | VARCHAR(20) | US/UK/DE/JP etc. |
| product_direction | VARCHAR(200) | Optional product direction |
| target_category | VARCHAR(200) | Optional category |
| status | VARCHAR(50) | draft/submitted/analyzing/completed/partially_failed/failed |
| total_count | INT | Total valid ASIN count |
| analyzed_count | INT | Completed analysis count |
| recommended_count | INT | Recommended count |
| rejected_count | INT | Rejected count |
| created_by | BIGINT | User id |
| remark | TEXT | Optional remark |
| created_at | DATETIME | Created time |
| updated_at | DATETIME | Updated time |

## 2. asin_analysis_items

Represents one ASIN in a batch.

| Field | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| batch_id | BIGINT | FK to batch |
| asin | VARCHAR(20) | ASIN |
| marketplace | VARCHAR(20) | Marketplace |
| product_title | VARCHAR(500) | Product title |
| brand | VARCHAR(200) | Brand |
| image_url | TEXT | Main image |
| product_url | TEXT | Amazon URL |
| category | VARCHAR(300) | Category |
| price | DECIMAL(12,2) | Current price |
| rating | DECIMAL(3,2) | Rating |
| review_count | INT | Reviews |
| monthly_sales | INT | Estimated monthly sales |
| monthly_revenue | DECIMAL(14,2) | Estimated revenue |
| bsr | INT | Best Seller Rank |
| status | VARCHAR(50) | Workflow status |
| analysis_status | VARCHAR(50) | pending/analyzing/completed/failed |
| market_score | DECIMAL(5,2) | 0-100 |
| competition_score | DECIMAL(5,2) | 0-100 |
| design_score | DECIMAL(5,2) | 0-100 |
| risk_score | DECIMAL(5,2) | 0-100 |
| opportunity_score | DECIMAL(5,2) | Final score |
| recommendation | VARCHAR(50) | recommend_next_round/manual_review/reject |
| recommendation_reason | TEXT | System reason |
| last_error | TEXT | Last analysis error |
| analyzed_at | DATETIME | Last analysis time |
| created_at | DATETIME | Created time |
| updated_at | DATETIME | Updated time |

Indexes:

- `(batch_id)`
- `(asin, marketplace)`
- `(status)`
- `(opportunity_score)`

## 3. asin_analysis_snapshots

Stores raw external analysis data.

| Field | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| item_id | BIGINT | FK to item |
| source | VARCHAR(100) | sellersprite.asin_detail etc. |
| payload_json | JSON | Raw payload |
| created_at | DATETIME | Created time |

## 4. asin_analysis_reviews

Stores user decisions and workflow history.

| Field | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| item_id | BIGINT | FK to item |
| reviewer_id | BIGINT | User id |
| round_name | VARCHAR(50) | round_1/design/cost/sample |
| action | VARCHAR(50) | next_round/reject/override/approve/reopen/terminate |
| from_status | VARCHAR(50) | Previous status |
| to_status | VARCHAR(50) | New status |
| reason | VARCHAR(300) | Required for reject/override/terminate |
| comment | TEXT | Optional comment |
| created_at | DATETIME | Created time |

## 5. product_design_evaluations

Stores second-round design evaluation.

| Field | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| item_id | BIGINT | FK to item, unique active evaluation |
| designer_id | BIGINT | User id |
| target_user | VARCHAR(500) | Target customer |
| usage_scenario | TEXT | Use cases |
| pain_points | TEXT | Competitor/user pain points |
| design_direction | TEXT | Differentiation direction |
| material_suggestion | TEXT | Materials |
| structure_suggestion | TEXT | Structure |
| package_suggestion | TEXT | Packaging |
| selling_points | TEXT | Selling points |
| attachments_json | JSON | Attachment metadata |
| status | VARCHAR(50) | draft/submitted/approved/rejected |
| review_comment | TEXT | PM review comment |
| created_at | DATETIME | Created time |
| updated_at | DATETIME | Updated time |

## 6. sample_evaluations

Stores cost and sampling evaluation.

| Field | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| item_id | BIGINT | FK to item |
| evaluator_id | BIGINT | User id |
| target_price | DECIMAL(12,2) | Target selling price |
| estimated_cost | DECIMAL(12,2) | Estimated purchase cost |
| gross_margin | DECIMAL(5,2) | Estimated margin |
| moq | INT | Minimum order quantity |
| supplier | VARCHAR(300) | Supplier |
| sample_cost | DECIMAL(12,2) | Sample fee |
| sample_cycle_days | INT | Sample lead time |
| decision | VARCHAR(50) | approve_sampling/reject/hold |
| comment | TEXT | Notes |
| created_at | DATETIME | Created time |
| updated_at | DATETIME | Updated time |
