'use client';

import type { VideoResult, VideoData } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, formatNumber } from '@/components/metric-value';
import { Video } from 'lucide-react';

function VideoCard({ video }: { video: VideoData }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow"
    >
      {video.thumbnailUrl && (
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-32 object-cover" />
      )}
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2">{video.title}</p>
        <div className="mt-2 flex gap-3 text-xs text-[var(--text-muted)]">
          <span>{formatNumber(video.views)} views</span>
          <span>{formatNumber(video.likes)} likes</span>
          <span>{formatNumber(video.comments)} comments</span>
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{video.duration}</p>
      </div>
    </a>
  );
}

export function VideoSection({ data }: { data: VideoResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Video className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Video Intelligence</CardTitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <MetricValue metric={data.channelName} label="Channel" size="md" />
        <MetricValue metric={data.subscribers} label="Subscribers" size="md" format={formatNumber} />
        <MetricValue metric={data.totalVideos} label="Total Videos" size="md" format={formatNumber} />
        <MetricValue metric={data.avgViews} label="Avg Views" size="md" format={formatNumber} />
        <MetricValue metric={data.avgLikes} label="Avg Likes" size="sm" format={formatNumber} />
        <MetricValue metric={data.avgComments} label="Avg Comments" size="sm" format={formatNumber} />
        <MetricValue metric={data.postingFrequency} label="Posting Frequency" size="sm" />
        <MetricValue metric={data.avgVideoLength} label="Avg Length" size="sm" />
        <MetricValue metric={data.uploadConsistency} label="Consistency" size="sm" />
      </div>

      <MetricValue
        metric={data.commonTopics}
        label="Common Topics"
        size="sm"
        format={(v) => v.join(', ')}
      />

      <MetricValue
        metric={data.commonHooks}
        label="Common Hooks"
        size="sm"
        format={(v) => v.join(', ')}
      />

      {data.mostViewed.status !== 'unavailable' && data.mostViewed.value.length > 0 && (
        <div className="mt-4">
          <p className="metric-label mb-2">Most Viewed</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.mostViewed.value.slice(0, 6).map((v, i) => (
              <VideoCard key={i} video={v} />
            ))}
          </div>
        </div>
      )}

      {data.aiContentStrategy.status !== 'unavailable' && (
        <div className="mt-4 space-y-3">
          <MetricValue metric={data.aiContentStrategy} label="Content Strategy" size="sm" />
          <MetricValue metric={data.aiMarketingStrategy} label="Marketing Strategy" size="sm" />
          <MetricValue metric={data.aiAudienceStrategy} label="Audience Strategy" size="sm" />
        </div>
      )}
    </Card>
  );
}
