import React from 'react';
import { DimensionKey } from '../../lib/types/report';

export function DimensionInstrument({
  dimension,
  score,
  metricValue,
  size = 'md',
  className = '',
}: {
  dimension: DimensionKey;
  score: number | null;
  metricValue?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const isAvailable = score !== null;

  const dims = {
    xs: { w: 90, h: 50 },
    sm: { w: 140, h: 70 },
    md: { w: 180, h: 90 },
    lg: { w: 260, h: 140 },
  }[size];

  if (!isAvailable) {
    return (
      <div
        className={`flex flex-col items-center justify-center border border-dashed border-[#7C93A9]/30 rounded-xl bg-[#10243B]/30 ${className}`}
        style={{ width: dims.w, height: dims.h }}
      >
        <span className="text-xs font-mono text-[#7C93A9]">Not scored</span>
        <span className="text-[10px] font-mono text-[#4D647A]">Missing keypoints</span>
      </div>
    );
  }

  // 1. Speaking Rate: semicircular pace gauge
  if (dimension === 'speaking_rate') {
    const val = metricValue ?? 152;
    // Map 80 - 220 wpm to angle -90 to +90 deg
    const clamped = Math.max(80, Math.min(220, val));
    const angle = -90 + ((clamped - 80) / 140) * 180;
    // Target arc (130 to 175)
    const targetStartAngle = -90 + ((130 - 80) / 140) * 180;
    const targetEndAngle = -90 + ((175 - 80) / 140) * 180;

    return (
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 180 90"
        className={`overflow-visible select-none ${className}`}
        role="img"
        aria-label={`Speaking rate pace gauge at ${val} wpm`}
      >
        {/* Background arc */}
        <path d="M 20 80 A 70 70 0 0 1 160 80" fill="none" stroke="rgba(190, 220, 245, 0.15)" strokeWidth="6" strokeLinecap="round" />
        {/* Target corridor arc */}
        <path
          d="M 52 35 A 70 70 0 0 1 128 35"
          fill="none"
          stroke="#79C8DF"
          strokeWidth="6"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
        {/* Needle center */}
        <circle cx="90" cy="80" r="4" fill="#F7FAFC" />
        {/* Needle line */}
        <g transform={`rotate(${angle} 90 80)`}>
          <line x1="90" y1="80" x2="90" y2="22" stroke="#79C8DF" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="90" cy="22" r="3" fill="#DCEFF8" />
        </g>
        <text x="90" y="78" textAnchor="middle" fill="#DCEFF8" fontSize="12" fontFamily="monospace" fontWeight="600">
          {val} wpm
        </text>
      </svg>
    );
  }

  // 2. Vocal Expressiveness: pitch contour ribbon over intensity envelope
  if (dimension === 'vocal_expressiveness') {
    const val = metricValue ?? 3.4;
    return (
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 180 90"
        className={`overflow-visible select-none ${className}`}
        role="img"
        aria-label="Vocal pitch variation ribbon"
      >
        {/* Intensity background envelope */}
        <path
          d="M 10 55 Q 40 30, 80 45 T 140 38 T 170 52 L 170 75 Q 140 85, 90 75 T 10 75 Z"
          fill="rgba(121, 200, 223, 0.12)"
        />
        {/* Pitch contour line */}
        <path
          d="M 10 60 Q 30 25, 55 40 T 95 30 T 135 55 T 170 35"
          fill="none"
          stroke="#79C8DF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Dynamic harmonic accent */}
        <path
          d="M 10 68 Q 30 40, 55 52 T 95 45 T 135 68 T 170 50"
          fill="none"
          stroke="#A5DCEC"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.6"
        />
        <text x="90" y="86" textAnchor="middle" fill="#7C93A9" fontSize="10" fontFamily="monospace">
          Pitch spread {val} st
        </text>
      </svg>
    );
  }

  // 3. Pausing & Fluency: rhythm strip with speech bars & silence gaps
  if (dimension === 'pausing_fluency') {
    return (
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 180 90"
        className={`overflow-visible select-none ${className}`}
        role="img"
        aria-label="Pausing and speech rhythm strip"
      >
        {/* Baseline rule */}
        <line x1="10" y1="45" x2="170" y2="45" stroke="rgba(190, 220, 245, 0.15)" strokeWidth="1" />
        {/* Speech bursts */}
        <rect x="15" y="32" width="22" height="26" rx="2" fill="#79C8DF" fillOpacity="0.7" />
        <rect x="42" y="28" width="34" height="34" rx="2" fill="#79C8DF" fillOpacity="0.8" />
        {/* Micro-pause gap */}
        {/* Second speech burst */}
        <rect x="88" y="30" width="28" height="30" rx="2" fill="#79C8DF" fillOpacity="0.75" />
        {/* Deliberate pause gap with indicator */}
        <line x1="118" y1="40" x2="136" y2="40" stroke="#F2B75B" strokeWidth="1.5" strokeDasharray="2 2" />
        {/* Third speech burst */}
        <rect x="140" y="35" width="25" height="20" rx="2" fill="#79C8DF" fillOpacity="0.6" />
        <text x="90" y="82" textAnchor="middle" fill="#7C93A9" fontSize="10" fontFamily="monospace">
          Speech / Pause Cadence
        </text>
      </svg>
    );
  }

  // 4. Gestures: wrist activity trace with target corridor
  if (dimension === 'gestures') {
    const val = metricValue ?? 0.85;
    return (
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 180 90"
        className={`overflow-visible select-none ${className}`}
        role="img"
        aria-label="Gesture wrist movement activity corridor"
      >
        {/* Target Corridor (0.25 to 1.50) */}
        <rect x="10" y="25" width="160" height="35" rx="3" fill="rgba(121, 200, 223, 0.1)" />
        <line x1="10" y1="25" x2="170" y2="25" stroke="#79C8DF" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3" />
        <line x1="10" y1="60" x2="170" y2="60" stroke="#79C8DF" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3" />

        {/* Dynamic wrist activity wave */}
        <path
          d="M 12 55 Q 35 15, 55 42 T 95 32 T 130 50 T 168 38"
          fill="none"
          stroke="#79C8DF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="168" cy="38" r="3" fill="#DCEFF8" />
        <text x="90" y="82" textAnchor="middle" fill="#7C93A9" fontSize="10" fontFamily="monospace">
          Activity {val} units
        </text>
      </svg>
    );
  }

  // 5. Posture: schematic upper-body (shoulder line, tilt arc, sway band)
  if (dimension === 'posture') {
    return (
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 180 90"
        className={`overflow-visible select-none ${className}`}
        role="img"
        aria-label="Posture shoulder alignment and sway schematic"
      >
        {/* Sway tolerance band */}
        <ellipse cx="90" cy="52" rx="36" ry="8" fill="rgba(121, 200, 223, 0.08)" />

        {/* Center alignment midline */}
        <line x1="90" y1="14" x2="90" y2="72" stroke="rgba(190, 220, 245, 0.2)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Head point */}
        <circle cx="90" cy="22" r="10" stroke="#79C8DF" strokeWidth="1.5" fill="none" />
        <circle cx="90" cy="22" r="2.5" fill="#DCEFF8" />

        {/* Shoulder line */}
        <line x1="62" y1="46" x2="118" y2="46" stroke="#79C8DF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="62" cy="46" r="3" fill="#79C8DF" />
        <circle cx="118" cy="46" r="3" fill="#79C8DF" />

        {/* Torso spine */}
        <line x1="90" y1="46" x2="90" y2="72" stroke="#79C8DF" strokeWidth="1.5" />

        <text x="90" y="84" textAnchor="middle" fill="#7C93A9" fontSize="10" fontFamily="monospace">
          Upright Poise
        </text>
      </svg>
    );
  }

  // 6. Visual Engagement: top-down head orientation dial with ±20° facing zone
  if (dimension === 'visual_engagement') {
    const val = metricValue ?? 88;
    return (
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 180 90"
        className={`overflow-visible select-none ${className}`}
        role="img"
        aria-label="Visual engagement camera-facing dial"
      >
        {/* Outer perimeter arc */}
        <path d="M 35 70 A 60 60 0 0 1 145 70" fill="none" stroke="rgba(190, 220, 245, 0.15)" strokeWidth="2" />

        {/* Facing zone ±20° wedge */}
        <path
          d="M 90 70 L 72 20 A 55 55 0 0 1 108 20 Z"
          fill="rgba(121, 200, 223, 0.16)"
          stroke="#79C8DF"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Camera focal lens icon */}
        <rect x="85" y="6" width="10" height="6" rx="1.5" fill="#79C8DF" />
        <circle cx="90" cy="9" r="1.5" fill="#07111F" />

        {/* Speaker head center */}
        <circle cx="90" cy="70" r="12" stroke="#79C8DF" strokeWidth="1.5" fill="#10243B" />
        <line x1="90" y1="70" x2="90" y2="40" stroke="#F7FAFC" strokeWidth="2" strokeLinecap="round" />

        <text x="90" y="86" textAnchor="middle" fill="#7C93A9" fontSize="10" fontFamily="monospace">
          {val}% Lens Facing
        </text>
      </svg>
    );
  }

  return null;
}
