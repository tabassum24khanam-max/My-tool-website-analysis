import type { VideoResult, VideoData, CrawlResult } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/utils';

interface YouTubeChannel {
  id: string;
  title: string;
  subscribers: number;
  videoCount: number;
  uploadsPlaylistId: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  thumbnailUrl: string;
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function durationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) + (parseInt(match[2] || '0') * 60) + parseInt(match[3] || '0');
}

function extractYouTubeHandle(html: string): string | null {
  const patterns = [
    /youtube\.com\/@([\w-]+)/i,
    /youtube\.com\/c\/([\w-]+)/i,
    /youtube\.com\/channel\/([\w-]+)/i,
    /youtube\.com\/user\/([\w-]+)/i,
  ];
  for (const p of patterns) {
    const match = html.match(p);
    if (match) return match[1];
  }
  return null;
}

async function resolveChannel(handle: string, apiKey: string): Promise<YouTubeChannel | null> {
  const isChannelId = handle.startsWith('UC') && handle.length === 24;
  const param = isChannelId ? `id=${handle}` : `forHandle=${handle}`;

  try {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${param}&key=${apiKey}`,
      { timeoutMs: 10000 }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) {
      if (!isChannelId) {
        const res2 = await fetchWithTimeout(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forUsername=${handle}&key=${apiKey}`,
          { timeoutMs: 10000 }
        );
        if (!res2.ok) return null;
        const data2 = await res2.json();
        const item2 = data2.items?.[0];
        if (!item2) return null;
        return {
          id: item2.id,
          title: item2.snippet.title,
          subscribers: parseInt(item2.statistics.subscriberCount || '0'),
          videoCount: parseInt(item2.statistics.videoCount || '0'),
          uploadsPlaylistId: item2.contentDetails.relatedPlaylists.uploads,
        };
      }
      return null;
    }
    return {
      id: item.id,
      title: item.snippet.title,
      subscribers: parseInt(item.statistics.subscriberCount || '0'),
      videoCount: parseInt(item.statistics.videoCount || '0'),
      uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
    };
  } catch {
    return null;
  }
}

async function fetchRecentVideos(uploadsId: string, apiKey: string): Promise<YouTubeVideo[]> {
  try {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=50&key=${apiKey}`,
      { timeoutMs: 10000 }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const videoIds = data.items?.map((i: Record<string, Record<string, string>>) => i.contentDetails.videoId) || [];

    if (videoIds.length === 0) return [];

    const batches: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      batches.push(videoIds.slice(i, i + 50));
    }

    const videos: YouTubeVideo[] = [];
    for (const batch of batches) {
      const res2 = await fetchWithTimeout(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(',')}&key=${apiKey}`,
        { timeoutMs: 10000 }
      );
      if (!res2.ok) continue;
      const data2 = await res2.json();
      for (const item of data2.items || []) {
        videos.push({
          id: item.id,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          views: parseInt(item.statistics.viewCount || '0'),
          likes: parseInt(item.statistics.likeCount || '0'),
          comments: parseInt(item.statistics.commentCount || '0'),
          duration: item.contentDetails.duration,
          thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        });
      }
    }

    return videos;
  } catch {
    return [];
  }
}

