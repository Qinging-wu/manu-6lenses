# Manu (玛努) — Six Lenses

**中文** · [English](./README.md)

> ### ✨ 只想体验？直接访问 **<https://manu6lenses.win>** — 免费、无需注册、浏览器打开即用，无需任何配置。
>
> 下面的「本地开发」「部署」等章节，是给想 fork 一份自己副本的开发者看的。**如果你只是想用 Manu，上面的链接就是全部所需，本 README 后半部分可以完全忽略。**

一个民族文化科普互动网站，主题「一个体验，六种世界观」。用交互式翻转卡片，探索同一人类体验在藏医、蒙医、维医、傣医、苗医、壮医六种民族医学传统中各自的理解方式。

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

---

## 面向开发者（自建实例）

以下章节仅在你打算 fork 本仓库、跑一份自己的副本时才相关。（只想用 Manu？看本页顶部的链接即可。）

> 线上的 `manu6lenses.win` 是作者自己的部署，你无权使用；你需要部署到自己的 Worker URL 或自己的域名。

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
│   ├── wrangler.toml           #   路由 你的域名 → worker
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

## 部署到你自己的 Cloudflare Worker

fork 后以单个 Cloudflare Worker 形式运行。请使用你自己的 Worker 名称和（可选）自己的自定义域——不要复用 `manu6lenses.win`，那是作者的域名。

```bash
cd worker

# 1. 将 Gemini Key 设为 Worker secret
npx wrangler secret put GEMINI_API_KEY

# 2. 部署
npx wrangler deploy
```

部署前请编辑 `worker/wrangler.toml`：

- 把 `name = "manu-ai"` 改成你自己的 Worker 名称
- 把 `routes` / `custom_domain` 里的 `manu6lenses.win` 改成你自己的域名（或删掉该项，直接用默认的 `*.workers.dev` URL）
- 把 `worker.js` 中的 `ALLOWED_ORIGIN` 改成你实际托管的来源

如使用自定义域，首次部署后请在 Cloudflare 控制台 Workers → 你的 worker → Triggers → Custom Domains 中绑定。

## 说明与限制

- 聊天使用 Gemini **免费额度** —— 当日配额用尽时接口返回 `429`，Manu 会温柔地提示用户明天再来。
- 所有回答都框定为 **文化科普**，绝不构成医疗建议；系统提示词会主动把健康问题引导回文化视角。
- Worker 仅允许 `ALLOWED_ORIGIN` 指定的来源，其他来源一律返回 403。请把该常量改成你自己的域名。

## 关联仓库

本站的 ManuBTI 小测验也以**独立、零依赖的可嵌入组件**形式发布在另一个仓库——如果你只想把测验部分嵌入到自己的网页项目中，可以用它：

➡️ **[Qinging-wu/ManuBTI](https://github.com/Qinging-wu/ManuBTI)** — 12 题文化视角测验，打包为可复用的静态文件（`index.html` + `data.js` + `quiz.js` + `styles.css`），并支持 OpenCode / Claude Code / Cursor / Codex 等 agent 工具集成。

## License

MIT —— 仓库地址 [Qinging-wu/manu-6lenses](https://github.com/Qinging-wu/manu-6lenses)。

## 作者

**Qinging_267** · [GitHub: Qinging-wu](https://github.com/Qinging-wu)
