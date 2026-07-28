import type { ProfileStats } from '@/lib/types';
import { measured, estimated, unavailable } from '@/lib/types';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * TikTok reports heartCount as a signed 32-bit integer, so accounts past
 * ~2.1B likes come back negative. Fold it back into an unsigned value.
 */
function fixInt32Overflow(n: number): number {
  return n < 0 ? n + 2 ** 32 : n;
}

export function profileUnavailable(reason: string): ProfileStats {
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

/**
 * Reads the public profile page and pulls the stats out of the rehydration
 * blob TikTok embeds for its own client. This is an undocumented internal
 * payload, not a supported API: it can change shape, rate-limit, or serve a
 * captcha at any time, which is why every failure resolves to `unavailable`.
 */
export async function analyzeTikTokProfile(handle: string): Promise<ProfileStats> {
  const clean = handle.replace(/^@/, '');
  const url = `https://www.tiktok.com/@${encodeURIComponent(clean)}`;

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return profileUnavailable(`TikTok returned HTTP ${res.status} for @${clean}`);
    }
    html = await res.text();
  } catch (err) {
    return profileUnavailable(
      `Could not reach TikTok: ${err instanceof Error ? err.message : 'request failed'}`
    );
  }

  const match = html.match(
    /id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) {
    return profileUnavailable(
      'TikTok did not return profile data (likely a bot check on this server IP)'
    );
  }

  let stats: Record<string, number> | undefined;
  let user: Record<string, unknown> | undefined;
  try {
    const data = JSON.parse(match[1]);
    const detail = data?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
    stats = detail?.userInfo?.stats;
    user = detail?.userInfo?.user;
  } catch {
    return profileUnavailable('TikTok profile data could not be parsed');
  }

  if (!stats || !user) {
    return profileUnavailable(`TikTok profile @${clean} not found or is private`);
  }

  const src = 'TikTok public profile page';
  const followers = typeof stats.followerCount === 'number' ? stats.followerCount : null;
  const likes = typeof stats.heartCount === 'number' ? fixInt32Overflow(stats.heartCount) : null;
  const posts = typeof stats.videoCount === 'number' ? stats.videoCount : null;

  return {
    displayName: user.nickname
      ? measured(String(user.nickname), src)
      : unavailable('No display name returned'),
    followers: followers !== null ? measured(followers, src) : unavailable('Not returned'),
    following:
      typeof stats.followingCount === 'number'
        ? measured(stats.followingCount, src)
        : unavailable('Not returned'),
    totalLikes: likes !== null ? measured(likes, src) : unavailable('Not returned'),
    postCount: posts !== null ? measured(posts, src) : unavailable('Not returned'),
    verified:
      typeof user.verified === 'boolean'
        ? measured(user.verified, src)
        : unavailable('Not returned'),
    bio: user.signature
      ? measured(String(user.signature), src)
      : unavailable('No bio set'),
    avgLikesPerPost:
      likes !== null && posts && posts > 0
        ? estimated(
            Math.round(likes / posts),
            'medium',
            `Total likes (${likes.toLocaleString()}) divided by ${posts.toLocaleString()} videos — lifetime average, not recent performance`
          )
        : unavailable('Needs both like and video counts'),
  };
}
