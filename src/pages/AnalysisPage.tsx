import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useJob, useReport } from '../lib/hooks/useStageSense';
import { useHistory } from '../lib/hooks/useHistory';
import { ProcessingView, FailureView } from '../components/analysis/ProcessingView';
import { ResultsView } from '../components/analysis/ResultsView';
import { Loader2 } from 'lucide-react';

export function AnalysisPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: job, isLoading: jobLoading, error: jobError } = useJob(jobId);
  const { data: report, isLoading: reportLoading, error: reportError } = useReport(
    job?.status === 'done' || job?.status === 'completed' ? jobId : undefined
  );
  const { updateEntry } = useHistory();

  // Synchronize history when job completes
  useEffect(() => {
    if (jobId && (job?.status === 'done' || job?.status === 'completed') && report) {
      updateEntry(jobId, {
        status: 'done',
        overall: report.overall.score,
        band: report.overall.band,
        composite_strip: report.windows.map((w) => w.composite),
      });
    } else if (jobId && job?.status === 'failed') {
      updateEntry(jobId, {
        status: 'failed',
        errorCode: job.error?.code,
        errorMessage: job.error?.message,
      });
    }
  }, [jobId, job?.status, report, updateEntry]);

  if (jobLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-[#79C8DF]" />
        <span className="text-xs font-mono text-[#7C93A9]">Connecting to rehearsal pipeline...</span>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <FailureView
        jobId={jobId || 'unknown'}
        error={{
          code: 'NETWORK',
          message: "Unable to retrieve rehearsal job status.",
          hint: 'Please check your connection or return to History.',
        }}
      />
    );
  }

  if (job.status === 'failed') {
    return (
      <FailureView
        jobId={job.job_id}
        error={
          job.error || {
            code: 'INTERNAL',
            message: 'Analysis encountered an unexpected condition.',
            hint: 'Try another video or record closer to the microphone.',
          }
        }
      />
    );
  }

  if (job.status !== 'done' && job.status !== 'completed') {
    return <ProcessingView job={job} />;
  }

  if (reportLoading || !report) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-[#79C8DF]" />
        <span className="text-xs font-mono text-[#7C93A9]">Compiling synthesis report...</span>
      </div>
    );
  }

  // SchemaGuard check
  if (report.schema_version !== '1.0') {
    return (
      <div className="max-w-md mx-auto py-20 text-center select-none">
        <h2 className="text-xl font-bold text-[#F2766B] mb-2">Incompatible Schema</h2>
        <p className="text-sm text-[#9AAFC2]">
          This report uses schema version {report.schema_version}, but the client expects version 1.0.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <ResultsView report={report} isSample={false} />
    </div>
  );
}
