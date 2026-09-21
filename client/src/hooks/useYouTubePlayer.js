import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing YouTube IFrame Player API.
 * Handles script loading, player initialization, and state management.
 *
 * @param {string} videoId - YouTube video ID to play
 * @param {Object} options - Player options
 * @param {string} options.containerId - DOM element ID for the player
 * @param {Function} options.onVideoEnd - Callback when video ends
 * @param {Function} options.onStateChange - Callback for player state changes
 * @returns {Object} Player state and control functions
 */
export default function useYouTubePlayer(videoId, options = {}) {
  const { containerId = 'youtube-player', onVideoEnd, onStateChange } = options;
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const timeIntervalRef = useRef(null);

  // Load YouTube IFrame API script (once)
  useEffect(() => {
    if (window.YT && window.YT.Player) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(tag, firstScript);
  }, []);

  // Initialize or update player when videoId changes
  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      // Destroy existing player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        setIsReady(false);
      }

      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,           // Same-channel recommendations only
          modestbranding: 1, // Minimal YouTube branding
          iv_load_policy: 3, // No annotations
          fs: 1,            // Allow fullscreen
          cc_load_policy: 0, // Don't force captions
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            setDuration(event.target.getDuration());
            setVolumeState(event.target.getVolume());
          },
          onStateChange: (event) => {
            const state = event.data;

            switch (state) {
              case window.YT.PlayerState.PLAYING:
                setIsPlaying(true);
                setDuration(event.target.getDuration());
                startTimeTracking();
                break;
              case window.YT.PlayerState.PAUSED:
                setIsPlaying(false);
                stopTimeTracking();
                break;
              case window.YT.PlayerState.ENDED:
                setIsPlaying(false);
                stopTimeTracking();
                onVideoEnd?.();
                break;
              case window.YT.PlayerState.BUFFERING:
                break;
              default:
                break;
            }

            onStateChange?.(state);
          },
        },
      });
    };

    // Wait for API to load, then initialize
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Set up callback for when API loads
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initPlayer();
      };
    }

    return () => {
      stopTimeTracking();
    };
  }, [videoId, containerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Time tracking interval
  const startTimeTracking = useCallback(() => {
    stopTimeTracking();
    timeIntervalRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 500);
  }, []);

  const stopTimeTracking = useCallback(() => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimeTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [stopTimeTracking]);

  // Player control functions
  const play = useCallback(() => {
    playerRef.current?.playVideo?.();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo?.();
  }, []);

  const seekTo = useCallback((seconds) => {
    playerRef.current?.seekTo?.(seconds, true);
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((vol) => {
    playerRef.current?.setVolume?.(vol);
    setVolumeState(vol);
    if (vol > 0 && isMuted) {
      playerRef.current?.unMute?.();
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      playerRef.current?.unMute?.();
      setIsMuted(false);
    } else {
      playerRef.current?.mute?.();
      setIsMuted(true);
    }
  }, [isMuted]);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime?.() || 0;
  }, []);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    play,
    pause,
    seekTo,
    setVolume,
    toggleMute,
    getCurrentTime,
    player: playerRef.current,
  };
}
