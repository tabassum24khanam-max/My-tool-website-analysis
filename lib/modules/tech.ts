import type { TechResult, TechItem, CrawlResult } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';

interface TechPattern {
  name: string;
  category: string;
  website?: string;
  patterns: {
    html?: RegExp[];
    scripts?: RegExp[];
    headers?: Record<string, RegExp>;
    cookies?: RegExp[];
    meta?: Record<string, RegExp>;
  };
}

const TECH_PATTERNS: TechPattern[] = [
  // CMS
  { name: 'WordPress', category: 'CMS', patterns: { html: [/wp-content/i, /wp-includes/i], scripts: [/wp-includes/i] } },
  { name: 'Shopify', category: 'CMS', patterns: { html: [/cdn\.shopify\.com/i, /Shopify\.theme/i], scripts: [/cdn\.shopify\.com/i] } },
  { name: 'Wix', category: 'CMS', patterns: { html: [/wix\.com/i, /wixsite\.com/i], scripts: [/static\.wixstatic\.com/i] } },
  { name: 'Squarespace', category: 'CMS', patterns: { html: [/squarespace\.com/i, /sqsp\.com/i], scripts: [/static1\.squarespace\.com/i] } },
  { name: 'Webflow', category: 'CMS', patterns: { html: [/webflow\.com/i], scripts: [/assets\.website-files\.com/i] } },
  { name: 'Ghost', category: 'CMS', patterns: { html: [/ghost\.org/i, /ghost-/i], meta: { generator: /Ghost/i } } },
  { name: 'Drupal', category: 'CMS', patterns: { html: [/drupal\.js/i, /drupal\.settings/i], meta: { generator: /Drupal/i } } },
  { name: 'Joomla', category: 'CMS', patterns: { html: [/\/media\/jui\//i], meta: { generator: /Joomla/i } } },

  // Frameworks
  { name: 'React', category: 'Framework', patterns: { html: [/__next/i, /react-root/i, /_reactRoot/i], scripts: [/react/i] } },
  { name: 'Next.js', category: 'Framework', patterns: { html: [/__next/i, /_next\/static/i], scripts: [/_next\//i] } },
  { name: 'Vue.js', category: 'Framework', patterns: { html: [/v-cloak/i, /data-v-[a-f0-9]/i], scripts: [/vue\.js/i, /vue\.min\.js/i] } },
  { name: 'Nuxt.js', category: 'Framework', patterns: { html: [/__nuxt/i, /_nuxt\//i] } },
  { name: 'Angular', category: 'Framework', patterns: { html: [/ng-version/i, /ng-app/i], scripts: [/angular/i] } },
  { name: 'Svelte', category: 'Framework', patterns: { html: [/svelte-/i], scripts: [/svelte/i] } },
  { name: 'Gatsby', category: 'Framework', patterns: { html: [/___gatsby/i], scripts: [/gatsby/i] } },
  { name: 'Ruby on Rails', category: 'Framework', patterns: { html: [/csrf-token/i], headers: { 'x-powered-by': /Phusion Passenger/i } } },
  { name: 'Laravel', category: 'Framework', patterns: { cookies: [/laravel_session/i, /XSRF-TOKEN/i] } },
  { name: 'Django', category: 'Framework', patterns: { cookies: [/csrftoken/i], html: [/csrfmiddlewaretoken/i] } },
  { name: 'ASP.NET', category: 'Framework', patterns: { headers: { 'x-powered-by': /ASP\.NET/i }, cookies: [/ASP\.NET/i] } },

  // Analytics
  { name: 'Google Analytics', category: 'Analytics', patterns: { scripts: [/google-analytics\.com/i, /googletagmanager\.com/i, /gtag\/js/i] } },
  { name: 'Google Tag Manager', category: 'Analytics', patterns: { scripts: [/googletagmanager\.com\/gtm/i], html: [/GTM-[A-Z0-9]+/i] } },
  { name: 'Hotjar', category: 'Analytics', patterns: { scripts: [/hotjar\.com/i, /static\.hotjar\.com/i] } },
  { name: 'Mixpanel', category: 'Analytics', patterns: { scripts: [/mixpanel\.com/i, /cdn\.mxpnl\.com/i] } },
  { name: 'Segment', category: 'Analytics', patterns: { scripts: [/segment\.com\/analytics/i, /cdn\.segment\.com/i] } },
  { name: 'Amplitude', category: 'Analytics', patterns: { scripts: [/amplitude\.com/i, /cdn\.amplitude\.com/i] } },
  { name: 'Plausible', category: 'Analytics', patterns: { scripts: [/plausible\.io/i] } },
  { name: 'Matomo', category: 'Analytics', patterns: { scripts: [/matomo\.(js|php)/i, /piwik\.(js|php)/i] } },
  { name: 'Microsoft Clarity', category: 'Analytics', patterns: { scripts: [/clarity\.ms/i] } },
  { name: 'Heap', category: 'Analytics', patterns: { scripts: [/heap-\d+\.js/i, /heapanalytics\.com/i] } },
  { name: 'PostHog', category: 'Analytics', patterns: { scripts: [/posthog/i, /us\.posthog\.com/i] } },

  // Payment
  { name: 'Stripe', category: 'Payment', patterns: { scripts: [/js\.stripe\.com/i, /stripe\.js/i] } },
  { name: 'PayPal', category: 'Payment', patterns: { scripts: [/paypal\.com\/sdk/i, /paypalobjects\.com/i] } },
  { name: 'Square', category: 'Payment', patterns: { scripts: [/squareup\.com/i, /square\.site/i] } },
  { name: 'Braintree', category: 'Payment', patterns: { scripts: [/braintreegateway\.com/i, /braintree-web/i] } },
  { name: 'Klarna', category: 'Payment', patterns: { scripts: [/klarna\.com/i] } },
  { name: 'Afterpay', category: 'Payment', patterns: { scripts: [/afterpay\.com/i, /static\.afterpay\.com/i] } },

  // CDN
  { name: 'Cloudflare', category: 'CDN', patterns: { headers: { server: /cloudflare/i }, cookies: [/__cfduid/i, /cf_clearance/i] } },
  { name: 'AWS CloudFront', category: 'CDN', patterns: { headers: { 'x-amz-cf-id': /./i, via: /CloudFront/i } } },
  { name: 'Fastly', category: 'CDN', patterns: { headers: { 'x-served-by': /cache-/i, via: /varnish/i } } },
  { name: 'Akamai', category: 'CDN', patterns: { headers: { 'x-akamai-transformed': /./i } } },
  { name: 'Vercel', category: 'Hosting', patterns: { headers: { 'x-vercel-id': /./i, server: /Vercel/i } } },
  { name: 'Netlify', category: 'Hosting', patterns: { headers: { server: /Netlify/i, 'x-nf-request-id': /./i } } },

  // Chat
  { name: 'Intercom', category: 'Chat', patterns: { scripts: [/intercom\.io/i, /widget\.intercom\.io/i] } },
  { name: 'Drift', category: 'Chat', patterns: { scripts: [/drift\.com/i, /js\.driftt\.com/i] } },
  { name: 'Crisp', category: 'Chat', patterns: { scripts: [/crisp\.chat/i, /client\.crisp\.chat/i] } },
  { name: 'Zendesk', category: 'Chat', patterns: { scripts: [/zopim\.com/i, /zendesk\.com/i, /zdassets\.com/i] } },
  { name: 'HubSpot Chat', category: 'Chat', patterns: { scripts: [/js\.hs-scripts\.com/i, /hubspot\.com/i] } },
  { name: 'Tawk.to', category: 'Chat', patterns: { scripts: [/tawk\.to/i, /embed\.tawk\.to/i] } },
  { name: 'LiveChat', category: 'Chat', patterns: { scripts: [/livechatinc\.com/i] } },

  // Marketing
  { name: 'HubSpot', category: 'Marketing', patterns: { scripts: [/hubspot\.com/i, /hs-scripts\.com/i, /hbspt/i] } },
  { name: 'Mailchimp', category: 'Marketing', patterns: { scripts: [/mailchimp\.com/i, /chimpstatic\.com/i] } },
  { name: 'Klaviyo', category: 'Marketing', patterns: { scripts: [/klaviyo\.com/i, /static\.klaviyo\.com/i] } },
  { name: 'ActiveCampaign', category: 'Marketing', patterns: { scripts: [/activecampaign\.com/i] } },
  { name: 'ConvertKit', category: 'Marketing', patterns: { scripts: [/convertkit\.com/i] } },
  { name: 'OptinMonster', category: 'Marketing', patterns: { scripts: [/optinmonster\.com/i] } },
  { name: 'Privy', category: 'Marketing', patterns: { scripts: [/privy\.com/i] } },
  { name: 'Sumo', category: 'Marketing', patterns: { scripts: [/sumo\.com/i] } },

  // Tracking Pixels
  { name: 'Facebook Pixel', category: 'Tracking', patterns: { scripts: [/connect\.facebook\.net/i, /fbevents\.js/i, /fbq\(/i] } },
  { name: 'Google Ads', category: 'Tracking', patterns: { scripts: [/googleads\.g\.doubleclick/i, /pagead2\.googlesyndication/i, /adservice\.google/i] } },
  { name: 'LinkedIn Insight', category: 'Tracking', patterns: { scripts: [/snap\.licdn\.com/i, /linkedin\.com\/insight/i] } },
  { name: 'Twitter Pixel', category: 'Tracking', patterns: { scripts: [/static\.ads-twitter\.com/i, /analytics\.twitter\.com/i] } },
  { name: 'TikTok Pixel', category: 'Tracking', patterns: { scripts: [/analytics\.tiktok\.com/i, /tiktok\.com\/i18n/i] } },
  { name: 'Pinterest Tag', category: 'Tracking', patterns: { scripts: [/pintrk/i, /s\.pinimg\.com\/ct/i] } },
  { name: 'Snapchat Pixel', category: 'Tracking', patterns: { scripts: [/sc-static\.net\/scevent/i] } },

  // AI
  { name: 'OpenAI', category: 'AI Tools', patterns: { scripts: [/openai\.com/i] } },
  { name: 'ChatBot', category: 'AI Tools', patterns: { scripts: [/chatbot\.com/i] } },

  // JavaScript Libraries
  { name: 'jQuery', category: 'JavaScript', patterns: { scripts: [/jquery[.-]?\d/i, /jquery\.min\.js/i] } },
  { name: 'Bootstrap', category: 'JavaScript', patterns: { html: [/bootstrap/i], scripts: [/bootstrap/i] } },
  { name: 'Tailwind CSS', category: 'JavaScript', patterns: { html: [/class="[^"]*(?:flex|grid|px-|py-|mt-|mb-|text-|bg-|rounded)/i] } },
  { name: 'GSAP', category: 'JavaScript', patterns: { scripts: [/gsap\.min\.js/i, /greensock/i] } },
  { name: 'Lodash', category: 'JavaScript', patterns: { scripts: [/lodash/i] } },
  { name: 'Moment.js', category: 'JavaScript', patterns: { scripts: [/moment\.min\.js/i] } },

  // Security
  { name: 'reCAPTCHA', category: 'Security', patterns: { scripts: [/recaptcha/i, /google\.com\/recaptcha/i] } },
  { name: 'hCaptcha', category: 'Security', patterns: { scripts: [/hcaptcha\.com/i] } },
  { name: 'Cloudflare Turnstile', category: 'Security', patterns: { scripts: [/challenges\.cloudflare\.com/i] } },
];

export async function analyzeTech(crawl: CrawlResult): Promise<TechResult> {
  const detected: TechItem[] = [];
  const seen = new Set<string>();

  const allScripts = crawl.scripts.join(' ');
  const html = crawl.allHtml;
  const headers = crawl.homepage.headers;
  const cookieStr = crawl.cookies.join(' ');

  for (const tech of TECH_PATTERNS) {
    let found = false;

    if (tech.patterns.html) {
      found = tech.patterns.html.some((p) => p.test(html));
    }

    if (!found && tech.patterns.scripts) {
      found = tech.patterns.scripts.some((p) => p.test(allScripts) || p.test(html));
    }

    if (!found && tech.patterns.headers) {
      for (const [header, pattern] of Object.entries(tech.patterns.headers)) {
        const val = headers[header] || headers[header.toLowerCase()];
        if (val && pattern.test(val)) {
          found = true;
          break;
        }
      }
    }

    if (!found && tech.patterns.cookies) {
      found = tech.patterns.cookies.some((p) => p.test(cookieStr));
    }

    if (!found && tech.patterns.meta) {
      const $ = (await import('cheerio')).load(crawl.homepage.html);
      for (const [name, pattern] of Object.entries(tech.patterns.meta)) {
        const content = $(`meta[name="${name}"]`).attr('content') || '';
        if (pattern.test(content)) {
          found = true;
          break;
        }
      }
    }

    if (found && !seen.has(tech.name)) {
      seen.add(tech.name);
      detected.push({
        name: tech.name,
        category: tech.category,
        website: tech.website,
      });
    }
  }

  if (detected.length === 0) {
    return { technologies: unavailable('No technologies detected in page source') };
  }

  return {
    technologies: measured(detected, 'HTML/script/header pattern matching'),
  };
}
