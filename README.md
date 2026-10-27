# 小伟 · AI 智能客服对话系统

一套「微信风格」的 AI 智能客服对话应用：**React 18 + Vite + Tailwind CSS** 前端，**Express + Vercel AI SDK** 后端，支持 **SSE 流式对话（防卡顿渲染）**、**图片/文件上传**、**表情面板**、**提示词模板 / 快捷提示词**、**FAQ 知识库防幻觉**。AI 助手人设为「小伟」。

---

## 一、架构总览

```
浏览器  React 18 + Vite + Tailwind CSS  (:5173)
   │  fetch + SSE 流式（自定义协议 delta/done/error）
   ▼
Node.js 后端  Express + Vercel AI SDK  (:3001)
   │  ├─ FAQ 关键词检索（幻觉兜底，注入 system prompt）
   │  ├─ multer 文件/图片上传 + 文本提取
   │  └─ 提示词模板 / 身份人设（小伟）+ 防幻觉规则
   ▼
模型层（server/.env 一键切换，无需改代码）
   ├─ Ollama 本地（默认，免费离线）  qwen2.5:7b
   └─ 任意 OpenAI 兼容云 API：DeepSeek / MiniMax / 通义千问 / OpenAI
```

**核心亮点**

| 能力 | 实现位置 | 说明 |
|---|---|---|
| 流式对话 | `server/src/routes/chat.ts` + `client/src/hooks/useStreamChat.ts` | 后端 SSE 分片；前端缓冲 + RAF 批量刷新防卡顿 |
| 防卡顿渲染 | `useStreamChat.ts` / `MessageList.tsx` | delta 只进 buffer，`requestAnimationFrame` 合并 setState；历史消息 `React.memo`；滚底 RAF 节流 |
| 防幻觉 | `server/src/prompts/system.ts` + `knowledge/faq.ts` | 低温 0.3 + 拒答话术 + FAQ 命中注入参考资料 |
| 表情 | `client/src/components/EmojiPanel.tsx` + `data/emoji.ts` | 微信式分类面板 + 最近使用（localStorage） |
| 上传 | `server/src/routes/upload.ts` + `InputBar.tsx` | 图片本地预览/dataURL；文本文件后端提取内容 |
| 提示词 | `Sidebar`（角色模板）+ `PromptBar`/`WelcomeHero`（快捷提示词） | 点击快捷提示词 = 填入输入框 + 立即生成对话 |
| 落地页 | `WelcomeHero.tsx` + `index.css` | 渐变标题入场动画 + 输入框流光边框（仿百炼） |

---

## 二、目录结构

```
Project/ai/
├── README.md                     # 本文件
├── client/                       # 前端（React + Vite + Tailwind）
│   ├── package.json
│   ├── vite.config.ts            # 环境/服务/打包压缩/图片处理/CSS 配置
│   ├── tailwind.config.js        # Tailwind（含微信绿等自定义色）
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example              # VITE_PORT / VITE_API_TARGET
│   └── src/
│       ├── main.tsx / App.tsx / index.css / types.ts
│       ├── api/chat.ts           # SSE 客户端封装（含中断）
│       ├── hooks/useStreamChat.ts# 流式 + RAF 防卡顿核心
│       ├── data/emoji.ts         # 表情分类 + 最近使用
│       ├── data/prompts.ts       # 模板/占位符/欢迎语/快捷提示词
│       └── components/
│           ├── Sidebar.tsx  ChatHeader.tsx  MessageList.tsx  MessageBubble.tsx
│           ├── EmojiPanel.tsx  InputBar.tsx  AttachmentPreview.tsx
│           ├── WelcomeHero.tsx  PromptBar.tsx
└── server/                       # 后端（Express + AI SDK）
    ├── package.json
    ├── .env.example              # 模型提供方 / API Key 配置
    └── src/
        ├── index.ts              # 启动 + 路由挂载
        ├── config.ts             # provider 工厂（ollama / openai 兼容）
        ├── routes/chat.ts        # POST /api/chat（SSE）、GET /api/model
        ├── routes/upload.ts      # POST /api/upload
        ├── prompts/system.ts     # 人设「小伟」+ 模板 + 防幻觉规则
        └── knowledge/faq.ts      # FAQ 知识库 + 关键词检索
```

---

## 三、快速开始

### 0. 环境要求（重要）

- **Node.js ≥ 18**（AI SDK v5 与 Vite 5 均要求）。本机默认可能是 v14，请用 nvm 切换：
  ```bash
  nvm use 18.18.2     # 或 nvm install 18
  ```
