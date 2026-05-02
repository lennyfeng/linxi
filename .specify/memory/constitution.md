# Constitution: 霖淅内部管理平台

**项目**: 霖淅 (Linxi) Internal Platform  
**分支**: `daiguangsen.windsurf`  
**建立日期**: 2026-04-29  
**角色**: 高级产品经理驱动

---

## Article 1: 规范驱动开发 (Spec-Driven Development)

1.1 所有功能必须先有规格说明 (spec)，再进行技术设计和实现  
1.2 规格说明必须从用户场景出发，以业务价值为核心  
1.3 任何代码变更必须可追溯到 spec 中的需求条目  
1.4 禁止无规格说明的直接编码

## Article 2: 架构一致性 (Architectural Integrity)

2.1 后端 API 必须遵循现有 Node.js + mysql2 技术栈  
2.2 前端必须遵循现有 React + Ant Design + Vite 技术栈  
2.3 新增模块必须遵循现有模块结构: `modules/<name>/index.ts` + `modules/<name>/service/*.ts`  
2.4 数据库变更必须通过 migration 文件管理，禁止手动改表  
2.5 API 路由必须注册到 `main.ts` 的路由处理链中  
2.6 前端页面必须遵循现有路由和布局结构

## Article 3: 代码质量 (Code Quality)

3.1 TypeScript 严格模式，禁止 `any` 类型（除必要的第三方库兼容）  
3.2 每个模块必须有清晰的 `index.ts` 路由入口和 `service/` 业务逻辑分离  
3.3 错误处理必须使用 `AppError` + `ErrorCodes`，禁止裸 throw  
3.4 数据库查询必须使用参数化查询，禁止字符串拼接 SQL  
3.5 所有 API 响应必须遵循 `{ code, message, data, request_id, timestamp }` 格式

## Article 4: 用户体验 (User Experience)

4.1 所有用户操作必须有明确的反馈（成功/失败提示）  
4.2 列表页面必须支持分页、搜索、筛选  
4.3 表单必须有输入验证和友好的错误提示  
4.4 关键操作（删除、修改）必须有确认步骤  
4.5 页面加载必须有 loading 状态指示  
4.6 中文界面，专业术语可保留英文

## Article 5: 安全与权限 (Security & Permissions)

5.1 所有 API 必须经过 auth-middleware 鉴权（白名单路由除外）  
5.2 权限控制必须基于 role_keys + permissions 体系  
5.3 敏感操作必须写入审计日志 (audit log)  
5.4 密码必须使用 bcrypt 加密存储  
5.5 JWT Token 必须有过期机制和刷新机制

## Article 6: 性能与可维护性 (Performance & Maintainability)

6.1 API 响应时间 P95 < 500ms  
6.2 数据库查询必须有合理索引支撑  
6.3 前端组件必须按需加载，避免全量打包  
6.4 公共逻辑抽取到 `packages/shared` 或 `common/` 目录  
6.5 配置项必须通过环境变量管理，禁止硬编码

## Article 7: 开发流程 (Development Process)

7.1 每个功能特性在 `specs/` 目录下建立独立规格目录  
7.2 规格目录包含: spec.md, plan.md, tasks.md, data-model.md  
7.3 实现按 tasks.md 顺序执行，每完成一个 task 更新状态  
7.4 每个功能完成后必须通过 `/health` 和实际页面验证  
7.5 代码提交信息必须关联 spec 编号
