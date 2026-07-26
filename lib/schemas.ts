import { z } from 'zod';

const metricSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.discriminatedUnion('status', [
    z.object({
      status: z.literal('measured'),
      value: valueSchema,
      source: z.string(),
    }),
    z.object({
      status: z.literal('estimated'),
      value: valueSchema,
      confidence: z.enum(['low', 'medium', 'high']),
      method: z.string(),
    }),
    z.object({
      status: z.literal('unavailable'),
      reason: z.string(),
    }),
  ]);

const snapshotSchema = z.object({
  companyName: metricSchema(z.string()),
  logoUrl: metricSchema(z.string()),
  screenshotPath: metricSchema(z.string()),
  description: metricSchema(z.string()),
  industry: metricSchema(z.string()),
  businessModel: metricSchema(z.string()),
  products: metricSchema(z.array(z.string())),
  pricing: metricSchema(z.string()),
  subscriptionPlans: metricSchema(z.array(z.string())),
  freeTrial: metricSchema(z.boolean()),
  countriesServed: metricSchema(z.array(z.string())),
  contactEmails: metricSchema(z.array(z.string())),
  contactPhones: metricSchema(z.array(z.string())),
  headquarters: metricSchema(z.string()),
  yearFounded: metricSchema(z.string()),
  founder: metricSchema(z.string()),
  employeeEstimate: metricSchema(z.string()),
});

const trafficSchema = z.object({
  globalRank: metricSchema(z.number()),
  estimatedMonthlyVisits: metricSchema(z.number()),
  dailyVisits: metricSchema(z.number()),
  weeklyVisits: metricSchema(z.number()),
  yearlyVisits: metricSchema(z.number()),
  visitTrend: metricSchema(z.string()),
  growthPercentage: metricSchema(z.number()),
  newVsReturning: metricSchema(z.object({ new: z.number(), returning: z.number() })),
  pagesPerVisit: metricSchema(z.number()),
  avgSessionDuration: metricSchema(z.string()),
  bounceRate: metricSchema(z.number()),
  topCountries: metricSchema(z.array(z.object({ country: z.string(), share: z.number() }))),
  deviceSplit: metricSchema(z.object({ desktop: z.number(), mobile: z.number(), tablet: z.number() })),
});

const trafficSourcesSchema = z.object({
  sources: metricSchema(z.array(z.object({ source: z.string(), percentage: z.number() }))),
});

const productsSchema = z.object({
  products: metricSchema(z.array(z.object({ name: z.string(), price: z.string().optional(), category: z.string().optional() }))),
  categories: metricSchema(z.array(z.string())),
  pricingStrategy: metricSchema(z.string()),
  hasSubscription: metricSchema(z.boolean()),
  hasFreeTrial: metricSchema(z.boolean()),
  targetAudience: metricSchema(z.string()),
  customerType: metricSchema(z.string()),
  estimatedAOV: metricSchema(z.number()),
  estimatedMonthlySales: metricSchema(z.number()),
  estimatedYearlyRevenue: metricSchema(z.number()),
  estimatedConversionRate: metricSchema(z.number()),
});

const marketingSchema = z.object({
  hasNewsletter: metricSchema(z.boolean()),
  hasPopups: metricSchema(z.boolean()),
  hasDiscounts: metricSchema(z.boolean()),
  couponCodes: metricSchema(z.array(z.string())),
  hasReferralProgram: metricSchema(z.boolean()),
  hasAffiliateProgram: metricSchema(z.boolean()),
  leadMagnets: metricSchema(z.array(z.string())),
  landingPages: metricSchema(z.array(z.string())),
  ctas: metricSchema(z.array(z.string())),
  emailCapture: metricSchema(z.boolean()),
  marketingStrategy: metricSchema(z.string()),
  salesFunnel: metricSchema(z.string()),
});

const adsSchema = z.object({
  detectedPixels: metricSchema(z.array(z.string())),
  googleAds: metricSchema(z.boolean()),
  facebookAds: metricSchema(z.boolean()),
  tiktokAds: metricSchema(z.boolean()),
  linkedinAds: metricSchema(z.boolean()),
  pinterestAds: metricSchema(z.boolean()),
  twitterAds: metricSchema(z.boolean()),
  metaAdLibrary: metricSchema(z.array(z.object({
    body: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    platforms: z.array(z.string()),
  }))),
  estimatedAdSpend: metricSchema(z.number()),
});

const socialAccountSchema = z.object({
  platform: z.string(),
  url: z.string(),
  handle: z.string(),
  followers: metricSchema(z.number()),
  engagementRate: metricSchema(z.number()),
  postingFrequency: metricSchema(z.string()),
  avgLikes: metricSchema(z.number()),
  avgComments: metricSchema(z.number()),
  avgViews: metricSchema(z.number()),
});

