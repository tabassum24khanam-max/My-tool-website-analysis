import type { AiAnalysisResult, Report } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';
import { defaultAiAnalysis } from './defaults';
import { aiComplete, AiDisabledError } from '@/lib/ai/client';

function buildPrompt(report: Omit<Report, 'aiAnalysis' | 'meta'>): string {
  const domain = report.domain;

  const snapshotSummary = report.snapshot.companyName.status !== 'unavailable'
    ? `Company: ${report.snapshot.companyName.value}`
    : `Domain: ${domain}`;

  const descriptionSummary = report.snapshot.description.status !== 'unavailable'
    ? `Description: ${report.snapshot.description.value}`
    : '';

  const industrySummary = report.snapshot.industry.status !== 'unavailable'
    ? `Industry: ${report.snapshot.industry.value}`
    : '';

  const bizModelSummary = report.snapshot.businessModel.status !== 'unavailable'
    ? `Business Model: ${report.snapshot.businessModel.value}`
    : '';

  const trafficSummary = report.traffic.estimatedMonthlyVisits.status !== 'unavailable'
    ? `Est. Monthly Visits: ${report.traffic.estimatedMonthlyVisits.value}`
    : 'Traffic: unknown';

  const techList = report.tech.technologies.status !== 'unavailable'
    ? `Technologies: ${report.tech.technologies.value.map((t) => t.name).join(', ')}`
    : '';

  const socialList = report.social.accounts.status !== 'unavailable'
    ? `Social Platforms: ${report.social.accounts.value.map((a) => a.platform).join(', ')}`
    : '';

  const productsList = report.products.products.status !== 'unavailable'
    ? `Products: ${report.products.products.value.map((p) => p.name).join(', ')}`
    : '';

  const pricingSummary = report.snapshot.pricing.status !== 'unavailable'
    ? `Pricing: ${report.snapshot.pricing.value}`
    : '';

  return `Analyze this business and provide structured insights.

${snapshotSummary}
${descriptionSummary}
${industrySummary}
${bizModelSummary}
${trafficSummary}
${techList}
${socialList}
${productsList}
${pricingSummary}

Respond in this exact JSON format:
{
  "businessSummary": "2-3 sentence summary of what this business does and how it operates",
  "businessModel": "How this business makes money (subscriptions, one-time sales, ads, etc.)",
  "swot": {
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "threats": ["threat1", "threat2"]
  },
  "revenueExplanation": "How they likely generate revenue and estimated revenue model",
  "growthOpportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "marketingStrategy": "Their likely marketing approach",
  "salesStrategy": "Their likely sales approach",
  "contentStrategy": "Their content creation strategy",
  "competitiveAdvantages": ["advantage1", "advantage2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}`;
}

export async function analyzeAi(report?: Omit<Report, 'aiAnalysis' | 'meta'>): Promise<AiAnalysisResult> {
  if (!report) {
    return { ...defaultAiAnalysis };
  }

  try {
    const prompt = buildPrompt(report);
    const response = await aiComplete('business-analysis', prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const src = 'DeepSeek AI analysis (cached)';

    return {
      businessSummary: parsed.businessSummary
        ? measured(parsed.businessSummary, src)
        : unavailable('AI did not generate business summary'),
      businessModel: parsed.businessModel
        ? measured(parsed.businessModel, src)
        : unavailable('AI did not generate business model'),
      swot: parsed.swot
        ? measured(parsed.swot, src)
        : unavailable('AI did not generate SWOT analysis'),
      revenueExplanation: parsed.revenueExplanation
        ? measured(parsed.revenueExplanation, src)
        : unavailable('AI did not generate revenue explanation'),
      growthOpportunities: parsed.growthOpportunities
        ? measured(parsed.growthOpportunities, src)
        : unavailable('AI did not generate growth opportunities'),
      strengths: parsed.strengths
        ? measured(parsed.strengths, src)
        : unavailable('AI did not generate strengths'),
      weaknesses: parsed.weaknesses
        ? measured(parsed.weaknesses, src)
        : unavailable('AI did not generate weaknesses'),
      marketingStrategy: parsed.marketingStrategy
        ? measured(parsed.marketingStrategy, src)
        : unavailable('AI did not generate marketing strategy'),
      salesStrategy: parsed.salesStrategy
        ? measured(parsed.salesStrategy, src)
        : unavailable('AI did not generate sales strategy'),
      contentStrategy: parsed.contentStrategy
        ? measured(parsed.contentStrategy, src)
        : unavailable('AI did not generate content strategy'),
      competitiveAdvantages: parsed.competitiveAdvantages
        ? measured(parsed.competitiveAdvantages, src)
        : unavailable('AI did not generate competitive advantages'),
      recommendations: parsed.recommendations
        ? measured(parsed.recommendations, src)
        : unavailable('AI did not generate recommendations'),
    };
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return { ...defaultAiAnalysis };
    }
    console.error('[AI Analysis] Failed:', err);
    const reason = err instanceof Error ? err.message : 'AI analysis failed';
    return {
      businessSummary: unavailable(reason),
      businessModel: unavailable(reason),
      swot: unavailable(reason),
      revenueExplanation: unavailable(reason),
      growthOpportunities: unavailable(reason),
      strengths: unavailable(reason),
      weaknesses: unavailable(reason),
      marketingStrategy: unavailable(reason),
      salesStrategy: unavailable(reason),
      contentStrategy: unavailable(reason),
      competitiveAdvantages: unavailable(reason),
      recommendations: unavailable(reason),
    };
  }
}
