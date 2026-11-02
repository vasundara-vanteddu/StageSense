import React from 'react';

export function FrameMarks({
  size = 16,
  strokeWidth = 1.5,
  color = 'currentColor',
  className = '',
}: {
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      {/* Top Left */}
      <svg
        className="absolute top-0 left-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
      >
        <path
          d={`M0 ${size}V0H${size}`}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Top Right */}
      <svg
        className="absolute top-0 right-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
      >
        <path
          d={`M${size} ${size}V0H0`}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Bottom Left */}
      <svg
        className="absolute bottom-0 left-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
      >
        <path
          d={`M0 0V${size}H${size}`}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Bottom Right */}
      <svg
        className="absolute bottom-0 right-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
      >
        <path
          d={`M${size} 0V${size}H0`}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BrokenFrame({
  size = 64,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-[#F2766B] ${className}`}
      aria-hidden="true"
    >
      {/* Top Left bracket */}
      <path d="M6 22V6H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Top Right bracket (detached / displaced) */}
      <path d="M42 4H56V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(12 50 10)" />
      {/* Bottom Left bracket */}
      <path d="M6 42V58H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Bottom Right bracket */}
      <path d="M58 42V58H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Central exclamation mark */}
      <line x1="32" y1="20" x2="32" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="42" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function EmptyStage({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`relative w-48 h-40 flex items-center justify-center ${className}`} aria-hidden="true">
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="text-[#537FA5]/60">
        {/* Horizon beam */}
        <line x1="10" y1="95" x2="150" y2="95" stroke="#79C8DF" strokeWidth="1.5" strokeOpacity="0.4" />
        <ellipse cx="80" cy="95" rx="45" ry="12" fill="#79C8DF" fillOpacity="0.06" />

        {/* Diagonal spotlight stroke lines */}
        <line x1="30" y1="10" x2="70" y2="95" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="80" y1="5" x2="80" y2="95" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <line x1="130" y1="10" x2="90" y2="95" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

        {/* Minimalist Lectern */}
        <path d="M65 55H95L92 88H68L65 55Z" stroke="#DCEFF8" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="60" y1="55" x2="100" y2="55" stroke="#DCEFF8" strokeWidth="2" strokeLinecap="round" />
        <line x1="80" y1="42" x2="80" y2="55" stroke="#79C8DF" strokeWidth="1.5" />
        <circle cx="80" cy="40" r="2" fill="#79C8DF" />
      </svg>
    </div>
  );
}
