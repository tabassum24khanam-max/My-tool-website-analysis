import type { VideoResult, ModuleMeta } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';
import { runModule } from '@/lib/modules/run-module';
import { analyzeYouTubeChannel } from '@/lib/modules/video';
import { parseSocialUrl, socialKey, type SocialPlatform, type SocialTarget } from '@/lib/social-url';
import { getCachedReport, storeReport, addSearchHistory } from '@/lib/db';

const MODULE_TIMEOUT = 25_000;

export interface ChannelReport {
  platform: SocialPlatform;
  handle: string;
  profileUrl: string;
  analyzedAt: string;
  /** Populated for YouTube; unavailable placeholders for other platforms. */
  video: VideoResult;
  /** Why a platform cannot be analysed, shown prominently in the UI. */
  note: string | null;
  meta: Record<string, ModuleMeta>;
}

/**
 * TikTok and Instagram have no free API that exposes another account's stats.
 * Rather than invent numbers we record the profile and say so plainly.
 */
const NO_FREE_API: Record<Exclude<SocialPlatform, 'youtube'>, string> = {
  tiktok:
    'TikTok has no free public API for account statistics. Follower counts, views and engagement are only available through paid providers or an approved TikTok for Business account, so they are not shown here.',
  instagram:
    'Instagram has no free public API for account statistics. The Graph API only reports on accounts you own and requires app review, so follower counts and engagement are not shown here.',
};

function placeholderVideo(reason: string, handle: string): VideoResult {
  return {
    channelName: measured(handle, 'Handle from the pasted profile URL'),
    subscribers: unavailable(reason),
    totalVideos: unavailable(reason),
    mostViewed: unavailable(reason),
    highestEngagement: unavailable(reason),
    avgViews: unavailable(reason),
    avgLikes: unavailable(reason),
    avgComments: unavailable(reason),
    postingFrequency: unavailable(reason),
    avgVideoLength: unavailable(reason),
    uploadConsistency: unavailable(reason),
    commonTopics: unavailable(reason),
    commonHooks: unavailable(reason),
    aiContentStrategy: unavailable('AI mode is off'),
    aiMarketingStrategy: unavailable('AI mode is off'),
    aiAudienceStrategy: unavailable('AI mode is off'),
  };
}

export function detectChannel(input: string): SocialTarget | null {
  return parseSocialUrl(input);
}

export async function analyzeChannel(
  input: string,
  refresh = false
): Promise<ChannelReport> {
  const target = parseSocialUrl(input);
  if (!target) {
    throw new Error('Not a recognised YouTube, TikTok or Instagram profile URL');
  }

  const key = socialKey(target);
  addSearchHistory(key);

  if (!refresh) {
    const cached = getCachedReport(key);
    if (cached) {
      try {
        return JSON.parse(cached) as ChannelReport;
      } catch {
        // fall through and re-analyse on unparseable cache
      }
    }
  }

  let video: VideoResult;
  let note: string | null = null;
  let meta: ModuleMeta;

  if (target.platform === 'youtube') {
    const run = await runModule(
      'youtubeChannel',
      MODULE_TIMEOUT,
      () => analyzeYouTubeChannel(target.handle),
      placeholderVideo('YouTube channel analysis failed', target.handle)
    );
    video = run.result;
    meta = run.meta;
  } else {
    note = NO_FREE_API[target.platform];
    video = placeholderVideo(note, target.handle);
    meta = { durationMs: 0 };
  }

  const report: ChannelReport = {
    platform: target.platform,
    handle: target.handle,
    profileUrl: target.url,
    analyzedAt: new Date().toISOString(),
    video,
    note,
    meta: { channel: meta },
  };

  storeReport(key, JSON.stringify(report));

  return report;
}
