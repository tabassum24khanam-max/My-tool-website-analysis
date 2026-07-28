export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram';

export interface SocialTarget {
  platform: SocialPlatform;
  /** Handle as typed by the user, without the leading @ (or a UC... channel id). */
  handle: string;
  /** Canonical profile URL. */
  url: string;
}

const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];
const TT_HOSTS = ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'm.tiktok.com'];
const IG_HOSTS = ['instagram.com', 'www.instagram.com'];

/** Paths that are site sections, never account handles. */
const RESERVED = new Set([
  'watch', 'shorts', 'playlist', 'results', 'feed', 'explore', 'reels', 'reel',
  'p', 'tv', 'stories', 'accounts', 'about', 'tag', 'discover', 'live', 'video',
  'foryou', 'following', 'upload', 'settings',
]);

function cleanHandle(raw: string): string {
  return raw.replace(/^@/, '').split(/[?#]/)[0].trim();
}

/**
 * Detects whether the user pasted a YouTube / TikTok / Instagram profile rather
 * than a company website. Returns null when the input is not a social profile,
 * so the caller can fall back to normal website analysis.
 */
export function parseSocialUrl(input: string): SocialTarget | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare handle like "@mrbeast" is ambiguous across platforms, so require a URL
  // unless it is an explicit platform-prefixed form such as "youtube.com/@x".
  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);

  if (YT_HOSTS.includes(host)) {
    // /@handle
    const at = segments.find((s) => s.startsWith('@'));
    if (at) {
      const handle = cleanHandle(at);
      if (handle) {
        return { platform: 'youtube', handle, url: `https://www.youtube.com/@${handle}` };
      }
    }
    // /channel/UC..., /c/name, /user/name
    const idx = segments.findIndex((s) => ['channel', 'c', 'user'].includes(s.toLowerCase()));
    if (idx !== -1 && segments[idx + 1]) {
      const handle = cleanHandle(segments[idx + 1]);
      if (handle) {
        const kind = segments[idx].toLowerCase();
        return {
          platform: 'youtube',
          handle,
          url: `https://www.youtube.com/${kind}/${handle}`,
        };
      }
    }
    return null;
  }

  if (TT_HOSTS.includes(host)) {
    const at = segments.find((s) => s.startsWith('@'));
    const candidate = at ?? segments[0];
    if (candidate) {
      const handle = cleanHandle(candidate);
      if (handle && !RESERVED.has(handle.toLowerCase())) {
        return { platform: 'tiktok', handle, url: `https://www.tiktok.com/@${handle}` };
      }
    }
    return null;
  }

  if (IG_HOSTS.includes(host)) {
    const candidate = segments[0];
    if (candidate) {
      const handle = cleanHandle(candidate);
      if (handle && !RESERVED.has(handle.toLowerCase())) {
        return { platform: 'instagram', handle, url: `https://www.instagram.com/${handle}/` };
      }
    }
    return null;
  }

  return null;
}

/** Stable cache/report key for a social target, e.g. "youtube:mrbeast". */
export function socialKey(target: SocialTarget): string {
  return `${target.platform}:${target.handle.toLowerCase()}`;
}
