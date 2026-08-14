# Manu · 玛努 — Six Lenses

**English** · [中文 README](./README_CN.md)

An interactive cultural-education website with the theme **"One Experience, Six Worldviews."** Interactive flip cards present the same universal human experience (e.g. sleeplessness) through six ethnic medical traditions — Tibetan, Mongolian, Uyghur, Dai, Miao, and Zhuang — alongside an AI cultural-education chat, **Ask Manu AI**.

> This site is a cultural-education product, never health advice.

Live site: <https://manu6lenses.win>

## Features

- **Six Lenses flip cards**: pick a topic (e.g. sleeplessness) and flip through six ethnic-medicine perspectives one by one
- **ManuBTI quiz**: explore which ethnic worldview resonates with you
- **Ask Manu AI**: AI cultural-education dialogue that answers from a cultural perspective — never medical advice

## Tech Stack

| Environment | Technology |
| --- | --- |
| Production | Cloudflare Worker (`worker/`) on a custom domain |
| AI model | Google Gemini `gemini-3.6-flash` (free tier, ~1,500 requests/day) |
| Local | Node.js + Express (`backend/`) |

## Project Structure

```
.
├── start.bat              # Local launcher (opens the browser for you)
├── backend/               # Local backend (Express + Gemini proxy)
│   ├── server.js          # Chat API + static file serving
│   ├── manu_six_lenses.html
│   └── .env               # API key (not committed to git)
└── worker/                # Cloudflare Worker (production)
    ├── worker.js          # Serves the page + /api/chat proxy
    ├── wrangler.toml      # Worker config + custom domain
    └── manu_six_lenses.html
```

## Run Locally

1. Put your Google Gemini API key in `backend/.env`:

   ```env
   GEMINI_API_KEY=your-api-key
   GEMINI_MODEL=gemini-3.6-flash
   PORT=3000
   ```

2. Double-click `start.bat`, or run manually:

   ```bash
   cd backend
   npm install
   node server.js
   ```

3. Open <http://localhost:3000> in your browser.

> Note: the chat feature requires the backend server. Do not open the HTML file directly (`/api/chat` won't work).

## Deploy to Production (Cloudflare Worker)

```bash
cd worker
wrangler login
wrangler secret put GEMINI_API_KEY   # set encrypted key
wrangler deploy
```

The custom domain `manu6lenses.win` applies automatically after deploy (already configured in `wrangler.toml`).

## API Key Privacy

- The key lives only server-side: as an encrypted Cloudflare Secret in production, and in `backend/.env` (git-ignored) locally
- The frontend HTML contains no key or API URL
- The Worker only accepts requests from `https://manu6lenses.win`, preventing others from draining your quota

## Free Tier Notes

- Gemini free tier offers ~**1,500 requests/day**, resetting at midnight Pacific Time
- When the quota runs out, a friendly message is shown; it recovers automatically the next day

## License

MIT