# BUILD PLAN — execute strictly in order

Rules recap: finish a step → run `npm run typecheck && npm run lint && npm run build`
(+ `npm run smoke` from Step 1.2 on) → commit `Step N.M: <what>` → push → next step.
If a step gets hard (API limits, complexity): implement the `unavailable` fallback,
keep the app stable, note it in `docs/PROGRESS.md`, move on. NEVER leave the app broken
between steps. Maintain `docs/PROGRESS.md` (checkbox list of these steps) as you go.

---

## Phase 0 — Skeleton that can never break

**0.1 Scaffold.** `create-next-app` (TS, Tailwind, App Router, ESLint, no src dir),
pin deps per ARCHITECTURE.md, add better-sqlite3, cheerio, playwright, zod, recharts,
lucide-react. Add scripts: `typecheck`, `smoke` (placeholder). `.env.example` already
exists at repo root — wire `DATA_DIR` default `./data`, gitignore `data/`.

**0.2 Contracts.** `lib/types.ts` (Metric, Report with all 13 module result types —
copy field lists from SPEC.md), `lib/schemas.ts` (zod mirrors), `components/metric-value.tsx`
(value + Measured/Estimate/N-A badge + tooltip), `lib/db.ts` (schema from ARCHITECTURE.md).

**0.3 Pipeline skeleton.** `run-module.ts`, all 13 module files returning
all-unavailable results, `/api/analyze` (normalize URL → cache → run modules → store →
return Report), `/api/report/[domain]`. Everything typechecks; API returns a valid
all-unavailable Report for any URL.

**0.4 UI shell.** Home page (URL input, recent list), report page rendering all 13
section cards from the Report (all showing N/A badges), loading skeletons, dark mode
toggle, responsive. Acceptance: paste any URL → complete dashboard of honest N/As,
zero console errors.

## Phase 1 — Core intelligence (must work perfectly)

**1.1 Crawler.** `lib/crawl/`: Playwright homepage render + screenshot + key-page
fetch + sitemap/robots parse per DATA_SOURCES §10. Produces one `CrawlResult`
(pages' HTML, headers, cookies, scripts, JSON-LD blocks, text). Screenshot route.

**1.2 Smoke test.** `scripts/smoke.ts`: analyze `stripe.com`, assert Report parses
with zod, snapshot has ≥5 measured fields, screenshot file exists. Add to CI habit:
run after every subsequent step.

**1.3 Snapshot module** (P1): name, logo, description, contact, founded (RDAP + about
page), pricing/plans/free-trial parsing, countries, industry classifier + business-model
classifier (`lib/benchmarks/categories.json` keyword map).

**1.4 Tech module** (P11): vendor webappanalyzer JSON; detect against HTML/headers/
scripts/cookies; group by category incl. tracking pixels (these feed the ads module).

**1.5 Traffic module** (P2): Tranco + Radar rank (measured), rank→visits power-law
estimate (document curve constants in code comments), engagement benchmarks, top
countries, device split; write `traffic_snapshots` row; trend from history when ≥2 rows.

**1.6 SEO module** (P9): OpenPageRank, on-page audit from CrawlResult, TF-IDF
on-site keywords, SSL/redirect checks; PageSpeed non-blocking with 45s timeout.

**1.7 Social discovery** (P7 part 1): extract all platform links + handles (measured).

**1.8 Charts + dashboard polish**: traffic history line, sources donut (placeholder
until 2.x fills it), engagement gauges, tech grid, SEO scorecards. Acceptance: analyze
3 real sites (a SaaS, an ecommerce store, a blog) — every section stable, every value
badged, `npm run smoke` green.

## Phase 2 — Business & marketing intelligence

**2.1 Products module** (P4): JSON-LD products, price extraction, plans, AOV estimate,
B2B/B2C, audience; revenue model (visitors × conversion benchmark × AOV) with formula
string in `method`.
**2.2 Traffic-sources module** (P3): benchmark baseline + signal adjustments (SPEC P3).
**2.3 Marketing module** (P5): all deterministic detectors from SPEC P5.
**2.4 Ads module** (P6): pixel-based advertiser signals; Meta Ad Library if token; ad
spend estimate gated on detected signals.
**2.5 Video intelligence** (P8): YouTube API client, channel resolve from discovered
links, 50-video stats, frequency/consistency/length/title-pattern analysis. Social
module gains YouTube follower/engagement numbers (measured).
**2.6 Customers module** (P12): derived estimates per SPEC, every one labeled with
formula. Acceptance: ecommerce test site shows products, prices, revenue estimate with
visible formula; YouTube-having site shows real video stats.

## Phase 3 — AI, competitors, comparison, exports

**3.1 AI client + toggle**: `lib/ai/client.ts` with hard OFF guard + cache; header
toggle (persisted via `/api/settings`, default OFF, labeled "AI mode / Bot mode").
**3.2 AI analysis module** (P13): one structured DeepSeek call taking the report JSON,
returning zod-validated JSON for all P13 sections; render as cards; cached.
**3.3 Competitors** (P10): AI-suggested when ON; manual add always; each competitor
analyzed via existing pipeline.
**3.4 Comparison mode**: `/compare` — pick 2–4 cached analyses, side-by-side table +
bar charts.
**3.5 Saved companies + history + exports**: favourite/save, search history, export
JSON/CSV, print stylesheet for PDF.
**3.6 Deployment**: Dockerfile per ARCHITECTURE.md, `railway.json`/docs in README,
volume `DATA_DIR=/data`. Verify `docker build` succeeds. Final full smoke on 3 sites.

## Definition of done (final checklist)
- [ ] All 13 sections render for any URL, no crashes, no blank sections
- [ ] Every displayed value is badged Measured / Estimate(+confidence) / N-A(+reason)
- [ ] AI toggle OFF ⇒ zero AI network calls (verify: no fetch to api.deepseek.com in logs)
- [ ] AI toggle ON ⇒ P13 cards fill, second run hits cache
- [ ] Works with NO env keys at all (more N/As, still stable)
- [ ] `npm run build` + `npm run smoke` green; Docker image builds
- [ ] The four questions (SPEC end) answerable from one screen
