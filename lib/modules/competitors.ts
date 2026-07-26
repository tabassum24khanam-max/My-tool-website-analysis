import type { CompetitorsResult, CrawlResult } from '@/lib/types';
import { defaultCompetitors } from './defaults';

export async function analyzeCompetitors(_crawl: CrawlResult): Promise<CompetitorsResult> {
  return { ...defaultCompetitors };
}
