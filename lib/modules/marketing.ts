import type { MarketingResult, CrawlResult } from '@/lib/types';
import { measured, estimated, unavailable } from '@/lib/types';
import * as cheerio from 'cheerio';

function detectNewsletterForms($: cheerio.CheerioAPI, html: string): boolean {
  const formSignals = $('form').toArray().some((el) => {
    const text = $(el).text().toLowerCase();
    const action = $(el).attr('action') || '';
    return text.includes('newsletter') || text.includes('subscribe') ||
      text.includes('email') || action.includes('subscribe') ||
      action.includes('mailchimp') || action.includes('convertkit');
  });

  return formSignals || html.toLowerCase().includes('newsletter');
}

function detectPopups(scripts: string[], html: string): boolean {
  const lower = html.toLowerCase();
  const scriptStr = scripts.join(' ').toLowerCase();

  return scriptStr.includes('optinmonster') || scriptStr.includes('privy') ||
    scriptStr.includes('sumo') || scriptStr.includes('popup') ||
    lower.includes('exit-intent') || lower.includes('modal-overlay') ||
    lower.includes('popup-overlay') || lower.includes('data-popup');
}

// Ordinary sentences like "get a discount code for your order" contain the
// keyword immediately followed by a common word, which a case-insensitive
// match on the whole pattern was capturing as if it were the code itself.
const CODE_STOPWORDS = new Set([
  'FOR', 'YOUR', 'NOW', 'HERE', 'BELOW', 'TODAY', 'ABOVE', 'THIS', 'THAT',
  'THE', 'AND', 'OUR', 'YOU', 'ANY', 'ALL', 'NEW', 'GET', 'USE', 'AT',
]);

function detectDiscounts(html: string): { hasDiscounts: boolean; codes: string[] } {
  const lower = html.toLowerCase();
  const hasDiscounts = lower.includes('discount') || lower.includes('% off') ||
    lower.includes('sale') || lower.includes('coupon') || lower.includes('promo code');

  const codes: string[] = [];
  // The keyword (code/coupon/promo) is matched case-insensitively via explicit
  // casing alternatives, but the captured code itself is matched without the
  // /i/ flag so "code for" can no longer capture the lowercase word "for" as
  // if it were an actual all-caps coupon code.
  const codePattern = /(?:[Cc][Oo][Dd][Ee]|[Cc][Oo][Uu][Pp][Oo][Nn]|[Pp][Rr][Oo][Mm][Oo])[:\s]+["']?([A-Z][A-Z0-9]{2,19})["']?/g;
  let match: RegExpExecArray | null;
  while ((match = codePattern.exec(html)) !== null) {
    const code = match[1];
    if (!CODE_STOPWORDS.has(code)) codes.push(code);
  }

  return { hasDiscounts, codes: [...new Set(codes)] };
}

function detectLeadMagnets(html: string): string[] {
  const lower = html.toLowerCase();
  const magnets: string[] = [];

  if (lower.includes('ebook') || lower.includes('e-book')) magnets.push('eBook');
  if (lower.includes('webinar')) magnets.push('Webinar');
  if (lower.includes('white paper') || lower.includes('whitepaper')) magnets.push('White Paper');
  if (lower.includes('free guide') || lower.includes('download guide')) magnets.push('Free Guide');
  if (lower.includes('free tool') || lower.includes('free calculator')) magnets.push('Free Tool');
  if (lower.includes('checklist')) magnets.push('Checklist');
  if (lower.includes('template') && lower.includes('free')) magnets.push('Free Template');
  if (lower.includes('case study') || lower.includes('case-study')) magnets.push('Case Study');
  if (lower.includes('demo') || lower.includes('book a demo')) magnets.push('Demo');

  return magnets;
}

function extractCTAs($: cheerio.CheerioAPI): string[] {
  const ctas: string[] = [];
  const seen = new Set<string>();

  $('a, button').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length >= 3 && text.length <= 40) {
      const lower = text.toLowerCase();
      const isCtaLike = lower.includes('start') || lower.includes('try') ||
        lower.includes('sign up') || lower.includes('get') ||
        lower.includes('buy') || lower.includes('book') ||
        lower.includes('contact') || lower.includes('download') ||
        lower.includes('subscribe') || lower.includes('learn more') ||
        lower.includes('request') || lower.includes('free') ||
        lower.includes('join') || lower.includes('register') ||
        lower.includes('shop') || lower.includes('order');

      if (isCtaLike && !seen.has(lower)) {
        seen.add(lower);
        ctas.push(text);
      }
    }
  });

  return ctas.slice(0, 15);
}

function detectLandingPages(sitemapUrls: string[]): string[] {
  return sitemapUrls
    .filter((u) =>
      u.includes('/lp/') || u.includes('/landing/') || u.includes('/offer/') ||
      u.includes('/promo/') || u.includes('/go/') || u.includes('/try/')
    )
    .slice(0, 10);
}

