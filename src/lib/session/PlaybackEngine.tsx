import React, { useEffect, useRef } from 'react';
import { useSession } from './SessionProvider';

interface PlaybackEngineProps {
  videoSrc?: string | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export function PlaybackEngine({ videoSrc, videoRef }: PlaybackEngineProps) {
  const { isPlaying, rate, currentTime, duration, seek, pause } = useSession();
  const lastTimeRef = useRef<number | null>(null);

  // If we have a real HTML video element
  useEffect(() => {
    const video = videoRef?.current;
    if (!video || !videoSrc) return;

    video.playbackRate = rate;

    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, rate, videoSrc, videoRef]);

  // Synchronize video element time when user seeks
  useEffect(() => {
    const video = videoRef?.current;
    if (video && videoSrc) {
      if (Math.abs(video.currentTime - currentTime) > 0.35) {
        video.currentTime = currentTime;
      }
    }
  }, [currentTime, videoSrc, videoRef]);

  // Simulated playback loop (used when videoSrc is not present, e.g. mock demo mode)
  useEffect(() => {
    if (videoSrc) return; // Video element handles playback time updates

    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let animId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        const nextTime = currentTime + deltaSeconds * rate;

        if (nextTime >= duration) {
          seek(duration);
          pause();
          lastTimeRef.current = null;
          return;
        } else {
          seek(nextTime);
        }
      }
      lastTimeRef.current = now;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      lastTimeRef.current = null;
    };
  }, [isPlaying, rate, currentTime, duration, seek, pause, videoSrc]);

  return null;
}
