import { ExternalLink, Play } from 'lucide-react';

/**
 * Creator attribution component for legal compliance.
 * Prominently displays channel info and "Watch on YouTube" link.
 *
 * @param {string} channelTitle - YouTube channel name
 * @param {string} channelId - YouTube channel ID
 * @param {string} videoId - Current YouTube video ID (for direct link)
 * @param {string} videoTitle - Current video title
 * @param {string} className - Additional CSS classes
 */
export default function CreatorAttribution({
  channelTitle,
  channelId,
  videoId,
  videoTitle,
  className = '',
}) {
  const channelUrl = `https://www.youtube.com/channel/${channelId}`;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 bg-bg-secondary border border-border-default rounded-xl ${className}`}
    >
      {/* Channel info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Channel avatar */}
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-danger to-accent-warm flex items-center justify-center ring-2 ring-border-default hover:ring-accent-primary transition-all duration-200">
            <span className="text-sm font-bold text-white">
              {channelTitle?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        </a>

        <div className="min-w-0">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-text-primary hover:text-accent-primary transition-colors truncate block"
          >
            {channelTitle}
          </a>
          <p className="text-xs text-text-tertiary truncate">
            Content creator • YouTube
          </p>
        </div>
      </div>

      {/* Watch on YouTube link */}
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-danger/10 hover:bg-accent-danger/20 text-accent-danger text-xs font-medium transition-all duration-200 group"
      >
        <Play className="w-4 h-4" />
        <span className="hidden sm:inline">Watch on YouTube</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    </div>
  );
}
