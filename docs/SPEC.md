# SPEC — Features, data sources, fallbacks

Legend for the **Source** column:
- **CRAWL** — our own crawler (Playwright + cheerio) on the target site (homepage + up to 15 key pages + sitemap sample)
- **API:<name>** — external API from `docs/DATA_SOURCES.md`
- **MODEL** — deterministic estimation model (documented formula + industry benchmarks JSON) → always `estimated` with confidence
- **AI** — DeepSeek (only when AI mode ON) → always labeled as AI-generated
- **N/A** — return `unavailable` with reason (e.g. "requires paid API")

Every value in every section is a `Metric<T>` (see ARCHITECTURE.md). The UI renders
all sections always; missing data shows an "N/A — reason" badge, never breaks.

---

## P1 — Company Snapshot
| Feature | Source | Fallback |
|---|---|---|
| Company name | CRAWL (og:site_name, title, JSON-LD Organization) | domain name |
| Logo | CRAWL (link icons, og:image, JSON-LD logo) | Google favicon service |
| Website screenshot | Playwright screenshot (stored as file, served locally) | unavailable |
| Short description | CRAWL (meta description, og:description) | AI (if ON) |
| Industry / category | MODEL (keyword classifier over page text, categories JSON) | AI (if ON) |
| Business model (SaaS/ecommerce/marketplace/content/services…) | MODEL (signals: cart, pricing page, subscribe, booking) | AI refine |
| Products / services offered | CRAWL (JSON-LD Product, /products, /pricing, nav links) | AI summary |
| Pricing & subscription plans | CRAWL (/pricing, /plans pages; price regex + plan card parsing) | unavailable |
| Free trial / free plan | CRAWL (text signals: "free trial", "start free") | — |
| Countries served | CRAWL (hreflang, currency symbols, shipping/contact pages) | estimated |
| Contact info (emails, phones, HQ address) | CRAWL (contact/about pages, JSON-LD, mailto/tel links) | unavailable |
| Year founded / founder | CRAWL (about page regex "founded in YYYY", JSON-LD) | AI (if ON) / unavailable |
| Employee estimate, funding, valuation, investors, parent co. | N/A (requires paid data) — show unavailable; AI (if ON) may add "public knowledge, verify" note | — |

## P2 — Website Traffic
No free API returns true visitor numbers. We use **real rank data** + a **labeled model**.
| Feature | Source |
|---|---|
| Global/domain rank | API:Tranco + API:CloudflareRadar (measured) |
| Estimated monthly visitors | MODEL: rank→visits power-law curve (documented in code), confidence from rank agreement between sources |
| Daily/weekly/yearly visitors | MODEL: derived from monthly |
| Visitor trend / growth | MEASURED-over-time: we store a snapshot per analysis in SQLite; trend appears after ≥2 runs. Until then: unavailable ("history builds as you re-analyze") |
| Traffic history graph | same self-accumulated history |
| New vs returning, pages/visit, session duration, bounce rate, exit rate | MODEL: industry benchmarks JSON keyed by detected category — low confidence, clearly labeled |
| Top countries | API:CloudflareRadar (if available for domain) else MODEL (site language/currency signals) |
| Device split | MODEL benchmark by category |

## P3 — Traffic Sources
| Feature | Source |
|---|---|
| Organic / paid / direct / social / referral / email / display / affiliate split | MODEL: benchmark-by-category baseline, adjusted by detected signals (has blog→+organic; ad pixels→+paid; big social presence→+social; newsletter→+email). Low confidence, labeled, shown as % + donut chart. |

## P4 — Products & Business Model
| Feature | Source |
|---|---|
| Products, categories, price ranges | CRAWL (JSON-LD, pages) |
| Pricing strategy, upsells, bundles, premium plans | CRAWL signals + MODEL classification |
| Subscription model, free trial | CRAWL signals |
| Target audience, B2B/B2C | MODEL (language signals: "enterprise", "teams", checkout type) + AI refine |
| Estimated AOV | MODEL: median of detected prices; if none → category benchmark |
| Estimated monthly sales / yearly revenue | MODEL: est. visitors × benchmark conversion × AOV. Show the formula in the UI tooltip. |
| Estimated conversion rate | MODEL benchmark by category |
| Confidence score on every estimate | built into `Metric` contract |

## P5 — Marketing Analysis
All CRAWL (deterministic detectors on HTML/JS of crawled pages):
newsletter forms, email-capture inputs, popup libraries (e.g. OptinMonster, Klaviyo,
Privy, Sumo), discount/coupon text & codes, referral programme links, affiliate
programme pages (/affiliates, /partners), lead magnets (ebook/webinar/free-tool links),
landing pages (from sitemap paths /lp/, /landing/), CTAs (button text harvest, top 10),
sales-funnel shape (MODEL from detected pages: traffic→lead magnet→email→offer).
AI (if ON): narrative "marketing strategy breakdown".

