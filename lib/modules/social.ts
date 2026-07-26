import type { SocialResult, CrawlResult } from '@/lib/types';
import { defaultSocial } from './defaults';

export async function analyzeSocial(_crawl: CrawlResult): Promise<SocialResult> {
  return { ...defaultSocial };
}
