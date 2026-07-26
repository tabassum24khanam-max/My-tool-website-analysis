import type { CompetitorsResult, CrawlResult } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';
import { AiDisabledError } from '@/lib/ai/client';

export async function analyzeCompetitors(crawl: CrawlResult): Promise<CompetitorsResult> {
  try {
    const { aiComplete } = await import('@/lib/ai/client');
    const domain = crawl.domain;

    const description = (() => {
      const cheerio = require('cheerio');
      const $ = cheerio.load(crawl.homepage.html);
      return (
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        $('title').text() ||
        domain
      );
    })();

    const response = await aiComplete(
      'competitor-discovery',
      `Given the website "${domain}" with description: "${description}"

List 3-5 direct competitors. Respond in this exact JSON format:
{
  "competitors": [
    {"domain": "competitor1.com"},
    {"domain": "competitor2.com"},
    {"domain": "competitor3.com"}
  ]
}

Only include real, well-known competitors. No explanations, just the JSON.`
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const competitors = (parsed.competitors || []).map((c: { domain: string }) => ({
      domain: c.domain,
      traffic: unavailable('Analyze this competitor separately for traffic data'),
      rank: unavailable('Analyze this competitor separately for rank data'),
      techCount: unavailable('Analyze this competitor separately for tech data'),
    }));

    return {
      competitors: measured(competitors, 'AI-suggested competitors (DeepSeek)'),
      source: measured('AI analysis', 'DeepSeek competitor discovery'),
    };
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return {
        competitors: unavailable('Enable AI mode or add competitors manually'),
        source: unavailable('AI mode is off — competitors can be added manually'),
      };
    }
    return {
      competitors: unavailable(err instanceof Error ? err.message : 'Competitor discovery failed'),
      source: unavailable('Competitor discovery requires AI mode'),
    };
  }
}
