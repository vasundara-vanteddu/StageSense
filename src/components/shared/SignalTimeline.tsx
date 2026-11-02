import React, { useRef, useState, useMemo } from 'react';
import { DimensionKey, EventItem, WindowData, WindowState } from '../../lib/types/report';
import { formatTimecode } from '../../lib/format';
import { AlertTriangle } from 'lucide-react';
import { DimensionGlyph } from './BandBadge';

interface SignalTimelineProps {
  windows: WindowData[];
  events?: EventItem[];
  duration: number;
  mode?: 'skyline' | 'lanes' | 'compact';
  height?: number;
  interactive?: boolean;
  currentTime?: number;
  selectedEventId?: string | null;
  onSeek?: (t: number) => void;
  onSelectEvent?: (id: string) => void;
  className?: string;
}

const DIMENSION_KEYS: DimensionKey[] = [
  'speaking_rate',
  'vocal_expressiveness',
  'pausing_fluency',
  'gestures',
  'posture',
  'visual_engagement',
];

const DIMENSION_SHORT_LABELS: Record<DimensionKey, string> = {
  speaking_rate: '01 Pace',
  vocal_expressiveness: '02 Voice',
  pausing_fluency: '03 Pauses',
  gestures: '04 Hands',
  posture: '05 Posture',
  visual_engagement: '06 Focus',
};

