# Website Intelligence Platform — Builder Instructions

This repo is a **Business Intelligence & Competitor Research Platform** (NOT an SEO tool).
A user pastes a company URL and gets a full business breakdown: snapshot, traffic,
products, marketing, ads, social, video, SEO, competitors, tech stack, customer
estimates, and (optionally) AI analysis.

**Read these docs before writing any code. They are the source of truth:**

1. `docs/SPEC.md` — every feature, grouped by priority, with its data source and fallback.
2. `docs/ARCHITECTURE.md` — stack, folder layout, the `Metric` contract, pipeline design.
3. `docs/DATA_SOURCES.md` — the ONLY external APIs/endpoints you may call, with env vars.
4. `docs/BUILD_PLAN.md` — the exact step-by-step build order with acceptance criteria.

## Non-negotiable rules

1. **Never break the dashboard.** Every metric everywhere is a `Metric<T>` object
   (`measured` | `estimated` | `unavailable`). If a data source fails, times out, or has
   no key configured, return `unavailable` with a reason — never throw to the user,
   never render a blank/crashed section.
2. **Module isolation.** Each analysis module runs inside `runModule()` (timeout +
   try/catch). One module failing must never affect the others or the HTTP response.
3. **No invented endpoints.** Only call APIs listed in `docs/DATA_SOURCES.md`. If data
   isn't available from those, the metric is `estimated` (with a documented method) or
   `unavailable`. Do not hallucinate URLs, do not add paid APIs.
4. **AI OFF is the default ("bot mode").** When AI mode is off, ZERO AI API calls may
   happen — enforce this with a single guard in the AI client, not scattered ifs.
   AI ON uses the DeepSeek API directly (OpenAI-compatible). Cache every AI response.
5. **Follow `docs/BUILD_PLAN.md` in order.** Finish and verify each step before starting
   the next. Core features (Phase 1) are never sacrificed for advanced ones.
6. **Pinned dependencies.** Use the exact versions in `docs/ARCHITECTURE.md`. Do not
   upgrade, downgrade, or add heavyweight deps without need.
7. **Verify after every step:** `npm run typecheck && npm run lint && npm run build`
   must pass, and `npm run smoke` (once it exists) must pass. Fix before moving on.
8. **Commit after each completed step** with message `Step N.M: <what>`, and push to
   branch `claude/website-analysis-platform-8wsbgw`.
9. **Estimates are labeled.** Every estimate carries `confidence` and `method`. The UI
   shows a badge: Measured / Estimate / N/A. Never present an estimate as fact.
10. **Keep it one app.** Single Next.js app (UI + API routes), SQLite cache, Playwright
    for screenshots/scraping. Deploys to Railway via the provided Dockerfile.

## Commands

- `npm run dev` — dev server
- `npm run typecheck` — tsc --noEmit
- `npm run lint` — next lint
- `npm run build` — production build
- `npm run smoke` — runs a full analysis of a known domain and asserts response shape
