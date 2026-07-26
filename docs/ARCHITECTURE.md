# ARCHITECTURE

## Stack (pinned — do not change)

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) + React 18 + TypeScript | next `14.2.x`, react `18.3.x`, typescript `^5.4` |
| Styling | Tailwind CSS | `3.4.x` |
| Charts | Recharts | `2.12.x` |
| Scraping/parsing | playwright (`1.45.x`), cheerio (`1.0.x`) | |
| DB/cache | better-sqlite3 (`11.x`) — no ORM | |
| Validation | zod (`3.23.x`) | |
| Icons | lucide-react | latest 0.x |

No other runtime deps without a reason written in the commit message. No shadcn CLI —
hand-write the few UI primitives (Card, Badge, Toggle, Tabs, Table, Skeleton) in
`components/ui/`.

## The Metric contract (heart of the app)

```ts
// lib/types.ts
export type Metric<T = number | string> =
  | { status: 'measured'; value: T; source: string }               // real data
  | { status: 'estimated'; value: T; confidence: 'low' | 'medium' | 'high';
      method: string }                                             // labeled estimate
  | { status: 'unavailable'; reason: string };                     // honest gap
```

- Every field of every module result is a `Metric` (or array of objects whose fields are Metrics).
- One shared UI component `<MetricValue metric={...}/>` renders value + badge + tooltip
  (source or method or reason). Used everywhere. Never render raw numbers.
- Zod schemas in `lib/schemas.ts` validate the full report shape; `npm run smoke`
  asserts against them.

## Analysis pipeline

```
POST /api/analyze { url }
  → normalize domain → check SQLite cache (TTL 24h, ?refresh=1 bypasses)
  → phase A: fetch+crawl (Playwright: homepage render, screenshot, HTML of up to 15
    key pages by priority: /pricing /plans /products /shop /about /contact /blog
    /affiliates /partners + sitemap sample). One CrawlResult object shared by all modules.
  → phase B: run all modules IN PARALLEL over CrawlResult + external APIs:
      snapshot, traffic, trafficSources, products, marketing, ads, social, video,
      seo, competitors, tech, customers
    each via runModule(name, timeoutMs, fn) → on throw/timeout returns a module result
    where every metric is { status:'unavailable', reason }.
  → phase C (only if AI mode ON): aiAnalysis module over the assembled report.
  → assemble Report, store in SQLite (+ traffic_snapshots row for history), return.
```

- `runModule` also records `durationMs` and `error` per module into `report.meta` for debugging.
- Module timeout: 20s each; whole request budget: 90s. Playwright pages closed in `finally`.
- Screenshots saved to `DATA_DIR/screenshots/<domain>.png`, served by a small API route.

## Folder layout

```
app/
  page.tsx                 # search + recent/saved companies
  report/[domain]/page.tsx # dashboard (13 section cards)
  compare/page.tsx         # comparison mode
  api/analyze/route.ts
  api/report/[domain]/route.ts
  api/screenshot/[domain]/route.ts
  api/settings/route.ts    # AI toggle persistence
  api/export/[domain]/route.ts  # json|csv
components/
  ui/*                     # primitives
  metric-value.tsx
  sections/*               # one component per priority section (13)
  charts/*
lib/
  types.ts  schemas.ts  db.ts  cache.ts  crawl/ (playwright.ts, extract.ts)
  modules/  (snapshot.ts, traffic.ts, traffic-sources.ts, products.ts, marketing.ts,
             ads.ts, social.ts, video.ts, seo.ts, competitors.ts, tech.ts,
             customers.ts, ai-analysis.ts, run-module.ts)
  ai/client.ts             # single AI gateway with hard OFF guard + cache
  benchmarks/*.json        # industry benchmark tables (documented sources in file header)
  wappalyzer/*.json        # vendored webappanalyzer rules (trimmed to used categories)
scripts/smoke.ts
data/                      # SQLite + screenshots (Railway volume mounts here) — gitignored
```

## SQLite schema

```sql
analyses(domain TEXT PK, report_json TEXT, created_at INT, updated_at INT);
traffic_snapshots(domain TEXT, taken_at INT, rank INT, est_monthly_visits INT);
ai_cache(key TEXT PK, response TEXT, created_at INT);   -- key = sha256(domain+task+reportHash)
saved_companies(domain TEXT PK, favourite INT, saved_at INT);
settings(key TEXT PK, value TEXT);                       -- ai_mode: 'on'|'off'
```

`lib/db.ts` creates tables on first open. `DATA_DIR` env (default `./data`).

## AI client (the kill-switch)

`lib/ai/client.ts` exports one function `aiComplete(task, prompt)`:
1. Reads ai_mode from settings — if `'off'`, throws `AiDisabledError` (callers convert
   to `unavailable: "AI mode is off"`). This is the ONLY path to any AI API.
2. Checks `ai_cache` → return cached.
3. Calls DeepSeek: `POST https://api.deepseek.com/chat/completions`, model
   `deepseek-chat`, OpenAI-compatible body, key `DEEPSEEK_API_KEY`. 2 retries.
4. Optional fallback to OpenAI ONLY if `OPENAI_API_KEY` set and DeepSeek failed twice.
5. Cache and return. Log token usage to console.

## Deployment (Railway)

- `Dockerfile`: `FROM mcr.microsoft.com/playwright:v1.45.0-jammy` → npm ci → build →
  `next start`. (Image already contains Chromium + deps; set
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0` only if browsers missing — default image has them.)
- Railway volume mounted at `/data`; set `DATA_DIR=/data`.
- Works identically with `npm run dev` locally (no Docker needed if Playwright installed).

## Error-handling rules
- API routes never 500 for data problems — they return a valid Report with unavailable
  metrics. 500 only for true bugs (and even then the UI shows a retry card).
- All external fetches: 10s timeout, one retry, descriptive `unavailable.reason` on failure
  ("OpenPageRank: no API key configured" / "Cloudflare Radar: domain not ranked").
- The UI renders skeletons while loading and every section always renders.