export function SignalTimeline({
  windows,
  events = [],
  duration,
  mode = 'skyline',
  height = 90,
  interactive = true,
  currentTime = 0,
  selectedEventId,
  onSeek,
  onSelectEvent,
  className = '',
}: SignalTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<1 | 2 | 4>(1);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Compute 5-second hop slots: slot index s has time t = s * 5
  // Value = mean of the up-to-two windows covering it
  const hopSlots = useMemo(() => {
    if (!windows || windows.length === 0) return [];
    const nSlots = Math.ceil(duration / 5);
    const slots: { slotIndex: number; t: number; composite: number; state: WindowState }[] = [];

    for (let s = 0; s < nSlots; s++) {
      const t = s * 5;
      const covering = windows.filter((w) => t >= w.t0 && t <= w.t1);
      let composite = 70;
      if (covering.length > 0) {
        composite = Math.round(covering.reduce((acc, w) => acc + w.composite, 0) / covering.length);
      }

      let state: WindowState = 'normal';
      if (composite < 35) state = 'severe';
      else if (composite < 60) state = 'weak';
      else if (composite >= 85) state = 'strong';

      slots.push({ slotIndex: s, t, composite, state });
    }
    return slots;
  }, [windows, duration]);

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = x / rect.width;
    const t = pct * duration;
    setHoverX(x);
    setHoverTime(t);

    if (e.buttons === 1 || isDragging) {
      onSeek?.(t);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    setIsDragging(true);
    handlePointer(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (mode === 'compact') {
    return (
      <div className={`relative h-6 w-full flex items-end gap-[1px] select-none ${className}`}>
        {hopSlots.map((slot) => {
          const hPct = Math.max(15, Math.min(100, slot.composite));
          let bg = 'bg-[#79C8DF]/30';
          if (slot.state === 'strong') bg = 'bg-[#6FE3B8]/70';
          else if (slot.state === 'weak') bg = 'bg-[#F2B75B]/70';
          else if (slot.state === 'severe') bg = 'bg-[#F2766B] hatch-pattern';

          return (
            <div
              key={slot.slotIndex}
              className={`flex-1 rounded-[1px] ${bg}`}
              style={{ height: `${hPct}%` }}
              title={`${formatTimecode(slot.t)}: score ${slot.composite}`}
            />
          );
        })}
      </div>
    );
  }

  if (mode === 'skyline') {
    return (
      <div className={`relative flex flex-col w-full select-none ${className}`}>
        {/* Skyline Stage */}
        <div
          ref={containerRef}
          onPointerMove={handlePointer}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setHoverX(null);
            setHoverTime(null);
            setIsDragging(false);
          }}
          className={`relative w-full overflow-hidden bg-[#07111F]/60 border border-[#17324F] rounded-xl px-2 py-3 ${
            interactive ? 'cursor-pointer' : ''
          }`}
          style={{ height }}
          role="slider"
          aria-label="Presentation skyline timeline"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTimecode(currentTime)} of ${formatTimecode(duration)}`}
          tabIndex={interactive ? 0 : -1}
          onKeyDown={(e) => {
            if (!interactive) return;
            if (e.key === 'ArrowRight') onSeek?.(Math.min(duration, currentTime + 5));
            if (e.key === 'ArrowLeft') onSeek?.(Math.max(0, currentTime - 5));
          }}
        >
          {/* Luminous Baseline */}
          <div className="absolute top-[68%] left-0 right-0 h-[1.5px] bg-[#79C8DF] shadow-[0_0_8px_#79C8DF]" />

          {/* Event cue markers flags on top */}
          {events.map((ev, idx) => {
            const evLeftPct = (ev.t0 / duration) * 100;
            const isSelected = selectedEventId === ev.id;
            let flagBorder = 'border-[#79C8DF] text-[#79C8DF]';
            if (ev.severity === 'strong') flagBorder = 'border-[#6FE3B8] text-[#8FEBC9] bg-[#6FE3B8]/20';
            else if (ev.severity === 'weak') flagBorder = 'border-[#F2B75B] text-[#F6C77F] bg-[#F2B75B]/20';
            else if (ev.severity === 'severe') flagBorder = 'border-[#F2766B] text-[#F8978D] bg-[#F2766B]/20';

            return (
              <button
                key={ev.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent?.(ev.id);
                  onSeek?.(ev.t0);
                }}
                className={`absolute top-1 transform -translate-x-1/2 flex flex-col items-center group z-20 focus:outline-none`}
                style={{ left: `${evLeftPct}%` }}
                title={`${ev.id.toUpperCase()}: ${ev.subtype} (${formatTimecode(ev.t0)}–${formatTimecode(ev.t1)})`}
              >
                <span
                  className={`px-1 py-0.5 rounded text-[9px] font-mono tracking-wider border font-bold ${flagBorder} ${
                    isSelected ? 'ring-2 ring-[#F7FAFC] scale-110 shadow-[0_0_10px_#79C8DF]' : ''
                  }`}
                >
                  CUE {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="w-[1px] h-3 bg-[#17324F] group-hover:bg-[#79C8DF]" />
              </button>
            );
          })}

          {/* Vertical Skyline Bars */}
          <div className="absolute top-[18px] bottom-[32%] left-2 right-2 flex items-end gap-[2px]">
            {hopSlots.map((slot) => {
              const hPct = Math.max(12, Math.min(100, slot.composite));
              let fillClass = 'bg-[#DCEFF8]/35';
              let isSevere = false;

              if (slot.state === 'strong') fillClass = 'bg-[#6FE3B8]/80';
              else if (slot.state === 'weak') fillClass = 'bg-[#F2B75B]/80';
              else if (slot.state === 'severe') {
                fillClass = 'bg-[#F2766B]';
                isSevere = true;
              }

              return (
                <div
                  key={slot.slotIndex}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <div
                    className={`w-full rounded-t-[2px] ${fillClass} ${isSevere ? 'hatch-pattern relative' : ''}`}
                    style={{ height: `${hPct}%` }}
                  >
                    {isSevere && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-[#F2766B] font-bold">
                        !
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mirrored Reflection below baseline */}
          <div className="absolute top-[68%] bottom-0 left-2 right-2 flex items-start gap-[2px] opacity-15 overflow-hidden">
            {hopSlots.map((slot) => {
              const hPct = Math.round(slot.composite * 0.35);
              return (
                <div
                  key={`refl-${slot.slotIndex}`}
                  className="flex-1 bg-[#79C8DF] rounded-b-[1px]"
                  style={{ height: `${hPct}%` }}
                />
              );
            })}
          </div>

          {/* Playhead Vertical Beam */}
          <div
            className="absolute top-0 bottom-0 w-[1.5px] bg-[#F7FAFC] shadow-[0_0_12px_#79C8DF] z-30 pointer-events-none"
            style={{ left: `${playheadPct}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#79C8DF] shadow-[0_0_6px_#DCEFF8]" />
          </div>

          {/* Hover Crosshair & Tooltip */}
          {hoverX !== null && hoverTime !== null && (
            <>
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-[#A5DCEC]/50 z-25 pointer-events-none"
                style={{ left: `${hoverX}px` }}
              />
              <div
                className="absolute -top-7 z-40 bg-[#0B1A2D] text-[#DCEFF8] text-[10px] font-mono px-2 py-0.5 rounded border border-[#17324F] shadow-lg pointer-events-none transform -translate-x-1/2"
                style={{ left: `${hoverX}px` }}
              >
                {formatTimecode(hoverTime)}
              </div>
            </>
          )}
        </div>

        {/* Bottom Time Range Indicators */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7C93A9] px-1 mt-1">
          <span>00:00</span>
          <span className="text-[#DCEFF8]">{formatTimecode(currentTime)}</span>
          <span>{formatTimecode(duration)}</span>
        </div>
      </div>
    );
  }

  // 3. Lanes mode (Session timeline)
  return (
    <div className={`relative flex flex-col w-full bg-[#0B1A2D]/80 border border-[#17324F] rounded-2xl p-4 select-none ${className}`}>
      {/* Header controls: Zoom buttons & mini map */}
      <div className="flex items-center justify-between pb-3 border-b border-[#17324F]/70 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold tracking-wider uppercase text-[#DCEFF8]">
            Timeline Lanes
          </span>
          <span className="text-xs font-mono text-[#7C93A9]">
            {hopSlots.length} windows · 5s hop
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#7C93A9]">Zoom</span>
          {([1, 2, 4] as const).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={`px-2 py-0.5 rounded text-xs font-mono font-medium border transition-colors ${
                zoom === z
                  ? 'border-[#79C8DF] bg-[#79C8DF]/20 text-[#DCEFF8]'
                  : 'border-[#17324F] text-[#7C93A9] hover:text-[#F7FAFC]'
              }`}
            >
              {z}×
            </button>
          ))}
        </div>
      </div>

      {/* Main lanes container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointer}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHoverX(null);
          setHoverTime(null);
          setIsDragging(false);
        }}
        className={`relative w-full overflow-x-auto ${interactive ? 'cursor-pointer' : ''}`}
        role="slider"
        aria-label="Multi-lane delivery timeline"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTimecode(currentTime)} of ${formatTimecode(duration)}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek?.(Math.min(duration, currentTime + 5));
          if (e.key === 'ArrowLeft') onSeek?.(Math.max(0, currentTime - 5));
        }}
      >
        <div
          className="relative flex flex-col gap-2 min-w-full"
          style={{ width: `${zoom * 100}%` }}
        >
          {/* Top Composite Strip */}
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-mono font-semibold text-[#DCEFF8]">
              Composite
            </span>
            <div className="relative flex-1 h-7 bg-[#07111F] rounded border border-[#17324F] flex items-center px-1 overflow-hidden">
              <div className="flex items-end w-full h-full gap-[1px]">
                {hopSlots.map((slot) => {
                  let bg = 'bg-[#79C8DF]/35';
                  if (slot.state === 'strong') bg = 'bg-[#6FE3B8]/80';
                  else if (slot.state === 'weak') bg = 'bg-[#F2B75B]/80';
                  else if (slot.state === 'severe') bg = 'bg-[#F2766B] hatch-pattern';

                  return (
                    <div
                      key={slot.slotIndex}
                      className={`flex-1 rounded-[1px] ${bg}`}
                      style={{ height: `${Math.max(20, slot.composite)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Six Dimension Lanes */}
          {DIMENSION_KEYS.map((dimKey) => {
            const dimEvents = events.filter((e) => e.dimension === dimKey);

            return (
              <div key={dimKey} className="flex items-center gap-3">
                <span className="w-24 shrink-0 flex items-center gap-1.5 text-xs font-mono text-[#9AAFC2] truncate">
                  <DimensionGlyph dimension={dimKey} className="w-3.5 h-3.5 text-[#79C8DF]" />
                  {DIMENSION_SHORT_LABELS[dimKey]}
                </span>

                <div className="relative flex-1 h-6 bg-[#07111F] rounded border border-[#17324F]/70 flex items-center overflow-hidden">
                  {/* Background window state cells */}
                  <div className="flex items-center w-full h-full gap-[1px] px-0.5">
                    {windows.map((w, wIdx) => {
                      const st = w.states[dimKey];
                      let cellBg = 'bg-[#79C8DF]/10';
                      if (st === 'strong') cellBg = 'bg-[#6FE3B8]/25';
                      else if (st === 'weak') cellBg = 'bg-[#F2B75B]/25';
                      else if (st === 'severe') cellBg = 'bg-[#F2766B]/30 hatch-pattern-subtle';
                      else if (st === null) cellBg = 'bg-transparent';

                      return (
                        <div
                          key={wIdx}
                          className={`flex-1 h-4 rounded-[2px] ${cellBg}`}
                        />
                      );
                    })}
                  </div>

                  {/* Dimension Event Spans overlaid */}
                  {dimEvents.map((ev) => {
                    const evStartPct = (ev.t0 / duration) * 100;
                    const evWidthPct = Math.max(1.5, ((ev.t1 - ev.t0) / duration) * 100);
                    const isSelected = selectedEventId === ev.id;

                    let spanBg = 'bg-[#F2B75B]/75 border-[#F2B75B] text-[#07111F]';
                    if (ev.severity === 'strong') spanBg = 'bg-[#6FE3B8]/85 border-[#6FE3B8] text-[#07111F]';
                    else if (ev.severity === 'severe') spanBg = 'bg-[#F2766B] border-[#F2766B] text-[#F7FAFC] hatch-pattern';

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent?.(ev.id);
                          onSeek?.(ev.t0);
                        }}
                        className={`absolute top-0.5 bottom-0.5 rounded px-1.5 flex items-center justify-between text-[9px] font-mono font-bold border transition-all z-10 ${spanBg} ${
                          isSelected ? 'ring-2 ring-[#F7FAFC] shadow-[0_0_8px_#79C8DF] z-20' : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{ left: `${evStartPct}%`, width: `${evWidthPct}%` }}
                        title={`${ev.id.toUpperCase()}: ${ev.subtype} (${formatTimecode(ev.t0)}–${formatTimecode(ev.t1)})`}
                      >
                        <span className="truncate">{ev.id.toUpperCase()}</span>
                        {ev.severity === 'severe' && <AlertTriangle className="w-2.5 h-2.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Playhead vertical beam through all lanes */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#F7FAFC] shadow-[0_0_12px_#79C8DF] z-30 pointer-events-none"
            style={{ left: `calc(96px + (100% - 96px) * ${playheadPct / 100})` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#79C8DF] shadow-[0_0_8px_#DCEFF8]" />
          </div>

          {/* Hover Crosshair */}
          {hoverX !== null && hoverX > 96 && (
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-[#A5DCEC]/40 z-25 pointer-events-none"
              style={{ left: `${hoverX}px` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