## P6 — Advertising
| Feature | Source |
|---|---|
| Advertiser signals (Google Ads, Meta, TikTok, LinkedIn, Pinterest, X pixels) | CRAWL: tracking-pixel detection → "runs/likely runs ads on X" (measured signal) |
| Meta (FB/IG) ad creatives, copy, active campaigns, durations | API:FacebookAdLibrary (needs free token) else unavailable |
| Google/TikTok/LinkedIn/YouTube ad creatives | N/A (no free API) — unavailable with reason |
| Estimated ad spend | MODEL only if ads detected: est. paid traffic × benchmark CPC, very low confidence |

## P7 — Social Media
| Feature | Source |
|---|---|
| Account discovery (TikTok, IG, FB, X, LinkedIn, YouTube, Reddit, Pinterest, Threads, Discord, GitHub) | CRAWL: social links in HTML/footers + JSON-LD sameAs (measured) |
| YouTube: followers, views, posting frequency, avg likes/comments, engagement rate, best content | API:YouTube (measured, real) |
| Other platforms' follower counts / engagement | best-effort public page fetch (may fail) → else unavailable ("platform blocks unauthenticated access") |

## P8 — Video Intelligence (YouTube = full, real data)
From API:YouTube (channel uploads, last 50 videos): most viewed, highest engagement,
avg views/likes/comments, posting frequency, video lengths, upload consistency,
title/hook patterns (deterministic n-gram analysis of titles), topics (keyword
clustering). Shorts detected via duration <60s.
AI (if ON): why videos perform, content/marketing/audience strategy summary from
titles+stats. TikTok/IG Reels: unavailable without API (labeled).

## P9 — SEO
| Feature | Source |
|---|---|
| Domain authority estimate | API:OpenPageRank (measured) |
| Performance / Core Web Vitals / mobile friendliness / best practices / accessibility scores | API:PageSpeed (measured) |
| On-page audit: titles, metas, H1s, canonical, robots.txt, sitemap, internal/external links, indexability | CRAWL (measured) |
| Top on-site keywords/topics | CRAWL: TF-IDF over crawled text (measured, "on-site keywords") |
| Organic/paid keyword rankings, search volume, difficulty, backlinks, referring domains | N/A free — unavailable with reason; adapter interface left ready for a future paid key |
| SSL cert, redirect chains, broken links (sampled) | CRAWL (measured) |

## P10 — Competitor Discovery & Comparison
- AI ON: DeepSeek suggests 3–5 competitors (labeled AI-suggested).
- AI OFF: user adds competitor URLs manually (input on dashboard) — each gets analyzed
  by the same pipeline.
- Comparison mode: side-by-side table + charts of any 2–4 analyzed companies
  (traffic, rank, tech, social, SEO scores, estimated revenue). Works from cached analyses.

## P11 — Technology Stack
CRAWL + open-source Wappalyzer rules (`webappanalyzer` JSON, vendored into repo):
CMS, framework, frontend/backend hints, analytics, payment providers, CDN (headers),
hosting (DNS/headers), chat widgets, marketing/email tools, CRM, security, AI tools,
tracking pixels, JS libraries. All measured.

## P12 — Customer Insights (all MODEL, all labeled)
Customer count, returning %, purchase frequency, AOV, conversion rate, cart
abandonment, CAC estimate — derived from traffic estimate + category benchmarks +
detected pricing. Each shows method tooltip ("est. visitors × 2.1% benchmark conv…").

## P13 — AI Business Analysis (AI ON only)
Business summary, business model explanation, SWOT, revenue explanation, growth
opportunities, strengths/weaknesses, marketing/sales/content strategy breakdowns,
competitive advantages, actionable recommendations. Input = the full deterministic
report JSON (so AI never invents metrics, it explains them). Cached by (domain, report hash).

## AI Mode toggle ("bot mode")
- Header toggle, persisted in SQLite settings + localStorage. **Default OFF.**
- OFF: zero AI calls (hard guard in `lib/ai/client.ts` — throws if called while off).
- ON: DeepSeek `deepseek-chat` via `https://api.deepseek.com` (OpenAI-compatible).
  Responses cached aggressively. No OpenAI unless a `OPENAI_API_KEY` is set AND
  DeepSeek fails twice.

## Dashboard features
Single-page dashboard per analyzed URL with all 13 sections as cards; interactive
charts (Recharts); URL search with history; saved/favourite companies; comparison
mode; export JSON + CSV (PDF via browser print stylesheet); dark mode; mobile
responsive; every metric badge: Measured / Estimate (confidence) / N/A (reason).

## The four questions the finished product must answer at a glance
1. How does this business make money? (P1/P4)
2. How are they getting customers? (P2/P3/P5/P6)
3. What marketing/content strategies work for them? (P5/P7/P8)
4. What can I learn to improve my own business? (P13 + comparison)
