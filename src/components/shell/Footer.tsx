import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../brand/Wordmark';
import { IS_MOCK_MODE } from '../../lib/api';
import { useHistory } from '../../lib/hooks/useHistory';
import { toast } from 'sonner';

export function Footer() {
  const { seedDemoHistory, clearHistory } = useHistory();

  const handleSeed = () => {
    seedDemoHistory();
    toast.success('Seeded 3 demo sessions in history.');
  };

  const handleClear = () => {
    clearHistory();
    toast.info('Cleared history.');
  };

  return (
    <footer className="w-full border-t border-[#17324F]/80 bg-[#07111F] text-[#9AAFC2] py-12 px-4 sm:px-6 select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Wordmark />
            <p className="text-xs text-[#7C93A9] max-w-sm">
              Multimodal rehearsal analysis. Lays your pace, voice, pauses, hands, posture, and focus along one timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <Link to="/#product" className="hover:text-[#F7FAFC] transition-colors">
              Product
            </Link>
            <Link to="/samples/product-pitch" className="hover:text-[#F7FAFC] transition-colors">
              Sample Pitch
            </Link>
            <Link to="/methodology" className="hover:text-[#F7FAFC] transition-colors">
              Methodology
            </Link>
            <Link to="/history" className="hover:text-[#F7FAFC] transition-colors">
              History
            </Link>
            <Link to="/upload" className="text-[#79C8DF] hover:underline">
              Analyze rehearsal
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#17324F]/50 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#DCEFF8] font-medium">
              StageSense reports indicators of delivery, not grades.
            </span>
            {IS_MOCK_MODE && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10243B] border border-[#17324F] text-[#79C8DF]">
                Simulated data
              </span>
            )}
          </div>

          {IS_MOCK_MODE && (
            <div className="flex items-center gap-3 text-xs font-mono text-[#7C93A9]">
              <button
                type="button"
                onClick={handleSeed}
                className="hover:text-[#79C8DF] transition-colors hover:underline"
              >
                Seed demo history
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-[#F2766B] transition-colors hover:underline"
              >
                Clear demo history
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
