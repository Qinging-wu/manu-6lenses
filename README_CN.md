# Manu · 玛努 — Six Lenses

**中文** · [English](./README.md)

一个民族文化科普互动网站，主题「一个体验，六种世界观」。通过交互式翻转卡片，将失眠等人类共通体验对照展示藏医、蒙医、维医、傣医、苗医、壮医六大民族医学各自的理解方式；并附带 AI 文化教育问答「Ask Manu AI」。

> 本站为文化科普产品，非医疗建议。

线上地址：<https://manu6lenses.win>

## 功能

- **Six Lenses 翻转卡片**：选择主题（如失眠），逐张翻转六种民族医学的视角
- **ManuBTI 小测验**：探索与哪种民族世界观共鸣
- **Ask Manu AI**：AI 文化教育对话，从文化视角回答，不做医疗建议

## 技术栈

| 环境 | 技术 |
| --- | --- |
| 线上 | Cloudflare Worker（`worker/`），绑定自定义域名 |
| AI 模型 | Google Gemini `gemini-3.6-flash`（免费层，约 1,500 次/天） |
| 本地 | Node.js + Express（`backend/`） |

## 目录结构

```
.
├── start.bat              # 本地启动入口（自动打开浏览器）
├── backend/               # 本地后端（Express + Gemini 代理）
│   ├── server.js          # 聊天 API 与静态服务
│   ├── manu_six_lenses.html
│   └── .env               # API key（不提交 git）
└── worker/                # Cloudflare Worker（线上部署）
    ├── worker.js          # 静态页面 + /api/chat 代理
    ├── wrangler.toml      # Worker 配置与自定义域名
    └── manu_six_lenses.html
```

## 本地运行

1. 在 `backend/.env` 中填写 Google Gemini API key：

   ```env
   GEMINI_API_KEY=你的key
   GEMINI_MODEL=gemini-3.6-flash
   PORT=3000
   ```

2. 双击 `start.bat`，或手动运行：

   ```bash
   cd backend
   npm install
   node server.js
   ```

3. 浏览器打开 <http://localhost:3000>

> 注意：聊天功能依赖后端服务器，请勿直接双击 HTML 文件（`/api/chat` 无法工作）。

## 部署到线上（Cloudflare Worker）

```bash
cd worker
wrangler login
wrangler secret put GEMINI_API_KEY   # 设置加密密钥
wrangler deploy
```

部署后自定义域名 `manu6lenses.win` 自动生效（已在 `wrangler.toml` 配置）。

## API key 隐私

- key 仅存于服务端：线上为 Cloudflare 加密 Secret，本地为 `backend/.env`（已被 `.gitignore` 忽略）
- 前端 HTML 不含任何 key 或 API 地址
- Worker 限制仅允许 `https://manu6lenses.win` 域名调用，防止他人盗刷额度

## 免费额度说明

- Gemini 免费层约 **1,500 次请求/天**，太平洋时间午夜重置
- 额度用尽时返回友好提示，次日自动恢复

## License

MIT
