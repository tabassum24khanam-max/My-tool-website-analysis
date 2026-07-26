import type { AiAnalysisResult } from '@/lib/types';
import { defaultAiAnalysis } from './defaults';

export async function analyzeAi(): Promise<AiAnalysisResult> {
  return { ...defaultAiAnalysis };
}
