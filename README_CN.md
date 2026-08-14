# Manu · 玛努 — Six Lenses

**中文** · [English](./README.md)

一个民族文化科普互动网站，主题「一个体验，六种世界观」。用交互式翻转卡片，探索同一人类体验在藏医、蒙医、维医、傣医、苗医、壮医六种民族医学传统中各自的理解方式。

👉 **访问：<https://manu6lenses.win>** — 免费、无需注册、浏览器直接使用。

> 本站为文化科普产品，非医疗建议。

## 你可以做什么

- **Six Lenses 翻转卡片** — 选择主题（如失眠），逐张翻转看六种传统各自怎么看
- **ManuBTI 小测验** — 12 道题穿越三个维度（内在节奏 · 外在温度 · 连接方式），将你映射到 **27 种融合人格** 之一，每一种都由六大传统的智慧交织而成
- **Ask Manu AI** — 与 AI 文化导游对话，从文化视角回答（不做医疗建议）

## 六种民族医学

| | 传统 | 核心理念 |
| --- | --- | --- |
| 🏔️ | 藏医 · Sowa Rigpa | 三因（隆 / 赤巴 / 培根） |
| 🐎 | 蒙医 · Mongol Emnelge | 三根（赫依 / 希日 / 巴达干） |
| 🐫 | 维医 · Uyghur Tibbi | 四体液与气质（丝路遗产） |
| 🌿 | 傣医 · Tai Lue Medicine | 四元素（风、火、水、土） |
| 🌺 | 苗医 · Hmong Medicine | 冷热二元（身体的内在气候） |
| 🌾 | 壮医 · Cuengh Medicine | 三道两路（气血与感知的通路） |

## 项目结构

```
manu-6lenses/
├── backend/                    # 本地开发服务器（Node + Express）
│   ├── server.js               #   /api/chat 代理到 Google Gemini
│   ├── manu_six_lenses.html    #   前端（单文件应用）
│   ├── package.json
│   └── .env                    #   GEMINI_API_KEY, GEMINI_MODEL, PORT
├── worker/                     # 生产部署（Cloudflare Worker）
│   ├── worker.js               #   托管 HTML + 代理 /api/chat
│   ├── wrangler.toml           #   路由 manu6lenses.win → worker
│   ├── manu_six_lenses.html    #   同一份前端，随 worker 打包
│   └── package.json
├── start.bat                   # Windows 一键启动（启服务 + 开浏览器）
├── README.md
└── README_CN.md
```

前端是一个自包含的 HTML 单文件（CSS + JS 内联，无需构建）。同一份文件分别放在 `backend/` 和 `worker/` 下，修改时请保持两边同步。

## 技术栈

- **前端** — 原生 HTML / CSS / JavaScript，无框架、无打包工具
- **本地后端** — Node.js + Express 5，同时托管静态文件
- **生产边缘** — Cloudflare Worker（`manu6lenses.win`），托管页面并代理聊天接口
- **AI** — Google Gemini（`gemini-3.6-flash`）免费额度，通过 `generativelanguage` API 调用

## 本地开发

前置条件：[Node.js](https://nodejs.org/) 18+ 与一个 Google Gemini API Key。

```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 配置 API Key
#    在 backend/ 下创建 .env：
#      GEMINI_API_KEY=你的key
#      GEMINI_MODEL=gemini-3.6-flash
#      PORT=3000

# 3. 启动服务
npm start
# → 自动打开 http://localhost:3000/manu_six_lenses.html
```

Windows 用户也可以直接双击 `start.bat` —— 它不会额外安装东西，启动后端并打开浏览器。

> `.env` 已在 `.gitignore` 中。切勿把真实的 `GEMINI_API_KEY` 提交到仓库。

## API 接口

| 方法 | 路径            | 说明 |
| --- | --------------- | --- |
| GET | `/` | 返回 Six Lenses 页面 |
| GET | `/manu_six_lenses.html` | 同上 |
| GET | `/api/health` | 健康检查 → `{ status: "ok", model }` |
| POST | `/api/chat` | 请求体 `{ messages: [{ role, content }] }` → `{ reply }` |

## 部署到 Cloudflare Workers

线上站点以单个 Cloudflare Worker 形式运行，绑定自定义域 `manu6lenses.win`。

```bash
cd worker

# 1. 将 Gemini Key 设为 Worker secret
npx wrangler secret put GEMINI_API_KEY

# 2. 部署
npx wrangler deploy
```

`wrangler.toml` 已声明路由和 `manu6lenses.win` 自定义域。首次部署后，如尚未绑定，请在 Cloudflare 控制台 Workers → 你的 worker → Triggers → Custom Domains 中添加该自定义域。

## 说明与限制

- 聊天使用 Gemini **免费额度** —— 当日配额用尽时接口返回 `429`，Manu 会温柔地提示你明天再来。
- 所有回答都框定为 **文化科普**，绝不构成医疗建议；系统提示词会主动把健康问题引导回文化视角。
- Worker 仅允许 `Origin: https://manu6lenses.win` 的请求，其他来源一律返回 403。

## License

MIT —— 仓库地址 [Qinging-wu/manu-6lenses](https://github.com/Qinging-wu/manu-6lenses)。

## 作者

**Qinging_267** · [GitHub: Qinging-wu](https://github.com/Qinging-wu)
