# Voice Agent — TTS web UI

A web page (`docs/`) for voicing text via OpenAI TTS, backed by a proxy
(`worker/`) that hides the API key and runs on Cloudflare Workers.

## 1. Deploy the backend (Cloudflare Worker)

```bash
cd worker
npm install
npx wrangler login          # one-time Cloudflare authorization
npx wrangler secret put OPENAI_API_KEY   # paste your OpenAI key
npx wrangler secret put ACCESS_CODE      # your own long access code (20+ chars)
```

In `wrangler.toml`, set `ALLOWED_ORIGIN` to your GitHub Pages domain
(e.g. `https://hrystynaivaniv.github.io`).

(Optional, for per-IP rate limiting):

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
# paste the id it prints into [[kv_namespaces]] in wrangler.toml
```

Deploy:

```bash
npx wrangler deploy
```

The command prints a URL like `https://voice-agent.<your-subdomain>.workers.dev`.

Copy that URL and the same access code you set with
`wrangler secret put ACCESS_CODE` into `docs/app.js`:

```js
const WORKER_URL = "https://voice-agent.<your-subdomain>.workers.dev";
const ACCESS_CODE = "<your access code>";
```

Commit and push — the GitHub Pages site will pick up the new values.

> The access code here is not a real secret: the page and repo are public,
> so anyone can view `app.js` in DevTools and read it. The real protection
> against abuse is the worker's rate limit and the OpenAI billing limit
> (below); the access code is just a formal barrier. This is fine if you
> fully trust the page's audience.

## 2. Deploy the frontend (GitHub Pages)

1. Push this repository to GitHub.
2. Settings → Pages → Source: `Deploy from a branch`, folder `/docs`.
3. The page will appear at `https://<username>.github.io/<repo>/`.

## 3. Usage

Open the page → pick a model/voice → paste the text → "Play" / "Save mp3".
No extra fields to fill in — `WORKER_URL` and `ACCESS_CODE` are already
baked into the page.

## 4. Budget protection

Make sure to set a spending limit in OpenAI (Billing → Usage limits) —
that's the real safeguard against an unexpected bill, independent of the code.

## Local CLI version

`VoiceAgent.py` remains a separate tool for batch-voicing `content.docx`
sentence by sentence — the web page doesn't replace it, but complements it
for one-off voicing of a single text snippet with a chosen voice/prompt.
