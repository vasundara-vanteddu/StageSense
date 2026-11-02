import React from 'react';
import { DimensionKey, DimensionSummary, WindowData } from '../../lib/types/report';
import { DimensionGlyph } from '../shared/BandBadge';

interface ChannelStripProps {
  dimensions: DimensionSummary[];
  windows: WindowData[];
  onOpenDimension: (key: DimensionKey) => void;
  className?: string;
}

export function ChannelStrip({
  dimensions,
  windows,
  onOpenDimension,
  className = '',
}: ChannelStripProps) {
  const scoredCount = dimensions.filter((d) => d.available).length;

  return (
    <div className={`flex flex-col gap-4 w-full select-none ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DCEFF8]">
            Dimension Channels
          </h3>
          <p className="text-xs text-[#7C93A9]">
            {scoredCount === 6
              ? 'All six dimensions scored'
              : `Overall is computed from the ${scoredCount} scored dimensions`}
          </p>
        </div>
        <span className="text-xs font-mono text-[#537FA5]">Click channel to inspect</span>
      </div>

      {/* Grid of channels */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {dimensions.map((dim, idx) => {
          const isAvail = dim.available && dim.score !== null;
          const score = dim.score ?? 0;

          // Height of vertical meter
          const meterFillPct = isAvail ? score : 0;

          return (
            <button
              key={dim.key}
              type="button"
              onClick={() => onOpenDimension(dim.key)}
              className={`group flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 ${
                isAvail
                  ? 'bg-[#0B1A2D] border-[#17324F] hover:border-[#79C8DF] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(2,8,16,0.6)]'
                  : 'bg-[#07111F]/70 border-[#17324F]/50 opacity-70'
              }`}
            >
              {/* Top Index & Glyph */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-[11px] font-mono text-[#7C93A9] group-hover:text-[#DCEFF8]">
                  0{idx + 1}
                </span>
                <DimensionGlyph
                  dimension={dim.key}
                  className={`w-4 h-4 ${isAvail ? 'text-[#79C8DF]' : 'text-[#4D647A]'}`}
                />
              </div>

              {/* Vertical Luminous Meter */}
              <div className="relative w-full h-24 bg-[#07111F] rounded-lg border border-[#17324F] p-1 flex items-end justify-center mb-3 overflow-hidden">
                {/* Meter background ticks at 35, 60, 85 */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-1 opacity-30">
                  <div className="w-full h-[1px] bg-[#6FE3B8]" title="85 Strong" />
                  <div className="w-full h-[1px] bg-[#F2B75B]" title="60 Weak" />
                  <div className="w-full h-[1px] bg-[#F2766B]" title="35 Severe" />
                </div>

                {isAvail ? (
                  <div
                    className="w-full bg-[#DCEFF8] rounded-md transition-all duration-500 shadow-[0_0_12px_#79C8DF] group-hover:bg-[#F7FAFC]"
                    style={{ height: `${meterFillPct}%` }}
                  />
                ) : (
                  <div className="w-full h-full hatch-pattern rounded-md opacity-40 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-[#7C93A9] rotate-[-90deg]">
                      EXCLUDED
                    </span>
                  </div>
                )}
              </div>

              {/* Score & Band */}
              <div className="flex flex-col mb-2">
                <span className="font-['Space_Grotesk'] text-3xl font-bold text-[#F7FAFC] tabular-nums leading-none">
                  {isAvail ? dim.score : '—'}
                </span>
                <span className="text-[11px] font-mono font-medium text-[#79C8DF] mt-1">
                  {isAvail ? dim.band : 'Not scored'}
                </span>
              </div>

              {/* Name & Headline metric */}
              <div className="flex flex-col border-t border-[#17324F]/70 pt-2 w-full">
                <span className="text-xs font-semibold text-[#DCEFF8] truncate">
                  {dim.label}
                </span>
                <span className="text-[11px] font-mono text-[#7C93A9] truncate mt-0.5">
                  {isAvail
                    ? `${dim.headline_metric.value} ${dim.headline_metric.unit}`
                    : 'Hands off frame'}
                </span>
              </div>

              {/* Mini state sparkline */}
              <div className="flex items-center gap-[1px] w-full h-2 bg-[#07111F] rounded mt-2 overflow-hidden">
                {windows.slice(0, 30).map((w, wIdx) => {
                  const st = w.states[dim.key];
                  let c = 'bg-[#79C8DF]/20';
                  if (st === 'strong') c = 'bg-[#6FE3B8]';
                  else if (st === 'weak') c = 'bg-[#F2B75B]';
                  else if (st === 'severe') c = 'bg-[#F2766B]';
                  return <div key={wIdx} className={`flex-1 h-full ${c}`} />;
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
