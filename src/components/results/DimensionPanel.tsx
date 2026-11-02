import React from 'react';
import { DimensionKey, DimensionSummary, EventItem, WindowData } from '../../lib/types/report';
import { DIMENSIONS_CONTENT } from '../../content/dimensions';
import { DimensionGlyph, BandBadge, BandCurve } from '../shared/BandBadge';
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { DEFAULT_METHODOLOGY } from '../../mocks/methodology';

interface DimensionPanelProps {
  dimensionKey: DimensionKey;
  dimensionSummary: DimensionSummary;
  windows: WindowData[];
  events: EventItem[];
  allKeys: DimensionKey[];
  onSelectDimension: (d: DimensionKey) => void;
  onClose: () => void;
  onSelectEvent: (eventId: string) => void;
  className?: string;
}

export function DimensionPanel({
  dimensionKey,
  dimensionSummary,
  windows,
  events,
  allKeys,
  onSelectDimension,
  onClose,
  onSelectEvent,
  className = '',
}: DimensionPanelProps) {
  const content = DIMENSIONS_CONTENT[dimensionKey];
  const currIdx = allKeys.indexOf(dimensionKey);

  const prevKey = currIdx > 0 ? allKeys[currIdx - 1] : allKeys[allKeys.length - 1];
  const nextKey = currIdx < allKeys.length - 1 ? allKeys[currIdx + 1] : allKeys[0];

  const dimEvents = events.filter((e) => e.dimension === dimensionKey);

  // Count states in windows
  let severeCount = 0;
  let weakCount = 0;
  let normalCount = 0;
  let strongCount = 0;

  windows.forEach((w) => {
    const st = w.states[dimensionKey];
    if (st === 'severe') severeCount++;
    else if (st === 'weak') weakCount++;
    else if (st === 'normal') normalCount++;
    else if (st === 'strong') strongCount++;
  });

  const totalScored = severeCount + weakCount + normalCount + strongCount;

  // Bands for BandCurve
  let bandTuple: [number, number, number, number] | [number, number] = [90, 130, 175, 215];
  if (dimensionKey === 'speaking_rate') bandTuple = DEFAULT_METHODOLOGY.bands.speaking_rate;
  else if (dimensionKey === 'vocal_expressiveness') bandTuple = DEFAULT_METHODOLOGY.bands.vocal_pitch;
  else if (dimensionKey === 'pausing_fluency') bandTuple = DEFAULT_METHODOLOGY.bands.pause_ratio;
  else if (dimensionKey === 'gestures') bandTuple = DEFAULT_METHODOLOGY.bands.gestures;
  else if (dimensionKey === 'posture') bandTuple = DEFAULT_METHODOLOGY.bands.posture_sway;
  else if (dimensionKey === 'visual_engagement') bandTuple = DEFAULT_METHODOLOGY.bands.facing_fraction;

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl bg-[#08101F]/95 backdrop-blur-xl border-l border-[#17324F] shadow-2xl flex flex-col overflow-y-auto ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dimension-panel-title"
    >
      {/* Top Header Bar */}
      <div className="sticky top-0 bg-[#08101F]/95 backdrop-blur-md border-b border-[#17324F] p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectDimension(prevKey)}
            className="p-1.5 rounded-lg border border-[#17324F] hover:border-[#79C8DF] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
            title="Previous dimension"
            aria-label="Previous dimension"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectDimension(nextKey)}
            className="p-1.5 rounded-lg border border-[#17324F] hover:border-[#79C8DF] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
            title="Next dimension"
            aria-label="Next dimension"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-[#7C93A9] ml-1">
            DIMENSION {content.index} OF 06
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg border border-[#17324F] hover:border-[#F2766B] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
          title="Close panel (Esc)"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="p-6 flex flex-col gap-6">
        {/* Title and Score Hero */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <DimensionGlyph dimension={dimensionKey} className="w-5 h-5 text-[#79C8DF]" />
              <h2 id="dimension-panel-title" className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
                {content.name}
              </h2>
            </div>
            <p className="text-sm text-[#9AAFC2]">{content.oneLiner}</p>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="font-['Space_Grotesk'] text-4xl font-bold text-[#F7FAFC] tabular-nums">
              {dimensionSummary.score ?? '—'}
            </span>
            <BandBadge band={dimensionSummary.band} />
          </div>
        </div>

        {/* Weight & Contribution Box */}
        <div className="p-3 rounded-xl bg-[#0B1A2D] border border-[#17324F] flex items-center justify-between text-xs font-mono">
          <span className="text-[#7C93A9]">Overall weighting:</span>
          <span className="text-[#DCEFF8] font-semibold">
            Contributes {Math.round(dimensionSummary.weight * 100)}% of the overall score
          </span>
        </div>

        {/* What was measured */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#79C8DF] font-semibold">
            What was measured
          </h3>
          <p className="text-sm text-[#DCEFF8] leading-relaxed">
            {content.whatIsMeasured}
          </p>
          <span className="text-xs font-mono text-[#7C93A9] bg-[#07111F] p-2 rounded border border-[#17324F]/70">
            Signal: {content.measures}
          </span>
        </div>

        {/* How it's calculated */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#79C8DF] font-semibold">
              How it is calculated
            </h3>
            <span className="text-[10px] font-mono text-[#7C93A9] uppercase">Heuristic score</span>
          </div>
          <p className="text-sm text-[#9AAFC2] leading-relaxed">
            {content.howCalculated}
          </p>
          <div className="p-2.5 rounded-lg bg-[#07111F] border border-[#17324F] font-mono text-xs text-[#A5DCEC] overflow-x-auto">
            {dimensionSummary.how_calculated.formula}
          </div>
        </div>

        {/* The Scoring Curve */}
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#0B1A2D] border border-[#17324F]">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#DCEFF8] font-semibold">
            Scoring Curve
          </h3>
          <p className="text-xs text-[#7C93A9]">
            The shaded corridor scores 100. Outside it, the score falls toward 0 at outer bounds.
          </p>
          <div className="mt-2">
            <BandCurve
              bands={bandTuple}
              value={dimensionSummary.headline_metric.value}
              unit={dimensionSummary.headline_metric.unit}
              width={340}
              height={75}
            />
          </div>
        </div>

        {/* Your Numbers (Stats & Window breakdown) */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#79C8DF] font-semibold">
            Your Numbers
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#0B1A2D] border border-[#17324F]">
              <span className="text-[#7C93A9] block text-[11px]">Windows Scored</span>
              <span className="text-base font-bold text-[#F7FAFC]">{totalScored}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B1A2D] border border-[#17324F]">
              <span className="text-[#7C93A9] block text-[11px]">% Windows OK (≥60)</span>
              <span className="text-base font-bold text-[#6FE3B8]">{dimensionSummary.pct_windows_ok}%</span>
            </div>
          </div>

          {/* Stacked state breakdown bar */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-[#7C93A9]">Window State Breakdown</span>
            <div className="h-4 w-full bg-[#07111F] rounded-full overflow-hidden flex border border-[#17324F]">
              {strongCount > 0 && (
                <div
                  className="bg-[#6FE3B8]"
                  style={{ width: `${(strongCount / (totalScored || 1)) * 100}%` }}
                  title={`Strong: ${strongCount} windows`}
                />
              )}
              {normalCount > 0 && (
                <div
                  className="bg-[#79C8DF]/50"
                  style={{ width: `${(normalCount / (totalScored || 1)) * 100}%` }}
                  title={`Normal: ${normalCount} windows`}
                />
              )}
              {weakCount > 0 && (
                <div
                  className="bg-[#F2B75B]"
                  style={{ width: `${(weakCount / (totalScored || 1)) * 100}%` }}
                  title={`Weak: ${weakCount} windows`}
                />
              )}
              {severeCount > 0 && (
                <div
                  className="bg-[#F2766B] hatch-pattern"
                  style={{ width: `${(severeCount / (totalScored || 1)) * 100}%` }}
                  title={`Severe: ${severeCount} windows`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#7C93A9]">
              <span className="text-[#8FEBC9]">{strongCount} Strong</span>
              <span className="text-[#A5DCEC]">{normalCount} Normal</span>
              <span className="text-[#F6C77F]">{weakCount} Weak</span>
              <span className="text-[#F8978D]">{severeCount} Severe</span>
            </div>
          </div>
        </div>

        {/* Moments in this dimension */}
        {dimEvents.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#79C8DF] font-semibold">
              Moments In This Dimension ({dimEvents.length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {dimEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => {
                    onSelectEvent(ev.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-[#0B1A2D] border border-[#17324F] hover:border-[#79C8DF] flex items-center justify-between text-left text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#79C8DF] font-bold">{ev.id.toUpperCase()}</span>
                    <span className="text-[#F7FAFC] font-medium">{ev.subtype.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#7C93A9]">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Low and High reading interpretations */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0B1A2D] border border-[#17324F] text-xs">
          <div>
            <span className="font-semibold text-[#F2B75B] block mb-1">What a low reading indicates:</span>
            <p className="text-[#9AAFC2]">{content.lowReadingMeaning}</p>
          </div>
          <div>
            <span className="font-semibold text-[#6FE3B8] block mb-1">What a high reading indicates:</span>
            <p className="text-[#9AAFC2]">{content.highReadingMeaning}</p>
          </div>
        </div>

        {/* Limits and honest caveats */}
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#17324F]/30 border border-[#F2B75B]/30 text-xs">
          <span className="font-mono font-bold text-[#F6C77F] uppercase tracking-wider">
            Limits & Measurement Caveats
          </span>
          <p className="text-[#DCEFF8] leading-relaxed">{content.limits}</p>
          <div className="mt-1 pt-2 border-t border-[#17324F] text-[11px] font-mono text-[#7C93A9]">
            Validation status: Not yet validated against human raters.
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-2 pb-6 border-t border-[#17324F]">
          <a
            href="/methodology"
            className="inline-flex items-center gap-1 text-xs font-mono text-[#79C8DF] hover:text-[#A5DCEC] hover:underline"
          >
            Read the complete methodology documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