- 任选其一作为「模型服务」：
  - **本地**：安装 [Ollama](https://ollama.com) 并 `ollama pull qwen2.5:7b`（免费、离线、无需 key）
  - **云端**：准备一个 OpenAI 兼容 API 的 key（见第四节）

### 1. 启动后端

```bash
cd Project/ai/server
cp .env.example .env      # 按需修改模型配置
npm install
npm run dev               # 默认 :3001
```

### 2. 启动前端

```bash
cd Project/ai/client
npm install
npm run dev               # 默认 :5173，/api 自动代理到 :3001
```

打开 http://localhost:5173 即可对话。

### 3. 生产构建（前端）

```bash
cd Project/ai/client
npm run build             # 产出 dist/，含 .gz / .br 压缩文件
```

---

## 四、模型配置与 API Key 申请

全部在 `server/.env` 配置，**切换服务商不改任何代码**。

| 方案 | PROVIDER | BASE_URL | MODEL | Key 申请地址 |
|---|---|---|---|---|
| Ollama 本地 | `ollama` | `http://127.0.0.1:11434` | `qwen2.5:7b` | 无需 key（https://ollama.com） |
| DeepSeek | `openai` | `https://api.deepseek.com/v1` | `deepseek-chat` | https://platform.deepseek.com/ |
| MiniMax | `openai` | `https://api.minimaxi.com/v1` | `MiniMax-Text-01` | https://platform.minimaxi.com/ |
| 通义千问 | `openai` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | https://bailian.console.aliyun.com/ |
| OpenAI | `openai` | `https://api.openai.com/v1` | `gpt-4o-mini` | https://platform.openai.com/ |

示例（DeepSeek）：

```env
PROVIDER=openai
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_MODEL=deepseek-chat
```

> 想让 AI「看懂」上传的图片：使用视觉模型（如 Ollama 的 `qwen2.5vl:7b` 或云端多模态模型），并把 `SUPPORTS_VISION=true`。否则图片会降级为文字占位说明。

---

## 五、依赖清单（前端 / 后端 分区标注）

### 前端 `client/` —— 运行依赖（会打进浏览器产物）

| 依赖 | 用途 |
|---|---|
| `react` / `react-dom` | UI 框架与渲染 |
| `react-markdown` | AI 回复的 Markdown 渲染 |
| `remark-gfm` | Markdown 表格/删除线/任务列表等扩展 |

### 前端 `client/` —— 开发依赖（仅构建期，不进产物）

| 依赖 | 用途 |
|---|---|
| `vite` | 构建工具 / dev server / 代理 |
| `@vitejs/plugin-react` | React 快刷新（引入 babel，见注意事项） |
| `typescript` | 类型检查 |
| `@types/react` / `@types/react-dom` | React 类型 |
| `tailwindcss` | **CSS 框架**（原子类） |
| `postcss` / `autoprefixer` | Tailwind 处理链 / 浏览器前缀 |
| `vite-plugin-compression` | 产物 gzip + brotli 压缩 |

### 前端 `client/` —— overrides（锁定版本，规避坏包）

| 依赖 | 说明 |
|---|---|
| `@babel/core` / `@babel/types` = `7.28.6` | 见「注意事项 2」 |

### 后端 `server/` —— 运行依赖

| 依赖 | 用途 | 归属 |
|---|---|---|
| `express` | Web 框架 / 路由 | 后端 |
| `cors` | 跨域 | 后端 |
| `dotenv` | 读取 `.env` | 后端 |
| `ai` | **Vercel AI SDK**：`streamText` 流式推理 | 后端 |
| `@ai-sdk/openai-compatible` | OpenAI 兼容 provider（一套代码接 Ollama/DeepSeek/MiniMax/通义） | 后端 |
| `multer` | 文件/图片上传（内存存储） | 后端 |
| `zod` | AI SDK 的 peer 依赖（必须装） | 后端 |

### 后端 `server/` —— 开发依赖

| 依赖 | 用途 |
|---|---|
| `tsx` | 直接运行/热重载 TypeScript |
| `typescript` | 类型检查 |
| `@types/express` / `@types/cors` / `@types/multer` / `@types/node` | 类型 |

---

## 六、重要注意事项（踩坑记录）

1. **Node 版本**：必须 ≥18。默认 v14 会导致 AI SDK / Vite 无法运行。用 `nvm use 18` 切换后再 `npm install` 与启动。

2. **企业镜像源 + babel 坏包（已用 overrides 解决）**：本机 npm 源为公司内网镜像 `http://npm.corp.rs.com`。该镜像对 `@babel/types@7.29.11` 的元数据/包体同步不全，导致解析 `@babel/types@^7.29.11` 报 `ETARGET notarget`。已在 `client/package.json` 用 `overrides` 把 `@babel/core`、`@babel/types` 锁定到镜像确认可用的 `7.28.6`。**如果你换了官方源（`https://registry.npmjs.org`），可删除该 overrides。**

3. **`zod` 是 AI SDK v5 的 peer 依赖**：不装会在运行/类型检查时报错，已加入后端依赖。

4. **AI SDK v5 参数名**：token 上限用 `maxOutputTokens`（v4 的 `maxTokens` 已废弃）。

5. **流式错误必须用 `fullStream`**：`textStream` 会吞掉模型调用错误（表现为空回复）。`chat.ts` 已改用 `fullStream` 并在 `error` 事件时抛出，前端才能收到友好错误提示。

6. **`.env` 不入库**：`server/.env` 含 API Key，已在 `.gitignore` 忽略；仓库只保留 `.env.example`。

7. **上传限制**：单文件 ≤10MB；后端仅提取 `.txt/.md/.json/.csv/.log` 文本；图片以 dataURL 随消息发送，故 `express.json` limit 设为 15mb。

8. **会话为内存态**：刷新页面清空，无账号/数据库（一期设计）。

---

## 七、「企业镜像源」是什么？是 AI 调用服务吗？

**不是。** 两者完全无关，务必区分：

- **npm 镜像源**（如本机的 `http://npm.corp.rs.com`，或官方 `registry.npmjs.org`、淘宝 `npmmirror`）：只负责**下载代码依赖包**（react、express、vite…）。它不提供任何 AI 能力。第六节注意事项 2 的报错就来自它同步不全。
- **AI 调用服务**（Ollama / DeepSeek / MiniMax / 通义 / OpenAI）：负责**真正的大模型推理**，由 `server/.env` 的 `PROVIDER` + `BASE_URL` + `API_KEY` 决定，与 npm 源无关。

查看/修改 npm 源：

```bash
npm config get registry          # 查看
npm config set registry https://registry.npmjs.org   # 切官方（可选）
```

---

## 八、能用于真实生产项目吗？

**可以作为生产项目的起点 / 原型，但直接上生产前需补齐以下能力：**

已具备（生产可用部分）
- 清晰的前后端分层、流式协议、错误降级、防卡顿渲染、Tailwind 工程化、产物压缩分包。

上生产前建议补齐
1. **鉴权与安全**：接口加登录态/限流；上传做类型白名单与病毒扫描；防 prompt 注入与越权。
2. **持久化**：会话/消息入库（MySQL/Postgres/Mongo），替换内存态。
3. **知识库升级**：FAQ 关键词匹配 → 向量检索（embedding + 向量库），提升召回与防幻觉。
4. **可观测性**：日志、trace、token 计费统计、模型调用监控与告警。
5. **成本与配额**：按用户/租户限流、缓存高频问答。
6. **部署**：前端静态托管（CDN/Nginx，直出 `.gz/.br`）；后端容器化 + 健康检查 + 水平扩展；SSE 需关闭代理缓冲（Nginx `proxy_buffering off`）。
7. **合规**：AI 生成内容标识（已加「内容由 AI 生成」免责声明）、隐私与数据出境评估。

结论：**架构与代码质量达到生产原型标准**；按上面清单补齐后即可承载真实业务。

---

## 九、常见问题（FAQ）

- **页面显示「未连接后端」**：确认 `server` 已启动（:3001）且前端代理指向正确（`client/.env.local` 的 `VITE_API_TARGET`）。
- **回复报「无法连接到模型服务」**：Ollama 未启动/未 pull 模型，或云 API 的 key/base_url 填错。见第四节。
- **端口被占用**：改 `server/.env` 的 `PORT` 与 `client/.env.local` 的 `VITE_PORT`、`VITE_API_TARGET`。
- **图片 AI 不识别**：当前模型非视觉模型，设置 `SUPPORTS_VISION=true` 并换视觉模型。
- **流式卡顿**：正常不会；若机器性能差，可降低模型规模（如 `qwen2.5:3b`）。

---

## 十、二期演进方向

- WebAssembly 浏览器本地推理（wllama/transformers.js）做离线兜底
- 向量知识库 RAG、多轮工具调用（function calling）
- 多会话管理、消息搜索、导出
- 语音输入/播报
