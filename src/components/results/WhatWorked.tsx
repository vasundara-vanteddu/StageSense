import React from 'react';
import { StrengthItem } from '../../lib/types/report';
import { formatTimecode } from '../../lib/format';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface WhatWorkedProps {
  strengths: StrengthItem[];
  onSeekAndSwitch: (t0: number, eventId?: string) => void;
  className?: string;
}

export function WhatWorked({
  strengths,
  onSeekAndSwitch,
  className = '',
}: WhatWorkedProps) {
  return (
    <div className={`flex flex-col gap-3 w-full select-none ${className}`}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#6FE3B8]" />
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6FE3B8]">
          What Worked Well
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {strengths.map((st) => (
          <div
            key={st.event_id}
            className="p-4 rounded-xl bg-[#0B1A2D]/80 border border-[#6FE3B8]/25 hover:border-[#6FE3B8]/50 flex flex-col justify-between transition-colors"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#8FEBC9]">
                <span className="font-semibold">{formatTimecode(st.t0)}–{formatTimecode(st.t1)}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-['Space_Grotesk'] text-sm font-semibold text-[#F7FAFC]">
                {st.title}
              </h4>
              <p className="text-xs text-[#9AAFC2] leading-relaxed">
                {st.body}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSeekAndSwitch(st.t0, st.event_id)}
              className="mt-3 pt-2 border-t border-[#17324F]/70 inline-flex items-center gap-1 text-xs font-mono text-[#8FEBC9] hover:underline"
            >
              <span>Review moment</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RehearsalPlan({
  jobId,
  topImprovements,
  onSeekAndSwitch,
  className = '',
}: {
  jobId: string;
  topImprovements: { rank: number; title: string; t0: number; event_ids: string[]; dimension: string }[];
  onSeekAndSwitch: (t0: number, eventId?: string) => void;
  className?: string;
}) {
  const storageKey = `stagesense.plan.v1.${jobId}`;
  const [checkedIds, setCheckedIds] = React.useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleCheck = (idx: number) => {
    setCheckedIds((prev) => {
      const updated = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const doneCount = checkedIds.length;
  const totalCount = topImprovements.length;

  return (
    <div className={`p-5 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-3 select-none ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DCEFF8]">
            Your Next Rehearsal
          </h3>
          <p className="text-xs text-[#7C93A9]">
            Pick the one thing to focus on next time
          </p>
        </div>
        <span className="text-xs font-mono text-[#79C8DF]">
          {doneCount} of {totalCount} practiced
        </span>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        {topImprovements.map((item, idx) => {
          const isDone = checkedIds.includes(idx);
          return (
            <label
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isDone
                  ? 'bg-[#10243B]/40 border-[#6FE3B8]/30 text-[#8FEBC9]'
                  : 'bg-[#07111F]/70 border-[#17324F] text-[#F7FAFC] hover:border-[#79C8DF]/40'
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleCheck(idx)}
                className="mt-1 w-4 h-4 rounded border-[#17324F] text-[#79C8DF] focus:ring-[#79C8DF] bg-[#07111F] accent-[#79C8DF]"
              />
              <div className="flex-1 flex flex-col">
                <span className={`text-xs font-medium ${isDone ? 'line-through text-[#7C93A9]' : 'text-[#F7FAFC]'}`}>
                  {item.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-[#7C93A9]">
                  <span className="capitalize">{item.dimension.replace(/_/g, ' ')}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSeekAndSwitch(item.t0, item.event_ids[0]);
                    }}
                    className="text-[#79C8DF] hover:underline"
                  >
                    Go to {formatTimecode(item.t0)}
                  </button>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
