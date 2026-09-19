import axios from 'axios';
import env from '../config/env.js';
import { parseDuration } from '../utils/youtubeHelpers.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * YouTube Data API v3 service.
 * Handles all interactions with the YouTube API for playlist ingestion.
 */

/**
 * Fetch playlist metadata (title, description, thumbnail, channel info).
 *
 * @param {string} playlistId - YouTube playlist ID
 * @returns {Object} Playlist details
 */
export async function fetchPlaylistDetails(playlistId) {
  const response = await axios.get(`${YOUTUBE_API_BASE}/playlists`, {
    params: {
      part: 'snippet,contentDetails',
      id: playlistId,
      key: env.YOUTUBE_API_KEY,
    },
  });

  const items = response.data.items;
  if (!items || items.length === 0) {
    throw new Error(`Playlist not found or is private: ${playlistId}`);
  }

  const playlist = items[0];
  return {
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    thumbnailUrl:
      playlist.snippet.thumbnails?.maxres?.url ||
      playlist.snippet.thumbnails?.high?.url ||
      playlist.snippet.thumbnails?.medium?.url ||
      null,
    channelTitle: playlist.snippet.channelTitle,
    channelId: playlist.snippet.channelId,
    totalItems: playlist.contentDetails.itemCount,
  };
}

/**
 * Fetch all video IDs from a playlist (handles pagination).
 * YouTube API returns max 50 items per page.
 *
 * @param {string} playlistId - YouTube playlist ID
 * @returns {Array<{videoId: string, position: number, title: string}>}
 */
export async function fetchPlaylistItems(playlistId) {
  const allItems = [];
  let nextPageToken = null;

  do {
    const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
        key: env.YOUTUBE_API_KEY,
      },
    });

    const items = response.data.items || [];

    for (const item of items) {
      // Skip deleted/private videos
      if (item.snippet.title === 'Deleted video' || item.snippet.title === 'Private video') {
        continue;
      }

      allItems.push({
        videoId: item.contentDetails.videoId,
        position: item.snippet.position,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          null,
        channelTitle: item.snippet.videoOwnerChannelTitle || '',
        channelId: item.snippet.videoOwnerChannelId || '',
      });
    }

    nextPageToken = response.data.nextPageToken;
  } while (nextPageToken);

  return allItems;
}

/**
 * Fetch detailed video information including embed status.
 * Batches requests in groups of 50 (YouTube API limit).
 *
 * Two-step process for embed checking:
 * 1. playlistItems.list gives us video IDs
 * 2. videos.list with part=status gives us embeddable flag
 *
 * @param {string[]} videoIds - Array of YouTube video IDs
 * @returns {Map<string, Object>} Map of videoId → details
 */
export async function fetchVideoDetails(videoIds) {
  const detailsMap = new Map();

  // Process in batches of 50
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);

    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'contentDetails,status,snippet',
        id: batch.join(','),
        key: env.YOUTUBE_API_KEY,
      },
    });

    for (const video of response.data.items || []) {
      detailsMap.set(video.id, {
        duration: video.contentDetails.duration,
        durationSeconds: parseDuration(video.contentDetails.duration),
        isEmbeddable: video.status.embeddable === true,
        publishedAt: video.snippet.publishedAt,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
      });
    }
  }

  return detailsMap;
}