function analyzeVideoPatterns(videos: YouTubeVideo[]) {
  if (videos.length === 0) return null;

  const sorted = [...videos].sort((a, b) => b.views - a.views);
  const mostViewed = sorted.slice(0, 5);

  const byEngagement = [...videos].sort((a, b) => {
    const engA = (a.likes + a.comments) / Math.max(a.views, 1);
    const engB = (b.likes + b.comments) / Math.max(b.views, 1);
    return engB - engA;
  });
  const highestEngagement = byEngagement.slice(0, 5);

  const avgViews = Math.round(videos.reduce((s, v) => s + v.views, 0) / videos.length);
  const avgLikes = Math.round(videos.reduce((s, v) => s + v.likes, 0) / videos.length);
  const avgComments = Math.round(videos.reduce((s, v) => s + v.comments, 0) / videos.length);

  const durations = videos.map((v) => durationToSeconds(v.duration));
  const avgDurationSec = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
  const avgMins = Math.floor(avgDurationSec / 60);
  const avgSecs = avgDurationSec % 60;

  const dates = videos
    .map((v) => new Date(v.publishedAt).getTime())
    .sort((a, b) => a - b);
  let frequency = 'Unknown';
  if (dates.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    if (avgGap <= 1) frequency = 'Daily';
    else if (avgGap <= 3) frequency = 'Multiple per week';
    else if (avgGap <= 8) frequency = 'Weekly';
    else if (avgGap <= 16) frequency = 'Bi-weekly';
    else if (avgGap <= 35) frequency = 'Monthly';
    else frequency = 'Irregular';
  }

  const gapVariance = dates.length >= 3 ? (() => {
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const variance = gaps.reduce((s, g) => s + Math.pow(g - avg, 2), 0) / gaps.length;
    const cv = Math.sqrt(variance) / avg;
    return cv < 0.3 ? 'Very consistent' : cv < 0.6 ? 'Fairly consistent' : 'Irregular';
  })() : 'Not enough data';

  const titleWords = videos.flatMap((v) =>
    v.title.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  const wordFreq: Record<string, number> = {};
  for (const w of titleWords) wordFreq[w] = (wordFreq[w] || 0) + 1;
  const topics = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  const hookPatterns = [
    'how to', 'why', 'what', 'top', 'best', 'secret', 'truth',
    'never', 'stop', 'ultimate', 'complete guide', 'review',
  ];
  const hooks = hookPatterns.filter((h) =>
    videos.some((v) => v.title.toLowerCase().includes(h))
  );

  return {
    mostViewed: mostViewed.map(toVideoData),
    highestEngagement: highestEngagement.map(toVideoData),
    avgViews,
    avgLikes,
    avgComments,
    frequency,
    avgLength: `${avgMins}:${avgSecs.toString().padStart(2, '0')}`,
    consistency: gapVariance,
    topics,
    hooks,
  };
}

function toVideoData(v: YouTubeVideo): VideoData {
  return {
    title: v.title,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    publishedAt: v.publishedAt,
    duration: parseDuration(v.duration),
    thumbnailUrl: v.thumbnailUrl,
  };
}

/** Fills every VideoResult field with the same unavailable reason. */
function videoUnavailable(reason: string, channelName?: string): VideoResult {
  return {
    channelName: channelName
      ? measured(channelName, 'YouTube channel handle')
      : unavailable(reason),
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

/**
 * Analyses a YouTube channel from a handle or channel id. Used both by the
 * website pipeline (handle discovered on the page) and by the channel pipeline
 * (handle pasted directly by the user).
 */
export async function analyzeYouTubeChannel(handle: string): Promise<VideoResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return videoUnavailable('No YOUTUBE_API_KEY configured', handle);
  }

  const channel = await resolveChannel(handle, apiKey);
  if (!channel) {
    return videoUnavailable(`Could not resolve YouTube channel "${handle}"`, handle);
  }

  const videos = await fetchRecentVideos(channel.uploadsPlaylistId, apiKey);
  const analysis = analyzeVideoPatterns(videos);
  const src = 'YouTube Data API v3';

  return {
    channelName: measured(channel.title, src),
    subscribers: measured(channel.subscribers, src),
    totalVideos: measured(channel.videoCount, src),
    mostViewed: analysis ? measured(analysis.mostViewed, src) : unavailable('No videos found'),
    highestEngagement: analysis ? measured(analysis.highestEngagement, src) : unavailable('No videos found'),
    avgViews: analysis ? measured(analysis.avgViews, src) : unavailable('No videos found'),
    avgLikes: analysis ? measured(analysis.avgLikes, src) : unavailable('No videos found'),
    avgComments: analysis ? measured(analysis.avgComments, src) : unavailable('No videos found'),
    postingFrequency: analysis
      ? measured(analysis.frequency, `${src} — computed from last ${videos.length} videos`)
      : unavailable('No videos found'),
    avgVideoLength: analysis
      ? measured(analysis.avgLength, `${src} — average of ${videos.length} videos`)
      : unavailable('No videos found'),
    uploadConsistency: analysis
      ? measured(analysis.consistency, `${src} — upload gap coefficient of variation`)
      : unavailable('No videos found'),
    commonTopics: analysis && analysis.topics.length > 0
      ? measured(analysis.topics, `${src} — title keyword frequency analysis`)
      : unavailable('Not enough data'),
    commonHooks: analysis && analysis.hooks.length > 0
      ? measured(analysis.hooks, `${src} — title hook pattern matching`)
      : unavailable('No common hook patterns detected'),
    aiContentStrategy: unavailable('AI mode is off'),
    aiMarketingStrategy: unavailable('AI mode is off'),
    aiAudienceStrategy: unavailable('AI mode is off'),
  };
}

export async function analyzeVideo(crawl: CrawlResult): Promise<VideoResult> {
  const handle = extractYouTubeHandle(crawl.allHtml);

  if (!handle) {
    return videoUnavailable('No YouTube channel link found on the website');
  }

  return analyzeYouTubeChannel(handle);
}
