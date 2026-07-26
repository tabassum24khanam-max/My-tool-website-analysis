import { unavailable } from '@/lib/types';
import type {
  SnapshotResult,
  TrafficResult,
  TrafficSourcesResult,
  ProductsResult,
  MarketingResult,
  AdsResult,
  SocialResult,
  VideoResult,
  SeoResult,
  CompetitorsResult,
  TechResult,
  CustomersResult,
  AiAnalysisResult,
} from '@/lib/types';

const na = (reason = 'Not yet analyzed') => unavailable(reason);

export const defaultSnapshot: SnapshotResult = {
  companyName: na(),
  logoUrl: na(),
  screenshotPath: na(),
  description: na(),
  industry: na(),
  businessModel: na(),
  products: na(),
  pricing: na(),
  subscriptionPlans: na(),
  freeTrial: na(),
  countriesServed: na(),
  contactEmails: na(),
  contactPhones: na(),
  headquarters: na(),
  yearFounded: na(),
  founder: na(),
  employeeEstimate: na(),
};

export const defaultTraffic: TrafficResult = {
  globalRank: na(),
  estimatedMonthlyVisits: na(),
  dailyVisits: na(),
  weeklyVisits: na(),
  yearlyVisits: na(),
  visitTrend: na(),
  growthPercentage: na(),
  newVsReturning: na(),
  pagesPerVisit: na(),
  avgSessionDuration: na(),
  bounceRate: na(),
  topCountries: na(),
  deviceSplit: na(),
};

export const defaultTrafficSources: TrafficSourcesResult = {
  sources: na(),
};

export const defaultProducts: ProductsResult = {
  products: na(),
  categories: na(),
  pricingStrategy: na(),
  hasSubscription: na(),
  hasFreeTrial: na(),
  targetAudience: na(),
  customerType: na(),
  estimatedAOV: na(),
  estimatedMonthlySales: na(),
  estimatedYearlyRevenue: na(),
  estimatedConversionRate: na(),
};

export const defaultMarketing: MarketingResult = {
  hasNewsletter: na(),
  hasPopups: na(),
  hasDiscounts: na(),
  couponCodes: na(),
  hasReferralProgram: na(),
  hasAffiliateProgram: na(),
  leadMagnets: na(),
  landingPages: na(),
  ctas: na(),
  emailCapture: na(),
  marketingStrategy: na(),
  salesFunnel: na(),
};

export const defaultAds: AdsResult = {
  detectedPixels: na(),
  googleAds: na(),
  facebookAds: na(),
  tiktokAds: na(),
  linkedinAds: na(),
  pinterestAds: na(),
  twitterAds: na(),
  metaAdLibrary: na(),
  estimatedAdSpend: na(),
};

export const defaultSocial: SocialResult = {
  accounts: na(),
};

export const defaultVideo: VideoResult = {
  channelName: na(),
  subscribers: na(),
  totalVideos: na(),
  mostViewed: na(),
  highestEngagement: na(),
  avgViews: na(),
  avgLikes: na(),
  avgComments: na(),
  postingFrequency: na(),
  avgVideoLength: na(),
  uploadConsistency: na(),
  commonTopics: na(),
  commonHooks: na(),
  aiContentStrategy: na(),
  aiMarketingStrategy: na(),
  aiAudienceStrategy: na(),
};

export const defaultSeo: SeoResult = {
  domainAuthority: na(),
  performanceScore: na(),
  seoScore: na(),
  accessibilityScore: na(),
  bestPracticesScore: na(),
  coreWebVitals: na(),
  sslCert: na(),
  hasRobotsTxt: na(),
  hasSitemap: na(),
  indexablePages: na(),
  onSiteKeywords: na(),
  titleTag: na(),
  metaDescription: na(),
  h1Tags: na(),
  canonicalUrl: na(),
  internalLinks: na(),
  externalLinks: na(),
  brokenLinks: na(),
  mobileFriendly: na(),
};

export const defaultCompetitors: CompetitorsResult = {
  competitors: na(),
  source: na(),
};

export const defaultTech: TechResult = {
  technologies: na(),
};

export const defaultCustomers: CustomersResult = {
  estimatedCustomers: na(),
  returningRate: na(),
  purchaseFrequency: na(),
  avgOrderValue: na(),
  conversionRate: na(),
  cartAbandonment: na(),
  customerAcquisitionCost: na(),
};

export const defaultAiAnalysis: AiAnalysisResult = {
  businessSummary: na('AI mode is off'),
  businessModel: na('AI mode is off'),
  swot: na('AI mode is off'),
  revenueExplanation: na('AI mode is off'),
  growthOpportunities: na('AI mode is off'),
  strengths: na('AI mode is off'),
  weaknesses: na('AI mode is off'),
  marketingStrategy: na('AI mode is off'),
  salesStrategy: na('AI mode is off'),
  contentStrategy: na('AI mode is off'),
  competitiveAdvantages: na('AI mode is off'),
  recommendations: na('AI mode is off'),
};
