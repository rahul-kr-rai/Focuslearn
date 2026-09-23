/**
 * YouTube helper utilities.
 * URL parsing, playlist ID extraction, and duration conversion.
 */

/**
 * Extract playlist ID from various YouTube playlist URL formats.
 * Supports:
 *   - https://www.youtube.com/playlist?list=PLxxxxxx
 *   - https://youtube.com/playlist?list=PLxxxxxx
 *   - https://www.youtube.com/watch?v=xxx&list=PLxxxxxx
 *   - Just the playlist ID itself
 *
 * @param {string} input - YouTube playlist URL or ID
 * @returns {string|null} Playlist ID or null if invalid
 */
export function extractPlaylistId(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Try to parse as URL first
  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get('list');
    if (listParam && /^[a-zA-Z0-9_-]{10,100}$/.test(listParam)) {
      return listParam;
    }
  } catch {
    // Not a valid URL — check if it's a raw playlist ID
  }

  // Check if it's a raw playlist ID (starts with PL, UU, FL, OL, etc.)
  if (/^(PL|UU|FL|OL|LL|RD|UC)[a-zA-Z0-9_-]{10,100}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Parse ISO 8601 duration string to total seconds.
 * YouTube returns durations like "PT1H2M3S", "PT5M30S", "PT45S".
 *
 * @param {string} iso8601 - ISO 8601 duration string
 * @returns {number} Total seconds
 */
export function parseDuration(iso8601) {
  if (!iso8601) return 0;

  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds into human-readable duration string.
 *
 * @param {number} totalSeconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h 2m 3s", "5m 30s", "45s")
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0s';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Format seconds into HH:MM:SS display format.
 *
 * @param {number} totalSeconds - Duration in seconds
 * @returns {string} Formatted time (e.g., "01:02:03" or "05:30")
 */
export function formatTimestamp(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
