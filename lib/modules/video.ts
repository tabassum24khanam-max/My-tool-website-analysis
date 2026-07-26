import type { VideoResult, CrawlResult } from '@/lib/types';
import { defaultVideo } from './defaults';

export async function analyzeVideo(_crawl: CrawlResult): Promise<VideoResult> {
  return { ...defaultVideo };
}
