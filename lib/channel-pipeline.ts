import type { VideoResult, ModuleMeta, ProfileStats } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';
import { runModule } from '@/lib/modules/run-module';
import { analyzeYouTubeChannel } from '@/lib/modules/video';
import { analyzeTikTokProfile } from '@/lib/modules/tiktok';
import { analyzeInstagramProfile } from '@/lib/modules/instagram';
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
  /** Populated for TikTok and Instagram. */
  profile: ProfileStats | null;
  /** Caveat shown prominently in the UI, when one applies. */
  note: string | null;
  meta: Record<string, ModuleMeta>;
}

/**
 * TikTok and Instagram publish no free API for another account's statistics, so
 * these numbers come from the public payloads their own web clients read. Those
 * are undocumented and can be rate-limited or bot-checked, especially from a
 * datacenter IP, so the UI carries this caveat whenever they are used.
 */
const BEST_EFFORT_NOTE =
  'TikTok and Instagram publish no free API for other accounts, so these figures are read from the public profile payload their own website uses. It is undocumented and may be rate-limited or blocked from a hosted server, in which case fields show as unavailable rather than guessed.';

function placeholderProfile(reason: string): ProfileStats {
  return {
    displayName: unavailable(reason),
    followers: unavailable(reason),
    following: unavailable(reason),
    totalLikes: unavailable(reason),
    postCount: unavailable(reason),
    verified: unavailable(reason),
    bio: unavailable(reason),
    avgLikesPerPost: unavailable(reason),
  };
}

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
  let profile: ProfileStats | null = null;
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
    const run = await runModule<ProfileStats>(
      `${target.platform}Profile`,
      MODULE_TIMEOUT,
      () =>
        target.platform === 'tiktok'
          ? analyzeTikTokProfile(target.handle)
          : analyzeInstagramProfile(target.handle),
      placeholderProfile('Profile lookup failed')
    );
    profile = run.result;
    note = BEST_EFFORT_NOTE;
    video = placeholderVideo('Not applicable for this platform', target.handle);
    meta = run.meta;
  }

  const report: ChannelReport = {
    platform: target.platform,
    handle: target.handle,
    profileUrl: target.url,
    analyzedAt: new Date().toISOString(),
    video,
    profile,
    note,
    meta: { channel: meta },
  };

  storeReport(key, JSON.stringify(report));

  return report;
}
