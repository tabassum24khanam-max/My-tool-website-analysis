# DATA SOURCES — the only external endpoints allowed

Rules: 10s timeout + 1 retry on every call. Missing key or failed call →
`unavailable` with a clear reason. NEVER call any endpoint not on this list.
All keys are free-tier. All go in `.env` (see `.env.example`).

## 1. Tranco (traffic rank) — no key
`GET https://tranco-list.eu/api/ranks/domain/{domain}`
Returns recent daily ranks. Use latest rank; also gives us a small rank history.

## 2. Cloudflare Radar (rank + top countries) — free key
`GET https://api.cloudflare.com/client/v4/radar/ranking/domain/{domain}`
Header: `Authorization: Bearer $CLOUDFLARE_RADAR_TOKEN`
Key: free Cloudflare account → My Profile → API Tokens → template "Read Radar".
Only top ~1M domains are ranked; smaller sites → unavailable (normal, say so).

## 3. Open PageRank (domain authority 0–10) — free key
`GET https://openpagerank.com/api/v1.0/getPageRank?domains[]={domain}`
Header: `API-OPR: $OPENPAGERANK_API_KEY`
Key: free signup at openpagerank.com.

## 4. Google PageSpeed Insights (performance, CWV, a11y, SEO score) — key optional
`GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&key=$PAGESPEED_API_KEY`
Works keyless at very low volume; key (free, Google Cloud console, "PageSpeed Insights
API") raises quota. Slow endpoint — give it a 45s timeout, run non-blocking (section
fills in when ready; report stores result on completion).

## 5. YouTube Data API v3 — free key (this powers Video Intelligence)
Key: Google Cloud console → enable "YouTube Data API v3" → API key. 10k units/day free.
- Resolve channel from URL/handle: `GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle={handle}&key=...` (or `id=` for /channel/UC…)
- Uploads: `GET .../playlistItems?part=contentDetails&playlistId={uploadsId}&maxResults=50`
- Video stats: `GET .../videos?part=snippet,statistics,contentDetails&id={ids}` (batch 50)

## 6. Meta Ad Library — free token, OPTIONAL (skip gracefully)
`GET https://graph.facebook.com/v19.0/ads_archive?search_page_ids={pageId}&ad_reached_countries=['US']&fields=ad_creative_bodies,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms&access_token=$FB_AD_LIBRARY_TOKEN`
Token: developers.facebook.com app → Graph API token. Note: full non-political ad data
is limited to EU reach in many cases; treat any error as `unavailable` ("Meta Ad
Library access not configured/permitted"). The pixel-based "advertiser signals"
detection works without this and is the primary source for P6.

## 7. Google favicon service (logo fallback) — no key
`https://www.google.com/s2/favicons?domain={domain}&sz=128`

## 8. RDAP (domain age/registration) — no key
`GET https://rdap.org/domain/{domain}` → registration date → "domain since YYYY".

## 9. DeepSeek (AI mode ON only) — user's key
`POST https://api.deepseek.com/chat/completions` — OpenAI-compatible.
Model `deepseek-chat`. Key: `DEEPSEEK_API_KEY`. Only ever called through
`lib/ai/client.ts` (see ARCHITECTURE.md kill-switch).
Optional last-resort fallback: OpenAI `gpt-4o-mini` if `OPENAI_API_KEY` set.

## 10. Target website itself (CRAWL)
Playwright with a realistic desktop UA; respect robots.txt disallow for crawled
subpages (homepage + screenshot always allowed as a browser-equivalent visit);
max 15 pages, 10s/page, total crawl budget 45s. Also plain-fetch of
`/robots.txt`, `/sitemap.xml`.

## 11. Vendored data (in-repo, no network)
- `lib/wappalyzer/*.json` — tech fingerprints from the open-source `enthec/webappanalyzer`
  project (download once during development, commit to repo, keep only needed categories).
- `lib/benchmarks/*.json` — industry benchmark tables (bounce rate, session duration,
  conversion rate, device split, traffic-source mix by category). Values from published
  aggregate reports; each file header comments its source. These power MODEL estimates.

## Explicitly NOT available for free (always `unavailable`, never faked as measured)
True visitor counts (SimilarWeb), keyword rankings/search volume (Semrush/Ahrefs/
DataForSEO), backlink indexes, TikTok/Instagram APIs, Google Ads transparency API,
employee counts/funding (Crunchbase/LinkedIn). Code an adapter interface
(`lib/modules/adapters.ts`) so a paid key could be plugged in later.
