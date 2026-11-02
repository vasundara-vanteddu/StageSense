import React from 'react';
import { Band, DimensionKey, WindowState } from '../../lib/types/report';
import { Gauge, AudioLines, Pause, Hand, PersonStanding, ScanFace, AlertTriangle } from 'lucide-react';
import { formatTimecode } from '../../lib/format';

export function BandBadge({ band, className = '' }: { band: Band | null | string; className?: string }) {
  if (!band) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-dashed border-[#7C93A9]/40 text-[#7C93A9] ${className}`}>
        NOT SCORED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider font-semibold border border-[#DCEFF8]/30 bg-[#10243B]/60 text-[#DCEFF8] shadow-sm ${className}`}
    >
      {band.toUpperCase()}
    </span>
  );
}

export function StateBadge({
  state,
  size = 'md',
  className = '',
}: {
  state: WindowState | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  if (!state) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono rounded border border-dashed border-[#7C93A9]/40 text-[#7C93A9] ${pad} ${className}`}
      >
        Not scored
      </span>
    );
  }

  if (state === 'strong') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-[#6FE3B8]/30 bg-[#6FE3B8]/15 text-[#8FEBC9] ${pad} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#6FE3B8]" />
        Strong
      </span>
    );
  }

  if (state === 'weak') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-[#F2B75B]/30 bg-[#F2B75B]/15 text-[#F6C77F] ${pad} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#F2B75B]" />
        Weak
      </span>
    );
  }

  if (state === 'severe') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-[#F2766B]/40 bg-[#F2766B]/20 text-[#F8978D] hatch-pattern-subtle ${pad} ${className}`}
      >
        <AlertTriangle className="w-3 h-3 text-[#F2766B]" />
        Severe
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono rounded border border-[#79C8DF]/20 bg-[#79C8DF]/10 text-[#A5DCEC] ${pad} ${className}`}
    >
      Normal
    </span>
  );
}

export function DimensionGlyph({
  dimension,
  className = 'w-4 h-4',
}: {
  dimension: DimensionKey | string;
  className?: string;
}) {
  switch (dimension) {
    case 'speaking_rate':
      return <Gauge className={className} strokeWidth={1.5} />;
    case 'vocal_expressiveness':
      return <AudioLines className={className} strokeWidth={1.5} />;
    case 'pausing_fluency':
      return <Pause className={className} strokeWidth={1.5} />;
    case 'gestures':
      return <Hand className={className} strokeWidth={1.5} />;
    case 'posture':
      return <PersonStanding className={className} strokeWidth={1.5} />;
    case 'visual_engagement':
      return <ScanFace className={className} strokeWidth={1.5} />;
    default:
      return <Gauge className={className} strokeWidth={1.5} />;
  }
}

export function Timecode({
  seconds,
  onClick,
  className = '',
}: {
  seconds: number;
  onClick?: () => void;
  className?: string;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center font-mono tabular-nums text-xs text-[#79C8DF] hover:text-[#A5DCEC] hover:underline focus:outline-none focus:ring-1 focus:ring-[#79C8DF] rounded px-1 -mx-1 transition-colors ${className}`}
      >
        {formatTimecode(seconds)}
      </button>
    );
  }

  return (
    <span className={`font-mono tabular-nums text-xs text-[#9AAFC2] ${className}`}>
      {formatTimecode(seconds)}
    </span>
  );
}

