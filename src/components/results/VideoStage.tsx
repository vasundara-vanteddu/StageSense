import React, { useRef, useState, useEffect } from 'react';
import { useSession } from '../../lib/session/SessionProvider';
import { formatTimecode } from '../../lib/format';
import { SpeakerFrame } from '../shared/BandBadge';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, FastForward } from 'lucide-react';
import { EventItem } from '../../lib/types/report';

interface VideoStageProps {
  videoSrc?: string | null;
  events?: EventItem[];
  className?: string;
}

export function VideoStage({ videoSrc, events = [], className = '' }: VideoStageProps) {
  const {
  isPlaying,
  currentTime,
  duration,
  rate,
  togglePlay,
  play,
  pause,
  seek,
  setRate,
} = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  // Keep the actual video synchronized with session playback state.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;

    if (isPlaying) {
      void video.play().catch(() => {
        pause();
      });
    } else {
      video.pause();
    }
  }, [isPlaying, rate, pause]);


  // Keyboard controls in stage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 5));
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 10));
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, togglePlay, seek]);

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 2800);
  };

  const toggleFullscreen = () => {
    if (!stageRef.current) return;
    if (!document.fullscreenElement) {
      stageRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full aspect-video bg-[#02050B] rounded-2xl overflow-hidden border border-[#17324F] shadow-2xl group select-none ${className}`}
    >
      {/* Either render real video or honest SpeakerFrame */}
      {videoSrc ? (
        <video
        onTimeUpdate={(e) => seek(e.currentTarget.currentTime)}
onLoadedMetadata={(e) => {
  seek(e.currentTarget.currentTime);
}}
onPlay={play}
onPause={pause}
onEnded={pause}
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          muted={isMuted}
          playsInline
          onClick={togglePlay}
        />
      ) : (
        <div className="w-full h-full cursor-pointer" onClick={togglePlay}>
          <SpeakerFrame />
        </div>
      )}

      {/* Center play button on pause */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#10243B]/80 backdrop-blur-md border border-[#79C8DF]/50 flex items-center justify-center text-[#F7FAFC] hover:scale-110 hover:shadow-[0_0_20px_#79C8DF] transition-all z-20"
          aria-label="Play video"
        >
          <Play className="w-7 h-7 fill-current translate-x-0.5" />
        </button>
      )}

      {/* Floating Glass Control Bar */}
      <div
        className={`video-player-controls absolute bottom-3 left-3 right-3 bg-[#0B1A2D]/85 backdrop-blur-md border border-[#17324F] rounded-xl p-2.5 flex flex-col gap-2 transition-opacity duration-300 z-30 ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrub Bar with event ticks */}
        <div
          className="relative w-full h-3 flex items-center cursor-pointer group/scrub"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seek(pct * duration);
          }}
        >
          <div className="relative w-full h-1 bg-[#17324F] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#79C8DF] shadow-[0_0_8px_#79C8DF]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Event ticks */}
          {events.map((ev) => {
            const tickPct = (ev.t0 / duration) * 100;
            let tickColor = 'bg-[#79C8DF]';
            if (ev.severity === 'strong') tickColor = 'bg-[#6FE3B8]';
            else if (ev.severity === 'weak') tickColor = 'bg-[#F2B75B]';
            else if (ev.severity === 'severe') tickColor = 'bg-[#F2766B]';

            return (
              <div
                key={ev.id}
                className={`absolute top-0.5 w-1 h-2 rounded-full ${tickColor} pointer-events-none`}
                style={{ left: `${tickPct}%` }}
              />
            );
          })}

          {/* Scrub Handle */}
          <div
            className="absolute w-3 h-3 rounded-full bg-[#F7FAFC] border-2 border-[#79C8DF] shadow-[0_0_8px_#79C8DF] pointer-events-none transform -translate-x-1/2 opacity-0 group-hover/scrub:opacity-100 transition-opacity"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Buttons and Time Row */}
        <div className="flex items-center justify-between text-xs font-mono text-[#DCEFF8]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-[#17324F] text-[#F7FAFC] transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => seek(Math.max(0, currentTime - 5))}
              className="p-1.5 rounded-lg hover:bg-[#17324F] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
              title="-5s (ArrowLeft)"
              aria-label="Skip backward 5 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => seek(Math.min(duration, currentTime + 5))}
              className="p-1.5 rounded-lg hover:bg-[#17324F] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
              title="+5s (ArrowRight)"
              aria-label="Skip forward 5 seconds"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            {/* Timecode display */}
            <span className="tabular-nums ml-1 text-xs">
              <span className="text-[#F7FAFC] font-semibold">{formatTimecode(currentTime)}</span>
              <span className="text-[#7C93A9]"> / {formatTimecode(duration)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Rate Menu */}
            <div className="flex items-center gap-1 border border-[#17324F] rounded-lg p-0.5 bg-[#07111F]/60">
              {[0.75, 1, 1.25, 1.5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    rate === r ? 'bg-[#79C8DF] text-[#07111F] font-bold' : 'text-[#7C93A9] hover:text-[#F7FAFC]'
                  }`}
                >
                  {r}×
                </button>
              ))}
            </div>

            {/* Mute toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-[#17324F] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-[#17324F] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
