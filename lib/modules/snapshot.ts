import type { SnapshotResult, CrawlResult } from '@/lib/types';
import { defaultSnapshot } from './defaults';

export async function analyzeSnapshot(_crawl: CrawlResult): Promise<SnapshotResult> {
  return { ...defaultSnapshot };
}
