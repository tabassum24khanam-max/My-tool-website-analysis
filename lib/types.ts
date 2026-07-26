export type MetricMeasured<T = number | string> = {
  status: 'measured';
  value: T;
  source: string;
};

export type MetricEstimated<T = number | string> = {
  status: 'estimated';
  value: T;
  confidence: 'low' | 'medium' | 'high';
  method: string;
};

export type MetricUnavailable = {
  status: 'unavailable';
  reason: string;
};

export type Metric<T = number | string> =
  | MetricMeasured<T>
  | MetricEstimated<T>
  | MetricUnavailable;

export function measured<T>(value: T, source: string): MetricMeasured<T> {
  return { status: 'measured', value, source };
}

export function estimated<T>(
  value: T,
  confidence: 'low' | 'medium' | 'high',
  method: string
): MetricEstimated<T> {
  return { status: 'estimated', value, confidence, method };
}

export function unavailable(reason: string): MetricUnavailable {
  return { status: 'unavailable', reason };
}

export function metricValue<T>(m: Metric<T>): T | null {
  return m.status === 'unavailable' ? null : m.value;
}

// --- Module result types ---

export interface SnapshotResult {
  companyName: Metric<string>;
  logoUrl: Metric<string>;
  screenshotPath: Metric<string>;
  description: Metric<string>;
  industry: Metric<string>;
  businessModel: Metric<string>;
  products: Metric<string[]>;
  pricing: Metric<string>;
  subscriptionPlans: Metric<string[]>;
  freeTrial: Metric<boolean>;
  countriesServed: Metric<string[]>;
  contactEmails: Metric<string[]>;
  contactPhones: Metric<string[]>;
  headquarters: Metric<string>;
  yearFounded: Metric<string>;
  founder: Metric<string>;
  employeeEstimate: Metric<string>;
}

export interface TrafficResult {
  globalRank: Metric<number>;
  estimatedMonthlyVisits: Metric<number>;
  dailyVisits: Metric<number>;
  weeklyVisits: Metric<number>;
  yearlyVisits: Metric<number>;
  visitTrend: Metric<string>;
  growthPercentage: Metric<number>;
  newVsReturning: Metric<{ new: number; returning: number }>;
  pagesPerVisit: Metric<number>;
  avgSessionDuration: Metric<string>;
  bounceRate: Metric<number>;
  topCountries: Metric<Array<{ country: string; share: number }>>;
  deviceSplit: Metric<{ desktop: number; mobile: number; tablet: number }>;
}

export interface TrafficSourcesResult {
  sources: Metric<Array<{ source: string; percentage: number }>>;
}

export interface ProductsResult {
  products: Metric<Array<{ name: string; price?: string; category?: string }>>;
  categories: Metric<string[]>;
  pricingStrategy: Metric<string>;
  hasSubscription: Metric<boolean>;
  hasFreeTrial: Metric<boolean>;
  targetAudience: Metric<string>;
  customerType: Metric<string>;
  estimatedAOV: Metric<number>;
  estimatedMonthlySales: Metric<number>;
  estimatedYearlyRevenue: Metric<number>;
  estimatedConversionRate: Metric<number>;
}

export interface MarketingResult {
  hasNewsletter: Metric<boolean>;
  hasPopups: Metric<boolean>;
  hasDiscounts: Metric<boolean>;
  couponCodes: Metric<string[]>;
  hasReferralProgram: Metric<boolean>;
  hasAffiliateProgram: Metric<boolean>;
  leadMagnets: Metric<string[]>;
  landingPages: Metric<string[]>;
  ctas: Metric<string[]>;
  emailCapture: Metric<boolean>;
  marketingStrategy: Metric<string>;
  salesFunnel: Metric<string>;
}

export interface AdsResult {
  detectedPixels: Metric<string[]>;
  googleAds: Metric<boolean>;
  facebookAds: Metric<boolean>;
  tiktokAds: Metric<boolean>;
  linkedinAds: Metric<boolean>;
  pinterestAds: Metric<boolean>;
  twitterAds: Metric<boolean>;
  metaAdLibrary: Metric<
    Array<{
      body: string;
      startDate: string;
      endDate?: string;
      platforms: string[];
    }>
  >;
  estimatedAdSpend: Metric<number>;
}

