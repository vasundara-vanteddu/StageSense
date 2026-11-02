import React from 'react';
import { DimensionKey, EventItem, FeedbackData } from '../../lib/types/report';
import { formatTimecode } from '../../lib/format';
import { getSubtypeLabel } from '../../content/subtypes';
import { DimensionGlyph, StateBadge } from '../shared/BandBadge';
import { EventDetail } from './EventDetail';

interface MomentsPanelProps {
  events: EventItem[];
  feedback: FeedbackData;
  selectedEventId: string | null;
  currentTime: number;
  filterKind: 'all' | 'weak' | 'severe' | 'strong';
  filterDimensions: DimensionKey[];
  onSelectEvent: (id: string | null) => void;
  onFilterKindChange: (k: 'all' | 'weak' | 'severe' | 'strong') => void;
  onToggleDimensionFilter: (d: DimensionKey) => void;
  onPlaySpan: (ev: EventItem) => void;
  onPrevEvent: () => void;
  onNextEvent: () => void;
  onOpenDimension: (d: DimensionKey) => void;
  className?: string;
}

const ALL_DIMENSIONS: DimensionKey[] = [
  'speaking_rate',
  'vocal_expressiveness',
  'pausing_fluency',
  'gestures',
  'posture',
  'visual_engagement',
];

export function MomentsPanel({
  events,
  feedback,
  selectedEventId,
  currentTime,
  filterKind,
  filterDimensions,
  onSelectEvent,
  onFilterKindChange,
  onToggleDimensionFilter,
  onPlaySpan,
  onPrevEvent,
  onNextEvent,
  onOpenDimension,
  className = '',
}: MomentsPanelProps) {
  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (filterKind !== 'all') {
      if (filterKind === 'weak' && ev.severity !== 'weak') return false;
      if (filterKind === 'severe' && ev.severity !== 'severe') return false;
      if (filterKind === 'strong' && ev.severity !== 'strong') return false;
    }
    if (filterDimensions.length > 0) {
      if (ev.dimension !== 'composite' && !filterDimensions.includes(ev.dimension as DimensionKey)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className={`flex flex-col gap-3 w-full h-full ${className}`}>
      {/* Filter Row */}
      <div className="flex flex-col gap-2 pb-2 border-b border-[#17324F]/70">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'weak', 'severe', 'strong'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onFilterKindChange(k)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition-colors ${
                filterKind === k
                  ? 'bg-[#79C8DF]/20 text-[#DCEFF8] border border-[#79C8DF]/60'
                  : 'bg-[#0B1A2D] text-[#7C93A9] border border-[#17324F] hover:text-[#F7FAFC]'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Dimension filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {ALL_DIMENSIONS.map((dim) => {
            const isChecked = filterDimensions.includes(dim);
            return (
              <button
                key={dim}
                type="button"
                onClick={() => onToggleDimensionFilter(dim)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors shrink-0 ${
                  isChecked
                    ? 'bg-[#79C8DF]/30 text-[#DCEFF8] border border-[#79C8DF]'
                    : 'bg-[#07111F] text-[#7C93A9] border border-[#17324F]/80 hover:text-[#9AAFC2]'
                }`}
              >
                <DimensionGlyph dimension={dim} className="w-3 h-3 text-[#79C8DF]" />
                {dim === 'speaking_rate'
                  ? 'Pace'
                  : dim === 'vocal_expressiveness'
                  ? 'Voice'
                  : dim === 'pausing_fluency'
                  ? 'Pauses'
                  : dim === 'gestures'
                  ? 'Hands'
                  : dim === 'posture'
                  ? 'Posture'
                  : 'Focus'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[580px] pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-[#7C93A9] border border-dashed border-[#17324F] rounded-xl p-4">
            No moments match these filters.
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const isSelected = selectedEventId === ev.id;
            const isNow = currentTime >= ev.t0 && currentTime <= ev.t1;
            const timelineItem = feedback.timeline_items.find((t) => t.event_id === ev.id);

            return (
              <div key={ev.id} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onSelectEvent(isSelected ? null : ev.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#10243B] border-[#79C8DF] shadow-[0_0_12px_rgba(121,200,223,0.15)] ring-1 ring-[#79C8DF]/50'
                      : isNow
                      ? 'bg-[#0B1A2D] border-[#79C8DF]/50'
                      : 'bg-[#0B1A2D]/80 border-[#17324F] hover:border-[#17324F]/80 hover:bg-[#10243B]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#79C8DF] shrink-0">
                      CUE {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#F7FAFC] truncate">
                          {getSubtypeLabel(ev.subtype)}
                        </span>
                        {isNow && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#6FE3B8]/20 text-[#8FEBC9] border border-[#6FE3B8]/40 animate-pulse">
                            NOW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#7C93A9]">
                        <span>{formatTimecode(ev.t0)}–{formatTimecode(ev.t1)}</span>
                        <span>·</span>
                        <span className="capitalize">{ev.dimension.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <StateBadge state={ev.severity} size="sm" />
                    {/* Mini score bar */}
                    <div className="w-8 h-1.5 bg-[#07111F] rounded-full overflow-hidden border border-[#17324F]">
                      <div
                        className={`h-full ${
                          ev.severity === 'strong'
                            ? 'bg-[#6FE3B8]'
                            : ev.severity === 'weak'
                            ? 'bg-[#F2B75B]'
                            : 'bg-[#F2766B]'
                        }`}
                        style={{ width: `${ev.mean_score}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Inline Expanded Detail */}
                {isSelected && (
                  <EventDetail
                    event={ev}
                    timelineItem={timelineItem}
                    onPlaySpan={() => onPlaySpan(ev)}
                    onPrev={onPrevEvent}
                    onNext={onNextEvent}
                    onOpenDimension={onOpenDimension}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