const socialSchema = z.object({
  accounts: metricSchema(z.array(socialAccountSchema)),
});

const videoDataSchema = z.object({
  title: z.string(),
  url: z.string(),
  views: z.number(),
  likes: z.number(),
  comments: z.number(),
  publishedAt: z.string(),
  duration: z.string(),
  thumbnailUrl: z.string(),
});

const videoSchema = z.object({
  channelName: metricSchema(z.string()),
  subscribers: metricSchema(z.number()),
  totalVideos: metricSchema(z.number()),
  mostViewed: metricSchema(z.array(videoDataSchema)),
  highestEngagement: metricSchema(z.array(videoDataSchema)),
  avgViews: metricSchema(z.number()),
  avgLikes: metricSchema(z.number()),
  avgComments: metricSchema(z.number()),
  postingFrequency: metricSchema(z.string()),
  avgVideoLength: metricSchema(z.string()),
  uploadConsistency: metricSchema(z.string()),
  commonTopics: metricSchema(z.array(z.string())),
  commonHooks: metricSchema(z.array(z.string())),
  aiContentStrategy: metricSchema(z.string()),
  aiMarketingStrategy: metricSchema(z.string()),
  aiAudienceStrategy: metricSchema(z.string()),
});

const seoSchema = z.object({
  domainAuthority: metricSchema(z.number()),
  performanceScore: metricSchema(z.number()),
  seoScore: metricSchema(z.number()),
  accessibilityScore: metricSchema(z.number()),
  bestPracticesScore: metricSchema(z.number()),
  coreWebVitals: metricSchema(z.object({
    lcp: z.number(),
    fid: z.number(),
    cls: z.number(),
  })),
  sslCert: metricSchema(z.boolean()),
  hasRobotsTxt: metricSchema(z.boolean()),
  hasSitemap: metricSchema(z.boolean()),
  indexablePages: metricSchema(z.number()),
  onSiteKeywords: metricSchema(z.array(z.object({ keyword: z.string(), frequency: z.number() }))),
  titleTag: metricSchema(z.string()),
  metaDescription: metricSchema(z.string()),
  h1Tags: metricSchema(z.array(z.string())),
  canonicalUrl: metricSchema(z.string()),
  internalLinks: metricSchema(z.number()),
  externalLinks: metricSchema(z.number()),
  brokenLinks: metricSchema(z.array(z.string())),
  mobileFriendly: metricSchema(z.boolean()),
});

const competitorsSchema = z.object({
  competitors: metricSchema(z.array(z.object({
    domain: z.string(),
    traffic: metricSchema(z.number()),
    rank: metricSchema(z.number()),
    techCount: metricSchema(z.number()),
  }))),
  source: metricSchema(z.string()),
});

const techSchema = z.object({
  technologies: metricSchema(z.array(z.object({
    name: z.string(),
    category: z.string(),
    website: z.string().optional(),
    icon: z.string().optional(),
  }))),
});

const customersSchema = z.object({
  estimatedCustomers: metricSchema(z.number()),
  returningRate: metricSchema(z.number()),
  purchaseFrequency: metricSchema(z.string()),
  avgOrderValue: metricSchema(z.number()),
  conversionRate: metricSchema(z.number()),
  cartAbandonment: metricSchema(z.number()),
  customerAcquisitionCost: metricSchema(z.number()),
});

const aiAnalysisSchema = z.object({
  businessSummary: metricSchema(z.string()),
  businessModel: metricSchema(z.string()),
  swot: metricSchema(z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  })),
  revenueExplanation: metricSchema(z.string()),
  growthOpportunities: metricSchema(z.array(z.string())),
  strengths: metricSchema(z.array(z.string())),
  weaknesses: metricSchema(z.array(z.string())),
  marketingStrategy: metricSchema(z.string()),
  salesStrategy: metricSchema(z.string()),
  contentStrategy: metricSchema(z.string()),
  competitiveAdvantages: metricSchema(z.array(z.string())),
  recommendations: metricSchema(z.array(z.string())),
});

const moduleMetaSchema = z.object({
  durationMs: z.number(),
  error: z.string().optional(),
});

export const reportSchema = z.object({
  domain: z.string(),
  url: z.string(),
  analyzedAt: z.string(),
  snapshot: snapshotSchema,
  traffic: trafficSchema,
  trafficSources: trafficSourcesSchema,
  products: productsSchema,
  marketing: marketingSchema,
  ads: adsSchema,
  social: socialSchema,
  video: videoSchema,
  seo: seoSchema,
  competitors: competitorsSchema,
  tech: techSchema,
  customers: customersSchema,
  aiAnalysis: aiAnalysisSchema,
  meta: z.record(z.string(), moduleMetaSchema),
});

export type ReportSchema = z.infer<typeof reportSchema>;