export interface SocialAccount {
  platform: string;
  url: string;
  handle: string;
  followers: Metric<number>;
  engagementRate: Metric<number>;
  postingFrequency: Metric<string>;
  avgLikes: Metric<number>;
  avgComments: Metric<number>;
  avgViews: Metric<number>;
}

export interface SocialResult {
  accounts: Metric<SocialAccount[]>;
}

export interface VideoData {
  title: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  duration: string;
  thumbnailUrl: string;
}

export interface VideoResult {
  channelName: Metric<string>;
  subscribers: Metric<number>;
  totalVideos: Metric<number>;
  mostViewed: Metric<VideoData[]>;
  highestEngagement: Metric<VideoData[]>;
  avgViews: Metric<number>;
  avgLikes: Metric<number>;
  avgComments: Metric<number>;
  postingFrequency: Metric<string>;
  avgVideoLength: Metric<string>;
  uploadConsistency: Metric<string>;
  commonTopics: Metric<string[]>;
  commonHooks: Metric<string[]>;
  aiContentStrategy: Metric<string>;
  aiMarketingStrategy: Metric<string>;
  aiAudienceStrategy: Metric<string>;
}

export interface SeoResult {
  domainAuthority: Metric<number>;
  performanceScore: Metric<number>;
  seoScore: Metric<number>;
  accessibilityScore: Metric<number>;
  bestPracticesScore: Metric<number>;
  coreWebVitals: Metric<{
    lcp: number;
    fid: number;
    cls: number;
  }>;
  sslCert: Metric<boolean>;
  hasRobotsTxt: Metric<boolean>;
  hasSitemap: Metric<boolean>;
  indexablePages: Metric<number>;
  onSiteKeywords: Metric<Array<{ keyword: string; frequency: number }>>;
  titleTag: Metric<string>;
  metaDescription: Metric<string>;
  h1Tags: Metric<string[]>;
  canonicalUrl: Metric<string>;
  internalLinks: Metric<number>;
  externalLinks: Metric<number>;
  brokenLinks: Metric<string[]>;
  mobileFriendly: Metric<boolean>;
}

export interface CompetitorEntry {
  domain: string;
  traffic: Metric<number>;
  rank: Metric<number>;
  techCount: Metric<number>;
}

export interface CompetitorsResult {
  competitors: Metric<CompetitorEntry[]>;
  source: Metric<string>;
}

export interface TechItem {
  name: string;
  category: string;
  website?: string;
  icon?: string;
}

export interface TechResult {
  technologies: Metric<TechItem[]>;
}

export interface CustomersResult {
  estimatedCustomers: Metric<number>;
  returningRate: Metric<number>;
  purchaseFrequency: Metric<string>;
  avgOrderValue: Metric<number>;
  conversionRate: Metric<number>;
  cartAbandonment: Metric<number>;
  customerAcquisitionCost: Metric<number>;
}

export interface AiAnalysisResult {
  businessSummary: Metric<string>;
  businessModel: Metric<string>;
  swot: Metric<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }>;
  revenueExplanation: Metric<string>;
  growthOpportunities: Metric<string[]>;
  strengths: Metric<string[]>;
  weaknesses: Metric<string[]>;
  marketingStrategy: Metric<string>;
  salesStrategy: Metric<string>;
  contentStrategy: Metric<string>;
  competitiveAdvantages: Metric<string[]>;
  recommendations: Metric<string[]>;
}

export interface ModuleMeta {
  durationMs: number;
  error?: string;
}

export interface Report {
  domain: string;
  url: string;
  analyzedAt: string;
  snapshot: SnapshotResult;
  traffic: TrafficResult;
  trafficSources: TrafficSourcesResult;
  products: ProductsResult;
  marketing: MarketingResult;
  ads: AdsResult;
  social: SocialResult;
  video: VideoResult;
  seo: SeoResult;
  competitors: CompetitorsResult;
  tech: TechResult;
  customers: CustomersResult;
  aiAnalysis: AiAnalysisResult;
  meta: Record<string, ModuleMeta>;
}

// Crawl types
export interface CrawlPage {
  url: string;
  html: string;
  statusCode: number;
  headers: Record<string, string>;
}

export interface CrawlResult {
  domain: string;
  url: string;
  homepage: CrawlPage;
  pages: CrawlPage[];
  screenshotPath: string | null;
  robotsTxt: string | null;
  sitemapUrls: string[];
  jsonLd: Record<string, unknown>[];
  scripts: string[];
  cookies: string[];
  allHtml: string;
}
