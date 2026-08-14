# Manu · 玛努 — Six Lenses

**English** · [中文 README](./README_CN.md)

An interactive cultural-education website with the theme **"One Experience, Six Worldviews."** It explores how the same human experience can be understood through six ethnic medical traditions — Tibetan, Mongolian, Uyghur, Dai, Miao, and Zhuang.

👉 **Visit: <https://manu6lenses.win>** — free, no sign-up, works right in your browser.

> This site is a cultural-education product, never health advice.

## What You Can Do

- **Six Lenses flip cards** — pick a topic (e.g. sleeplessness) and flip through how each of the six traditions views it
- **ManuBTI quiz** — a 12-question journey across three dimensions (inner rhythm · outer temperature · way of connecting) that maps you to one of **27 integrated personality types**, each woven from the wisdom of the six traditions
- **Ask Manu AI** — chat with an AI cultural guide that answers from a cultural perspective (never medical advice)

## The Six Lenses

| | Tradition | Core idea |
| --- | --- | --- |
| 🏔️ | Tibetan Medicine · 藏医 · Sowa Rigpa | The three energies (rlung / mkhris / badkan) |
| 🐎 | Mongolian Medicine · 蒙医 · Mongol Emnelge | The three roots (Hei / Hiri / Badagan) |
| 🐫 | Uyghur Medicine · 维医 · Uyghur Tibbi | Four humours & temperaments (Silk Road heritage) |
| 🌿 | Dai Medicine · 傣医 · Tai Lue Medicine | The four elements (wind, fire, water, earth) |
| 🌺 | Miao Medicine · 苗医 · Hmong Medicine | Cold–hot duality of the body's internal climate |
| 🌾 | Zhuang Medicine · 壮医 · Cuengh Medicine | Three passages & two roads of qi, blood, and sensation |

---

## For Developers (Forking Your Own Instance)

The sections below are only relevant if you want to fork this repo and run your own copy. If you just want to **use** Manu, visit <https://manu6lenses.win> — nothing below applies to you.

> The live `manu6lenses.win` is the author's own deployment. You don't have access to it; you'll deploy to your own Worker URL or your own domain.

## Project Structure

```
manu-6lenses/
├── backend/                    # Local dev server (Node + Express)
│   ├── server.js               #   /api/chat proxy to Google Gemini
│   ├── manu_six_lenses.html    #   Frontend (single-file app)
│   ├── package.json
│   └── .env                    #   GEMINI_API_KEY, GEMINI_MODEL, PORT
├── worker/                     # Production deployment (Cloudflare Worker)
│   ├── worker.js               #   Serves HTML + proxies /api/chat
│   ├── wrangler.toml           #   Routes your domain → worker
│   ├── manu_six_lenses.html    #   Same frontend, bundled into the worker
│   └── package.json
├── start.bat                   # Windows one-click launcher (starts backend + opens browser)
├── README.md
└── README_CN.md
```

The frontend is a single self-contained HTML file (CSS + JS inlined, no build step). The same file lives in both `backend/` and `worker/` — keep them in sync when editing.

## Tech Stack

- **Frontend** — vanilla HTML / CSS / JavaScript, no framework, no bundler
- **Local backend** — Node.js + Express 5, also serves static files
- **Production edge** — Cloudflare Worker (`manu6lenses.win`), serves the page and proxies chat
- **AI** — Google Gemini (`gemini-3.6-flash`) free tier via `generativelanguage` API

## Local Development

Prerequisites: [Node.js](https://nodejs.org/) 18+ and a Google Gemini API key.

```bash
# 1. Install backend deps
cd backend
npm install

# 2. Configure your API key
#    Create backend/.env with:
#      GEMINI_API_KEY=your_key_here
#      GEMINI_MODEL=gemini-3.6-flash
#      PORT=3000

# 3. Start the server
npm start
# → opens http://localhost:3000/manu_six_lenses.html
```

On Windows you can also just double-click `start.bat` — it installs nothing extra, starts the backend, and opens the browser.

> The `.env` file is git-ignored. Never commit your real `GEMINI_API_KEY`.

## API Endpoints

| Method | Path            | Description |
| ------ | --------------- | ----------- |
| GET    | `/`             | Serve the Six Lenses page |
| GET    | `/manu_six_lenses.html` | Same page |
| GET    | `/api/health`   | Health check → `{ status: "ok", model }` |
| POST   | `/api/chat`     | Body `{ messages: [{ role, content }] }` → `{ reply }` |

## Deploy to Your Own Cloudflare Worker

A fork runs as a single Cloudflare Worker. Pick your own Worker name and (optionally) your own custom domain — do not reuse `manu6lenses.win`, that's the author's domain.

```bash
cd worker

# 1. Set the Gemini key as a Worker secret
npx wrangler secret put GEMINI_API_KEY

# 2. Deploy
npx wrangler deploy
```

Before deploying, edit `worker/wrangler.toml`:

- change `name = "manu-ai"` to your own Worker name
- change the `routes` / `custom_domain` entry from `manu6lenses.win` to your own domain (or remove it to use the default `*.workers.dev` URL)
- update `ALLOWED_ORIGIN` in `worker.js` to match the origin you'll serve from

After the first deploy, attach your custom domain in the Cloudflare dashboard (Workers → your worker → Triggers → Custom Domains) if you're using one.

## Notes & Limits

- Chat uses Gemini's **free tier** — when the daily quota is exhausted the API returns `429`, and Manu will gently tell the user to come back tomorrow.
- All answers are framed as **cultural education**, never medical advice; the system prompt explicitly redirects health questions.
- The Worker rejects any `Origin` other than the one in `ALLOWED_ORIGIN`. Update that constant to your own domain.

## License

MIT — see [Qinging-wu/manu-6lenses](https://github.com/Qinging-wu/manu-6lenses).

## Creator

**Qinging_267** · [GitHub: Qinging-wu](https://github.com/Qinging-wu)
