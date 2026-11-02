import React, { useEffect, useRef } from 'react';
import { EventItem, TranscriptSegment } from '../../lib/types/report';
import { formatTimecode } from '../../lib/format';
import { Radio } from 'lucide-react';

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  events: EventItem[];
  currentTime: number;
  followPlayback: boolean;
  onToggleFollow: () => void;
  onSeek: (t: number) => void;
  className?: string;
}

const FILLER_REGEX = /\b(um|uh|er|erm|ah|hmm|mm|you know|I mean)\b/gi;

export function TranscriptPanel({
  segments,
  events,
  currentTime,
  followPlayback,
  onToggleFollow,
  onSeek,
  className = '',
}: TranscriptPanelProps) {
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (followPlayback && activeSegmentRef.current && containerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentTime, followPlayback]);

  const renderTextWithFillers = (text: string) => {
    const parts = text.split(FILLER_REGEX);
    return parts.map((part, i) => {
      if (FILLER_REGEX.test(part)) {
        return (
          <span
            key={i}
            className="px-1 py-0.5 rounded bg-[#F2B75B]/20 text-[#F6C77F] font-mono text-xs border border-[#F2B75B]/30 font-semibold"
            title="Filler word detected"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col gap-3 w-full h-full select-none ${className}`}>
      {/* Header with Follow toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17324F]/70">
        <span className="text-xs font-mono font-medium text-[#7C93A9]">
          {segments.length} speech segments
        </span>
        <button
          type="button"
          onClick={onToggleFollow}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
            followPlayback
              ? 'bg-[#79C8DF]/20 text-[#DCEFF8] border border-[#79C8DF]'
              : 'bg-[#0B1A2D] text-[#7C93A9] border border-[#17324F]'
          }`}
        >
          <Radio className={`w-3 h-3 ${followPlayback ? 'text-[#79C8DF] animate-pulse' : ''}`} />
          Follow playback: {followPlayback ? 'On' : 'Off'}
        </button>
      </div>

      {/* Segments List */}
      <div
        ref={containerRef}
        className="flex flex-col gap-2.5 overflow-y-auto max-h-[580px] pr-1.5"
      >
        {segments.map((seg, idx) => {
          const isCurrent = currentTime >= seg.t0 && currentTime <= seg.t1;
          const midTime = (seg.t0 + seg.t1) / 2;
          const overlappingEvent = events.find((e) => midTime >= e.t0 && midTime <= e.t1);

          let leftBorder = 'border-l-2 border-l-transparent';
          if (overlappingEvent) {
            if (overlappingEvent.severity === 'strong') {
              leftBorder = 'border-l-2 border-l-[#6FE3B8]';
            } else if (overlappingEvent.severity === 'weak') {
              leftBorder = 'border-l-2 border-l-[#F2B75B]';
            } else if (overlappingEvent.severity === 'severe') {
              leftBorder = 'border-l-2 border-l-[#F2766B]';
            }
          }

          return (
            <div
              key={idx}
              ref={isCurrent ? activeSegmentRef : null}
              onClick={() => onSeek(seg.t0)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${leftBorder} ${
                isCurrent
                  ? 'bg-[#10243B] border-[#79C8DF]/60 shadow-[0_0_12px_rgba(121,200,223,0.15)] ring-1 ring-[#79C8DF]/40'
                  : 'bg-[#0B1A2D]/70 border-[#17324F] hover:bg-[#10243B]/60 hover:border-[#79C8DF]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-[#79C8DF] hover:underline">
                  {formatTimecode(seg.t0)} – {formatTimecode(seg.t1)}
                </span>
                {overlappingEvent && (
                  <span className="text-[10px] font-mono text-[#7C93A9]">
                    {overlappingEvent.id.toUpperCase()} ({overlappingEvent.subtype.replace(/_/g, ' ')})
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-[#F7FAFC]">
                {renderTextWithFillers(seg.text)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
