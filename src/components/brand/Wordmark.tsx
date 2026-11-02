import React from 'react';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Horizon Arc Mark */}
      <svg
        width="22"
        height="14"
        viewBox="0 0 22 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-[#79C8DF]"
        aria-hidden="true"
      >
        {/* Baseline horizon */}
        <line x1="0" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Rising half-ellipse arc */}
        <path
          d="M4 12C4 6.5 7.13 2 11 2C14.87 2 18 6.5 18 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Subtle center light core */}
        <circle cx="11" cy="6" r="1.5" fill="#DCEFF8" />
      </svg>
      <span className="font-['Space_Grotesk'] text-lg font-semibold tracking-tight text-[#F7FAFC]">
        StageSense
      </span>
    </div>
  );
}
