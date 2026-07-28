import type { ProfileStats } from '@/lib/types';
import { measured, estimated, unavailable } from '@/lib/types';
import { profileUnavailable } from '@/lib/modules/tiktok';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Instagram's public web client id, sent by instagram.com itself. */
const WEB_APP_ID = '936619743392459';

/**
 * Reads the endpoint instagram.com's own web client uses for public profiles.
 * Undocumented and unsupported: it can start requiring a session or return a
 * login wall at any time, so every failure resolves to `unavailable`.
 */
export async function analyzeInstagramProfile(handle: string): Promise<ProfileStats> {
  const clean = handle.replace(/^@/, '').replace(/\/$/, '');
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(clean)}`;

  let payload: Record<string, unknown>;
  try {
    const res = await fetch(url, {
      // Instagram rejects a bare request with HTTP 400; it only answers when the
      // call looks like the one its own web client makes from a profile page.
      headers: {
        'User-Agent': UA,
        'X-IG-App-ID': WEB_APP_ID,
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: `https://www.instagram.com/${encodeURIComponent(clean)}/`,
        Origin: 'https://www.instagram.com',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 404) {
      return profileUnavailable(`Instagram profile @${clean} not found`);
    }
    // Instagram throttles after only a handful of requests and answers 401/429
    // with "please wait a few minutes", which is temporary and quite different
    // from a missing profile. Say which one it is.
    if (res.status === 401 || res.status === 429) {
      return profileUnavailable(
        'Instagram is rate-limiting this server — it allows only a few profile lookups before asking callers to wait. Try again in a few minutes; cached results are reused for 24 hours.'
      );
    }
    if (!res.ok) {
      return profileUnavailable(
        `Instagram returned HTTP ${res.status} — it may be throttling or requiring a login for this server's IP`
      );
    }
    payload = await res.json();
  } catch (err) {
    return profileUnavailable(
      `Could not reach Instagram: ${err instanceof Error ? err.message : 'request failed'}`
    );
  }

  const user = (payload as { data?: { user?: Record<string, unknown> } })?.data?.user;
  if (!user) {
    return profileUnavailable(`Instagram profile @${clean} not found or is private`);
  }

  const src = 'Instagram public profile endpoint';
  const followers = (user.edge_followed_by as { count?: number } | undefined)?.count ?? null;
  const following = (user.edge_follow as { count?: number } | undefined)?.count ?? null;
  const posts =
    (user.edge_owner_to_timeline_media as { count?: number } | undefined)?.count ?? null;

  // Average likes over the most recent posts Instagram returns inline.
  const recent =
    (user.edge_owner_to_timeline_media as
      | { edges?: Array<{ node?: { edge_liked_by?: { count?: number } } }> }
      | undefined)?.edges ?? [];
  const recentLikes = recent
    .map((e) => e?.node?.edge_liked_by?.count)
    .filter((n): n is number => typeof n === 'number');
  const avgRecentLikes = recentLikes.length
    ? Math.round(recentLikes.reduce((a, b) => a + b, 0) / recentLikes.length)
    : null;

  return {
    displayName: user.full_name
      ? measured(String(user.full_name), src)
      : unavailable('No display name set'),
    followers: followers !== null ? measured(followers, src) : unavailable('Not returned'),
    following: following !== null ? measured(following, src) : unavailable('Not returned'),
    totalLikes: unavailable('Instagram does not publish a lifetime like total'),
    postCount: posts !== null ? measured(posts, src) : unavailable('Not returned'),
    verified:
      typeof user.is_verified === 'boolean'
        ? measured(user.is_verified, src)
        : unavailable('Not returned'),
    bio: user.biography
      ? measured(String(user.biography), src)
      : unavailable('No bio set'),
    avgLikesPerPost:
      avgRecentLikes !== null
        ? estimated(
            avgRecentLikes,
            recentLikes.length >= 6 ? 'medium' : 'low',
            `Average likes across the ${recentLikes.length} most recent posts returned by Instagram`
          )
        : unavailable('No recent post data returned'),
  };
}
