import type { ModuleMeta } from '@/lib/types';

export async function runModule<T>(
  name: string,
  timeoutMs: number,
  fn: () => Promise<T>,
  fallback: T
): Promise<{ result: T; meta: ModuleMeta }> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Module "${name}" timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return {
      result,
      meta: { durationMs: Date.now() - start },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Module "${name}" failed: ${message}`);
    return {
      result: fallback,
      meta: { durationMs: Date.now() - start, error: message },
    };
  }
}
