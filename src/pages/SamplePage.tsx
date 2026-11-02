import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SAMPLE_REPORTS } from '../mocks/samples';
import { ResultsView } from '../components/analysis/ResultsView';

export function SamplePage() {
  const { id } = useParams<{ id: string }>();
  const report = id ? SAMPLE_REPORTS[id] : null;

  if (!report) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 select-none">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC] mb-2">
          Sample Not Found
        </h1>
        <p className="text-sm text-[#9AAFC2] mb-6">
          The requested sample report does not exist.
        </p>
        <Link
          to="/"
          className="px-5 py-2 rounded-full bg-[#F7FAFC] text-[#07111F] text-xs font-semibold hover:bg-[#DCEFF8]"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <ResultsView report={report} isSample={true} />
    </div>
  );
}