function describeSalesFunnel(signals: {
  hasBlog: boolean;
  hasNewsletter: boolean;
  hasLeadMagnets: boolean;
  hasFreeTrial: boolean;
  hasPricing: boolean;
  hasCheckout: boolean;
}): string {
  const stages: string[] = [];

  if (signals.hasBlog) stages.push('Content (blog) attracts organic traffic');
  else stages.push('Traffic from ads/direct/social');

  if (signals.hasLeadMagnets || signals.hasNewsletter) {
    stages.push('Lead capture via ' +
      [signals.hasLeadMagnets ? 'lead magnets' : '', signals.hasNewsletter ? 'newsletter' : '']
        .filter(Boolean).join(' + '));
  }

  if (signals.hasFreeTrial) stages.push('Free trial / freemium conversion');
  if (signals.hasPricing) stages.push('Pricing page for self-serve purchase');
  if (signals.hasCheckout) stages.push('Direct checkout / purchase');

  if (stages.length <= 1) return 'Simple: direct traffic → conversion';
  return stages.join(' → ');
}

export async function analyzeMarketing(crawl: CrawlResult): Promise<MarketingResult> {
  const $ = cheerio.load(crawl.homepage.html);
  const allHtml = crawl.allHtml;
  const lower = allHtml.toLowerCase();

  const hasNewsletter = detectNewsletterForms($, allHtml);
  const hasPopups = detectPopups(crawl.scripts, allHtml);
  const { hasDiscounts, codes } = detectDiscounts(allHtml);
  const leadMagnets = detectLeadMagnets(allHtml);
  const ctas = extractCTAs($);
  const landingPages = detectLandingPages(crawl.sitemapUrls);

  const hasReferralProgram = lower.includes('referral program') ||
    lower.includes('refer a friend') || lower.includes('referral bonus');
  const hasAffiliateProgram = lower.includes('affiliate program') ||
    lower.includes('/affiliates') || lower.includes('/partners');
  const hasEmailCapture = hasNewsletter || $('input[type="email"]').length > 0;

  const hasBlog = crawl.pages.some((p) => p.url.includes('blog'));
  const hasFreeTrial = lower.includes('free trial') || lower.includes('start free');
  const hasPricing = crawl.pages.some((p) => p.url.includes('pricing'));
  const hasCheckout = lower.includes('checkout') || lower.includes('add to cart');

  const salesFunnel = describeSalesFunnel({
    hasBlog, hasNewsletter, hasLeadMagnets: leadMagnets.length > 0,
    hasFreeTrial, hasPricing, hasCheckout,
  });

  const strategies: string[] = [];
  if (hasBlog) strategies.push('Content marketing (blog)');
  if (hasNewsletter) strategies.push('Email marketing');
  if (hasPopups) strategies.push('Popup/modal engagement');
  if (hasDiscounts) strategies.push('Promotional pricing');
  if (hasReferralProgram) strategies.push('Referral programme');
  if (hasAffiliateProgram) strategies.push('Affiliate programme');
  if (leadMagnets.length > 0) strategies.push('Lead magnet funnels');

  return {
    hasNewsletter: measured(hasNewsletter, 'Form and text pattern detection'),
    hasPopups: measured(hasPopups, 'Script and class pattern detection (OptinMonster, Privy, Sumo, popup classes)'),
    hasDiscounts: measured(hasDiscounts, 'Discount/sale/coupon text detection'),
    couponCodes: codes.length > 0
      ? measured(codes, 'Coupon code pattern extraction')
      : unavailable('No coupon codes found in page content'),
    hasReferralProgram: measured(hasReferralProgram, 'Text pattern detection'),
    hasAffiliateProgram: measured(hasAffiliateProgram, 'URL and text pattern detection'),
    leadMagnets: leadMagnets.length > 0
      ? measured(leadMagnets, 'Content type detection (ebook, webinar, guide, template, etc.)')
      : unavailable('No lead magnets detected'),
    landingPages: landingPages.length > 0
      ? measured(landingPages, 'Sitemap URL path analysis (/lp/, /landing/, /offer/)')
      : unavailable('No dedicated landing pages found in sitemap'),
    ctas: ctas.length > 0
      ? measured(ctas, 'Button and link text extraction with CTA keyword matching')
      : unavailable('No CTAs detected'),
    emailCapture: measured(hasEmailCapture, 'Email input field and newsletter form detection'),
    marketingStrategy: strategies.length > 0
      ? estimated(strategies.join('; '), 'medium', 'Composite analysis of detected marketing signals')
      : unavailable('Not enough signals to determine marketing strategy'),
    salesFunnel: estimated(salesFunnel, 'medium', 'Funnel stage reconstruction from detected page types and conversion elements'),
  };
}
