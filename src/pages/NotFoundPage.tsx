import React from 'react';
import { Link } from 'react-router-dom';
import { BrokenFrame } from '../components/brand/FrameMarks';

export function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 select-none">
      <div className="mb-6">
        <BrokenFrame size={64} />
      </div>
      <span className="text-xs font-mono uppercase tracking-widest text-[#F2766B] mb-1">
        404 — PAGE NOT FOUND
      </span>
      <h1 className="font-['Space_Grotesk'] text-3xl font-bold text-[#F7FAFC] mb-2">
        This rehearsal room is empty.
      </h1>
      <p className="text-sm text-[#9AAFC2] max-w-sm mb-6 leading-relaxed">
        The page or report you requested could not be located on the StageSense server.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full bg-[#F7FAFC] text-[#07111F] text-xs font-semibold hover:bg-[#DCEFF8] transition-colors"
        >
          Return Home
        </Link>
        <Link
          to="/history"
          className="px-5 py-2.5 rounded-full border border-[#17324F] text-[#9AAFC2] hover:text-[#F7FAFC] text-xs font-mono transition-colors"
        >
          View History
        </Link>
      </div>
    </div>
  );
}
