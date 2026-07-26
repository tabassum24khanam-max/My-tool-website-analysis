import { getAiMode, getCachedAi, storeAiCache } from '@/lib/db';
import { fetchWithTimeout } from '@/lib/utils';
import crypto from 'crypto';

export class AiDisabledError extends Error {
  constructor() {
    super('AI mode is off');
    this.name = 'AiDisabledError';
  }
}

function cacheKey(task: string, input: string): string {
  return crypto.createHash('sha256').update(`${task}:${input}`).digest('hex');
}

export async function aiComplete(task: string, prompt: string): Promise<string> {
  if (!getAiMode()) {
    throw new AiDisabledError();
  }

  const key = cacheKey(task, prompt);
  const cached = getCachedAi(key);
  if (cached) {
    console.log(`[AI] Cache hit for task="${task}"`);
    return cached;
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!deepseekKey && !openaiKey) {
    throw new Error('No AI API key configured (DEEPSEEK_API_KEY or OPENAI_API_KEY)');
  }

  let response: string | null = null;
  let retries = 0;

  if (deepseekKey) {
    while (retries < 2 && !response) {
      try {
        const res = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
          timeoutMs: 30000,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are a business analyst AI. Respond with structured, actionable insights. Be concise and specific. Respond in valid JSON when asked for JSON.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        if (!res.ok) {
          retries++;
          continue;
        }

        const data = await res.json();
        response = data.choices?.[0]?.message?.content || null;

        if (data.usage) {
          console.log(`[AI] DeepSeek tokens: ${data.usage.total_tokens} (prompt=${data.usage.prompt_tokens}, completion=${data.usage.completion_tokens})`);
        }
      } catch (err) {
        console.error(`[AI] DeepSeek attempt ${retries + 1} failed:`, err);
        retries++;
      }
    }
  }

  if (!response && openaiKey) {
    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        timeoutMs: 30000,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a business analyst AI. Respond with structured, actionable insights. Be concise and specific. Respond in valid JSON when asked for JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        response = data.choices?.[0]?.message?.content || null;
        if (data.usage) {
          console.log(`[AI] OpenAI fallback tokens: ${data.usage.total_tokens}`);
        }
      }
    } catch (err) {
      console.error('[AI] OpenAI fallback failed:', err);
    }
  }

  if (!response) {
    throw new Error('AI analysis failed after all attempts');
  }

  storeAiCache(key, response);
  return response;
}
