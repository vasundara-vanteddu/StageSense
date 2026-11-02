import React from 'react';
import { DimensionKey, EventItem, TimelineFeedbackItem } from '../../lib/types/report';
import { formatTimecode } from '../../lib/format';
import { getSubtypeLabel, getSubtypeWhy } from '../../content/subtypes';
import { DimensionGlyph, StateBadge } from '../shared/BandBadge';
import { Play, SkipBack, SkipForward, ArrowRight } from 'lucide-react';

interface EventDetailProps {
  event: EventItem;
  timelineItem?: TimelineFeedbackItem;
  onPlaySpan: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenDimension: (d: DimensionKey) => void;
  className?: string;
}

export function EventDetail({
  event,
  timelineItem,
  onPlaySpan,
  onPrev,
  onNext,
  onOpenDimension,
  className = '',
}: EventDetailProps) {
  const isStrong = event.severity === 'strong';
  const durationS = Math.round(event.t1 - event.t0);
  const subtypeLabel = getSubtypeLabel(event.subtype);
  const subtypeWhy = getSubtypeWhy(event.subtype);

  const compoundLabel = event.compound ? getSubtypeLabel(event.compound) : null;

  return (
    <div
      className={`flex flex-col gap-4 p-4 rounded-xl border ${
        isStrong
          ? 'bg-[#10243B]/90 border-[#6FE3B8]/30'
          : 'bg-[#10243B]/90 border-[#17324F]'
      } ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#DCEFF8] tracking-wider">
              {event.id.toUpperCase()}
            </span>
            <StateBadge state={event.severity} size="sm" />
            <span className="font-mono text-xs text-[#7C93A9]">
              {formatTimecode(event.t0)} – {formatTimecode(event.t1)} ({durationS}s)
            </span>
          </div>
          <h3 className="font-['Space_Grotesk'] text-lg font-semibold text-[#F7FAFC]">
            {timelineItem?.title || subtypeLabel}
          </h3>
        </div>

        {/* Previous / Next buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            className="p-1.5 rounded-lg border border-[#17324F] hover:border-[#79C8DF] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
            title="Previous moment ([)"
            aria-label="Previous moment"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-1.5 rounded-lg border border-[#17324F] hover:border-[#79C8DF] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
            title="Next moment (])"
            aria-label="Next moment"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dimension Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {event.dimension !== 'composite' && (
          <button
            type="button"
            onClick={() => onOpenDimension(event.dimension as DimensionKey)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0B1A2D] border border-[#17324F] text-xs font-mono text-[#DCEFF8] hover:border-[#79C8DF] transition-colors"
          >
            <DimensionGlyph dimension={event.dimension} className="w-3 h-3 text-[#79C8DF]" />
            {event.dimension.replace(/_/g, ' ')}
            <ArrowRight className="w-3 h-3 text-[#7C93A9]" />
          </button>
        )}
        {compoundLabel && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#F2B75B]/20 text-[#F6C77F] border border-[#F2B75B]/40">
            Compound: {compoundLabel}
          </span>
        )}
      </div>

      {/* Metrics Row */}
      {event.metric && (
        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-[#07111F]/60 border border-[#17324F]/70 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#7C93A9]">What was measured:</span>
            <span className="font-bold text-[#DCEFF8]">
              {event.metric.name} {event.metric.value}
            </span>
          </div>
          {event.relative_shift && event.relative_shift.z >= 1.5 && (
            <div className="flex items-center justify-between text-[#F6C77F]">
              <span>Compared with your own baseline:</span>
              <span>Noticeably higher than your usual (+{event.relative_shift.z}σ)</span>
            </div>
          )}
        </div>
      )}

      {/* Why it matters */}
      <div className="text-xs text-[#9AAFC2] leading-relaxed">
        <span className="font-semibold text-[#DCEFF8]">Why it matters: </span>
        {subtypeWhy}
      </div>

      {/* What happened */}
      {timelineItem?.body && (
        <div className="text-xs text-[#9AAFC2] leading-relaxed">
          <span className="font-semibold text-[#DCEFF8]">What happened: </span>
          {timelineItem.body}
        </div>
      )}

      {/* Try this / Keep doing this */}
      {timelineItem?.tip && (
        <div
          className={`p-3 rounded-lg border text-xs leading-relaxed ${
            isStrong
              ? 'bg-[#6FE3B8]/10 border-[#6FE3B8]/30 text-[#8FEBC9]'
              : 'bg-[#79C8DF]/10 border-[#79C8DF]/25 text-[#DCEFF8]'
          }`}
        >
          <span className="font-mono font-bold uppercase tracking-wider block mb-1">
            {isStrong ? 'Keep doing this:' : 'Try this:'}
          </span>
          {timelineItem.tip}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onPlaySpan}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F7FAFC] text-[#07111F] font-medium text-xs hover:bg-[#DCEFF8] hover:shadow-[0_0_12px_#79C8DF] transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Play this moment
        </button>

        {event.dimension !== 'composite' && (
          <button
            type="button"
            onClick={() => onOpenDimension(event.dimension as DimensionKey)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#17324F] text-[#9AAFC2] hover:text-[#F7FAFC] hover:border-[#79C8DF] font-mono text-xs transition-colors"
          >
            Open dimension details
          </button>
        )}
      </div>
    </div>
  );
}