export function BandCurve({
  bands,
  value,
  unit = '',
  width = 240,
  height = 70,
  className = '',
}: {
  bands: [number, number, number, number] | [number, number];
  value: number;
  unit?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const isFour = bands.length === 4;
  const min = isFour ? bands[0] : 0;
  const max = isFour ? bands[3] : bands[1] * 1.5;
  const range = max - min || 1;

  const toX = (v: number) => {
    const clamped = Math.max(min, Math.min(max, v));
    return 10 + ((clamped - min) / range) * (width - 20);
  };

  const padY = 12;
  const topY = padY;
  const bottomY = height - padY;

  let pathD = '';
  let targetAreaD = '';

  if (isFour) {
    const [a, b, c, d] = bands as [number, number, number, number];
    const xa = toX(a);
    const xb = toX(b);
    const xc = toX(c);
    const xd = toX(d);

    pathD = `M ${xa} ${bottomY} L ${xb} ${topY} L ${xc} ${topY} L ${xd} ${bottomY}`;
    targetAreaD = `M ${xb} ${topY} L ${xc} ${topY} L ${xc} ${bottomY} L ${xb} ${bottomY} Z`;
  } else {
    // Lower is better or higher is better
    const [tLow, tHigh] = bands as [number, number];
    const x1 = toX(tLow);
    const x2 = toX(tHigh);
    pathD = `M 10 ${topY} L ${x1} ${topY} L ${x2} ${bottomY} L ${width - 10} ${bottomY}`;
    targetAreaD = `M 10 ${topY} L ${x1} ${topY} L ${x1} ${bottomY} L 10 ${bottomY} Z`;
  }

  const userX = toX(value);

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Baseline */}
        <line x1="5" y1={bottomY} x2={width - 5} y2={bottomY} stroke="rgba(190, 220, 245, 0.2)" strokeWidth="1" />

        {/* Target 100-score Shaded Corridor */}
        <path d={targetAreaD} fill="rgba(121, 200, 223, 0.12)" />

        {/* Scoring Trapezoid Curve */}
        <path d={pathD} fill="none" stroke="#79C8DF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* User Metric Indicator Line */}
        <line
          x1={userX}
          y1={topY - 4}
          x2={userX}
          y2={bottomY}
          stroke="#F7FAFC"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        <circle cx={userX} cy={topY - 4} r="3" fill="#79C8DF" stroke="#F7FAFC" strokeWidth="1" />
      </svg>
      <div className="flex items-center justify-between text-[10px] font-mono text-[#7C93A9] mt-1">
        <span>Min {min}</span>
        <span className="text-[#DCEFF8] font-semibold">
          Your metric: {value} {unit}
        </span>
        <span>Max {max}</span>
      </div>
    </div>
  );
}

export function SpeakerFrame({
  className = '',
  aspectRatio = '16/9',
}: {
  className?: string;
  aspectRatio?: string;
}) {
  return (
    <div
      className={`relative w-full bg-[#02050B] overflow-hidden flex items-center justify-center border border-[#17324F] rounded-2xl ${className}`}
      style={{ aspectRatio }}
      role="img"
      aria-label="Speaker rehearsal video stage placeholder"
    >
      {/* Corner Frame Marks */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#79C8DF]/50" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#79C8DF]/50" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#79C8DF]/50" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#79C8DF]/50" />

      {/* Schematic speaker overlay drawn in cyan */}
      <svg width="260" height="200" viewBox="0 0 260 200" fill="none" className="text-[#79C8DF]/70">
        {/* Head-orientation ±20° cone from top-down representation */}
        <path d="M130 55 L95 20 M130 55 L165 20" stroke="#79C8DF" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
        <path d="M110 32 A 30 30 0 0 1 150 32" stroke="#79C8DF" strokeWidth="1" fill="none" opacity="0.3" />

        {/* Head Circle */}
        <circle cx="130" cy="55" r="22" stroke="currentColor" strokeWidth="1.5" />
        {/* Nose orient marker */}
        <line x1="130" y1="55" x2="130" y2="38" stroke="#DCEFF8" strokeWidth="1.5" strokeLinecap="round" />

        {/* Neck */}
        <line x1="130" y1="77" x2="130" y2="88" stroke="currentColor" strokeWidth="1.5" />

        {/* Shoulder Line with landmark joints */}
        <line x1="85" y1="92" x2="175" y2="92" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="85" cy="92" r="3.5" fill="#79C8DF" />
        <circle cx="175" cy="92" r="3.5" fill="#79C8DF" />

        {/* Torso Midline */}
        <line x1="130" y1="92" x2="130" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />

        {/* Arms & Hands Keypoints */}
        <path d="M85 92 L75 130 L98 152" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M175 92 L185 130 L162 152" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="98" cy="152" r="3" fill="#DCEFF8" />
        <circle cx="162" cy="152" r="3" fill="#DCEFF8" />

        {/* Camera Facing Arc indicator */}
        <ellipse cx="130" cy="180" rx="40" ry="8" fill="#79C8DF" fillOpacity="0.06" />
      </svg>

      {/* Honest placeholder badge */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-[#7C93A9] bg-[#07111F]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#17324F]">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#79C8DF] animate-pulse" />
          Sample playback · no video file in this demo
        </span>
        <span className="text-[11px] text-[#537FA5]">Illustration · synthetic tracking</span>
      </div>
    </div>
  );
}
