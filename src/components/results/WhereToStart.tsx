import React from 'react';
import { DimensionKey, TopImprovement } from '../../lib/types/report';
import { DimensionGlyph } from '../shared/BandBadge';
import { formatTimecode } from '../../lib/format';
import { ArrowRight } from 'lucide-react';

interface WhereToStartProps {
  topImprovements: TopImprovement[];
  onSeekAndSwitch: (t0: number, eventId?: string) => void;
  className?: string;
}

const ROMAN_NUMERALS = ['I', 'II', 'III'];

export function WhereToStart({
  topImprovements,
  onSeekAndSwitch,
  className = '',
}: WhereToStartProps) {
  return (
    <div className={`flex flex-col gap-4 w-full select-none ${className}`}>
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DCEFF8]">
          Where To Start
        </h3>
        <p className="text-xs text-[#7C93A9]">
          The three highest-impact moments to review first
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topImprovements.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between p-5 rounded-2xl bg-[#0B1A2D] border border-[#17324F] hover:border-[#79C8DF]/50 transition-colors"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-['Fraunces'] text-2xl font-light italic text-[#79C8DF]">
                  {ROMAN_NUMERALS[idx]}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9AAFC2] uppercase">
                  <DimensionGlyph dimension={item.dimension as DimensionKey} className="w-3.5 h-3.5 text-[#79C8DF]" />
                  {item.dimension.replace(/_/g, ' ')}
                </span>
              </div>

              <h4 className="font-['Space_Grotesk'] text-base font-semibold text-[#F7FAFC] leading-snug">
                {item.title}
              </h4>
              <p className="text-xs text-[#9AAFC2] leading-relaxed">
                {item.body}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#17324F]/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onSeekAndSwitch(item.t0, item.event_ids[0])}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#79C8DF] hover:text-[#A5DCEC] hover:underline group"
              >
                <span>Go to {formatTimecode(item.t0)}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
