import React, { useEffect, useState } from 'react';
import { Band } from '../../lib/types/report';
import { BandBadge } from './BandBadge';

export function ScoreInstrument({
  score,
  band,
  size = 'lg',
  className = '',
}: {
  score: number;
  band: Band;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Expo-out easing [0.16, 1, 0.3, 1]
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const radius = size === 'lg' ? 95 : size === 'md' ? 65 : 45;
  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const viewBoxSize = (radius + strokeWidth * 2) * 2;
  const center = viewBoxSize / 2;

  // 270 degree arc (from 135 deg to 405 deg)
  const startAngle = 135;
  const totalAngle = 270;
  const currentAngle = (displayScore / 100) * totalAngle;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const trackPath = describeArc(center, center, radius, startAngle, startAngle + totalAngle);
  const activePath = describeArc(center, center, radius, startAngle, startAngle + currentAngle);

  // Tick positions at 35, 60, 85
  const getTickCoords = (val: number) => {
    const angle = startAngle + (val / 100) * totalAngle;
    const p1 = polarToCartesian(center, center, radius - strokeWidth - 2, angle);
    const p2 = polarToCartesian(center, center, radius + strokeWidth + 2, angle);
    return { p1, p2 };
  };

  const tick35 = getTickCoords(35);
  const tick60 = getTickCoords(60);
  const tick85 = getTickCoords(85);

  const numeralSize =
    size === 'lg'
      ? 'text-7xl md:text-8xl'
      : size === 'md'
      ? 'text-5xl'
      : 'text-3xl';

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg
          width={viewBoxSize}
          height={viewBoxSize}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="overflow-visible"
        >
          {/* Subtle Outer Glow Filter */}
          <defs>
            <filter id="score-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(190, 220, 245, 0.15)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Luminous Arc */}
          <path
            d={activePath}
            fill="none"
            stroke="#79C8DF"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#score-glow)"
          />

          {/* Threshold Ticks */}
          <line
            x1={tick35.p1.x}
            y1={tick35.p1.y}
            x2={tick35.p2.x}
            y2={tick35.p2.y}
            stroke="#F2766B"
            strokeWidth="2"
            opacity="0.8"
          />
          <line
            x1={tick60.p1.x}
            y1={tick60.p1.y}
            x2={tick60.p2.x}
            y2={tick60.p2.y}
            stroke="#F2B75B"
            strokeWidth="2"
            opacity="0.8"
          />
          <line
            x1={tick85.p1.x}
            y1={tick85.p1.y}
            x2={tick85.p2.x}
            y2={tick85.p2.y}
            stroke="#6FE3B8"
            strokeWidth="2"
            opacity="0.8"
          />
        </svg>

        {/* Center Score Numeral */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span
            className={`font-['Space_Grotesk'] font-bold tracking-tight text-[#F7FAFC] tabular-nums ${numeralSize}`}
          >
            {displayScore}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-[#7C93A9] -mt-1">
            Overall Score
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center gap-1.5">
        <BandBadge band={band} />
        <span className="text-[11px] font-mono text-[#7C93A9] text-center max-w-[200px]">
          Indicators of delivery, not grades.
        </span>
      </div>
    </div>
  );
}
