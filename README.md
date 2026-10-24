# AI智能伴侣（ai-companion-web）

> 基于 Vue 3 + Vite 构建的 AI 智能伴侣前端，支持多会话对话、人设切换、主题切换与会话记忆。
> 本项目为小组协作项目。

---

## 1. 项目简介

**AI智能伴侣** 是一款基于人工智能的情感陪伴应用。你可以为 AI 伴侣设置昵称和性格，通过自然、温馨的对话进行交流。支持多会话管理、会话记忆、主题切换、预设人设切换等功能。

### 技术栈

| 类别 | 技术 | 说明 |
| --- | --- | --- |
| 框架 | Vue 3.5（组合式 API + `<script setup>`） | 主流企业级写法 |
| 构建工具 | Vite 5 | 极速开发与构建 |
| 路由 | Vue Router 4 | 路由懒加载、History 模式 |
| 状态管理 | Pinia 2 | 模块化 store（chat / companion） |
| 请求库 | Axios 1.x | 统一封装：拦截器、解包、错误提示 |
| 样式方案 | SCSS + CSS 变量 | 支持暗黑主题，视觉与原项目 100% 一致 |
| 代码规范 | ESLint + Prettier | 培养规范意识 |

### 功能一览

- 💬 **智能对话**：基于 DeepSeek 大模型，自然流畅的情感回复
- 📄 **多会话管理**：新建、切换、删除会话，高亮当前会话
- 🎨 **主题切换**：白色 / 暗黑双主题，选择持久化到 localStorage
- 🧑‍🤝‍🧑 **个性定制**：预设人设一键切换，也可手动设置昵称与性格
- 🔒 **安全渲染**：消息内容由 Vue 插值自动转义，杜绝 XSS

---

## 2. 项目架构

### 目录结构

```
ai-companion-web/
├── public/                       # 无需构建的静态资源（favicon 等）
├── src/
│   ├── api/                      # 接口请求层
│   │   ├── modules/              #   按业务模块拆分：session / chat / preset
│   │   ├── request.js            #   axios 统一封装（拦截器、解包、错误处理）
│   │   └── index.js              #   统一出口，按需引入
│   ├── assets/
│   │   └── styles/index.scss     # 全局样式（由原项目 style.css 迁移）
│   ├── components/
│   │   └── business/             # 业务公共组件：ThemeSwitcher / LoadingDots
│   ├── composables/              # 组合式函数：useTheme（主题逻辑）
│   ├── layout/
│   │   └── ChatLayout.vue        # 三栏应用外壳 + 应用初始化
│   ├── router/
│   │   └── index.js              # 路由配置（懒加载 + 标题守卫）
│   ├── stores/
│   │   ├── modules/
│   │   │   ├── chat.js           # 会话列表 / 当前会话 / 消息 / 发送
│   │   │   └── companion.js      # 昵称 / 性格 / 预设列表
│   │   └── index.js              # Pinia 实例
│   ├── utils/
│   │   └── storage.js            # localStorage 封装
│   ├── views/
│   │   └── chat/components/      # 聊天页面拆分的子组件
│   │       ├── SessionSidebar.vue
│   │       ├── ChatMain.vue
│   │       ├── ChatMessageItem.vue
│   │       └── InfoSidebar.vue
│   ├── App.vue                   # 根组件（路由出口 + 主题初始化）
│   └── main.js                   # 入口文件
├── .env.development              # 开发环境变量
├── .env.production               # 生产环境变量
├── vite.config.js                # Vite 配置（@ 别名、开发代理）
├── .eslintrc.cjs / .prettierrc.json
└── README.md
```

### 架构设计思路

1. **分层清晰**：页面（`views`）→ 业务逻辑（`stores`）→ 接口（`api`）三层分离，UI 与数据解耦。
2. **组件化**：三栏布局拆分为独立组件，消息气泡、加载动画、主题切换器抽成可复用组件。
3. **状态集中**：所有业务状态收敛到 Pinia，组件只负责渲染与交互，杜绝状态散落。
4. **请求统一**：所有接口经由 `request.js` 发出，统一解包 `{ code, message, data }` 结构、统一错误提示，新增接口只需在 `api/modules/` 加一个函数。
5. **配置驱动**：接口地址、后端代理地址均通过环境变量（`.env.*`）管理，适配开发/生产环境。

---

## 3. 环境要求

| 工具 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | ≥ 18.0（推荐 20+） | 本项目在 Node 24.17 验证通过 |
| npm | ≥ 9（推荐 10+） | 也可使用 pnpm / yarn |

> 查看当前环境：`node -v && npm -v`

---

## 4. 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发环境（默认 http://localhost:5173）
npm run dev

# 3. 生产构建（产物在 dist/ 目录）
npm run build

# 4. 预览生产构建
npm run preview

# 5. 代码检查 / 格式化
npm run lint
npm run format
```

> ⚠️ 本项目依赖后端服务（接口地址 `http://localhost:8000`）。开发环境下 Vite 会将 `/api` 请求自动代理到后端，**请先确保后端服务已启动**，否则页面会提示"加载失败"。

---

## 5. 接口说明

### 接口基础地址配置

- 开发环境：`.env.development` 中的 `VITE_API_BASE_URL=/api`，请求经 Vite 代理转发到 `VITE_BACKEND_URL`。
- 生产环境：`.env.production` 中的 `VITE_API_BASE_URL=/api`，由 Nginx 反向代理到后端（需配置 `location /api { proxy_pass http://localhost:8000; }`）。

所有接口返回统一结构：

```json
{ "code": 200, "message": "success", "data": { } }
```

> `code === 200` 表示成功；其余视为业务错误，由 `request.js` 统一弹窗提示。

### 接口文件组织方式

```
src/api/
├── request.js          # axios 实例 + 请求/响应拦截器
└── modules/
    ├── session.js      # 会话：列表 / 创建 / 详情 / 删除
    ├── chat.js         # 聊天：发送消息
    └── preset.js       # 预设：获取预设列表
```

### 如何新增接口

1. 在 `src/api/modules/` 中找到对应模块文件（或新建模块文件）；
2. 添加一个函数，调用 `request` 实例：

```js
import request from '@/api/request'

/**
 * 获取某会话的更多信息
 * @param {string} sessionId 会话 id
 * @returns {Promise<*>} 业务数据
 */
export function getSessionExtra(sessionId) {
  return request.get(`/sessions/${sessionId}/extra`)
}
```

3. 在页面 / store 中调用即可（`data` 已被拦截器解包，无需手动处理）。

---

## 6. 开发规范

| 规范项 | 约定 |
| --- | --- |
| 组件命名 | PascalCase（如 `SessionSidebar.vue`），与文件名一致 |
| 页面组件 | 放入 `views/<模块>/components/`，按业务模块组织 |
| 公共组件 | 放入 `components/business/`，强调可复用性 |
| 接口函数 | 动词 + 业务含义（`getSessionList` / `createSession`），带 JSDoc 注释 |
| Store | 按业务拆分到 `stores/modules/`，命名 `useXxxStore` |
| 目录/文件 | 小驼峰（JS 文件）或 PascalCase（组件文件），常量大写 |
| 代码风格 | 由 Prettier 统一（单引号、2 空格缩进、无分号结尾风格见配置） |
| 代码注释 | **中文注释**，接口与复杂逻辑必须注释 |

---

