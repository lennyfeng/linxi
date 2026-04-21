# API Local Development

## 环境变量

复制 `apps/api/.env.example` 为 `apps/api/.env`。

默认本地数据库配置：

- host: `127.0.0.1`
- port: `3306`
- database: `internal_platform`
- user: `root`
- password: `root`

## 数据库

当前 API 已接入 `mysql2` 连接池。

启动前先安装依赖：

- 在 `internal-platform/apps/api` 下执行 `npm install`

`GET /health` 会实际尝试连接数据库，并返回：

- `connected`
- `connection_failed`
- 对应错误信息

## 当前接口

### 基础
- `GET /`：基础状态
- `GET /health`：应用和数据库真实连接状态
- `GET /modules`：模块注册信息

### 用户权限
- `POST /auth/login`
- `GET /auth/feishu/callback`
- `GET /users`
- `GET /departments`
- `GET /roles`
- `GET /permissions`

当前用户权限模块已经按 `route -> service -> repository` 分层，`/users`、`/departments`、`/roles`、`/permissions` 已切到真实 SQL 查询；登录接口会基于数据库用户列表做本地用户匹配。

### 记账模块
- `GET /ledger/accounts`
- `GET /ledger/accounts/:id`
- `POST /ledger/accounts`
- `GET /ledger/categories`
- `POST /ledger/categories`
- `GET /ledger/transactions`
- `GET /ledger/transactions/:id`
- `POST /ledger/transactions`
- `GET /ledger/transactions/:id/attachments`
- `POST /ledger/transactions/:id/attachments`
- `GET /ledger/imports`
- `GET /ledger/imports/:id`
- `POST /ledger/imports`
- `GET /ledger/external-transactions`
- `GET /ledger/matches`

当前记账模块已按 `route -> service -> repository` 分层，查询接口和对应详情查询已切到真实 SQL；`POST /ledger/accounts`、`POST /ledger/categories`、`POST /ledger/transactions`、`POST /ledger/imports` 也已切到真实数据库写入。记账流水支持图片凭证附件查询与上传接口，附件会写入 `transaction_attachments` 表。

### 勾稽模块
- `GET /reconciliation/purchase-orders`
- `GET /reconciliation/purchase-orders/:id`
- `GET /reconciliation/payment-requests`
- `GET /reconciliation/payment-requests/:id`
- `GET /reconciliation/delivery-orders`
- `GET /reconciliation/delivery-orders/:id`
- `GET /reconciliation/invoices`
- `GET /reconciliation/invoices/:id`
- `GET /reconciliation/status-snapshots`
- `GET /reconciliation/relations`
- `POST /reconciliation/relations/purchase`
- `PUT /reconciliation/relations/purchase/:id`
- `DELETE /reconciliation/relations/purchase/:id`
- `POST /reconciliation/relations/payment-requests`
- `PUT /reconciliation/relations/payment-requests/:id`
- `DELETE /reconciliation/relations/payment-requests/:id`
- `POST /reconciliation/relations/delivery`
- `PUT /reconciliation/relations/delivery/:id`
- `DELETE /reconciliation/relations/delivery/:id`

当前勾稽模块已按 `route -> service -> repository` 分层，列表、关系总览、状态快照和详情拼装所依赖的底层查询已切到真实 SQL；采购/请款/发货的双向追溯已改为基于共享发票关系表拼装，不再依赖临时 id 推导。关系维护接口现已支持新增、修改、删除三类发票关系，并在每次变更后同步刷新对应对象与发票的状态快照。

### 新品开发模块
- `GET /product-dev/projects`
- `POST /product-dev/projects`
- `GET /product-dev/projects/:id`
- `PUT /product-dev/projects/:id`
- `DELETE /product-dev/projects/:id`
- `GET /product-dev/quotes`
- `POST /product-dev/quotes`
- `PUT /product-dev/quotes/:id`
- `DELETE /product-dev/quotes/:id`
- `GET /product-dev/profit-calculations`
- `POST /product-dev/profit-calculations`
- `PUT /product-dev/profit-calculations/:id`
- `DELETE /product-dev/profit-calculations/:id`
- `GET /product-dev/sync-records`
- `POST /product-dev/sync-records`
- `PUT /product-dev/sync-records/:id`
- `DELETE /product-dev/sync-records/:id`
- `POST /product-dev/samples`
- `PUT /product-dev/samples/:id`
- `DELETE /product-dev/samples/:id`

当前新品开发模块已按 `route -> service -> repository` 分层，项目、报价、利润试算、打样记录和领星同步记录的查询已切到真实 SQL；详情接口会按项目聚合这些子表数据。项目、报价、利润试算、打样记录、领星同步记录均已支持真实数据库新增、修改、删除。

## 当前模块占位

- auth
- users
- ledger
- reconciliation
- product-dev
