
import React, { useEffect, useState } from 'react';
import { JobStatus, JobStage } from '../../lib/types/report';
import { formatTimecode } from '../../lib/format';
import { IS_MOCK_MODE } from '../../lib/api';
import { Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_STAGES: JobStage[] = [
  { id: 'listening', label: 'Audio analysis', state: 'waiting' },
  { id: 'watching', label: 'Video analysis', state: 'waiting' },
  { id: 'aligning', label: 'Signal alignment', state: 'waiting' },
  { id: 'writing', label: 'Report generation', state: 'waiting' },
];

export function ProcessingView({ job }: { job: JobStatus }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = job.created_at
      ? new Date(job.created_at).getTime()
      : Date.now();

    const interval = setInterval(() => {
      setElapsed(
        Math.max(0, Math.floor((Date.now() - start) / 1000)),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [job.created_at]);

  const stages = Array.isArray(job.stages)
    ? job.stages
    : DEFAULT_STAGES;

  const progress = Number.isFinite(job.progress)
  ? Math.min(1, Math.max(0, job.progress))
  : job.status === 'done' || job.status === 'completed'
    ? 1
    : job.status === 'processing'
      ? Math.min(0.9, elapsed / 120)
      : 0;

  const progressPct = Math.round(progress * 100);

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center select-none"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <span className="text-xs font-mono tracking-widest text-[#79C8DF] uppercase">
          Rehearsal Pipeline
        </span>

        <h1 className="font-['Space_Grotesk'] text-3xl font-bold text-[#F7FAFC]">
          Analysing Presentation
        </h1>

        <p className="text-sm text-[#9AAFC2] max-w-md">
          StageSense is analysing your video. You can leave this page;
          your analysis will keep running and appear in History.
        </p>

        {IS_MOCK_MODE && (
          <span className="text-[11px] font-mono text-[#537FA5] bg-[#07111F] px-2.5 py-0.5 rounded-full border border-[#17324F]">
            Simulated processing (mock mode)
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-4 mb-8">
        <span className="font-['Space_Grotesk'] text-7xl font-bold tracking-tight text-[#F7FAFC] tabular-nums">
          {progressPct}%
        </span>

        <span className="font-mono text-sm text-[#7C93A9] tabular-nums">
          Elapsed {formatTimecode(elapsed)}
        </span>
      </div>

      <div className="w-full h-1 bg-[#17324F] rounded-full overflow-hidden mb-10">
        <div
          className="h-full bg-[#79C8DF] shadow-[0_0_12px_#79C8DF] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="w-full flex flex-col gap-3 bg-[#0B1A2D] border border-[#17324F] rounded-2xl p-5 shadow-xl">
        <div className="text-[11px] font-mono text-[#7C93A9] pb-2 border-b border-[#17324F]/70 flex items-center justify-between">
          <span>PIPELINE STAGE</span>
          <span>AUDIO &amp; VIDEO ANALYSED IN PARALLEL</span>
        </div>

        {stages.map((st) => {
          let stateTag = (
            <span className="text-[11px] font-mono text-[#4D647A]">
              Waiting
            </span>
          );

          let borderClass = 'border-[#17324F]/60 bg-[#07111F]/50';

          if (st.state === 'active') {
            stateTag = (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#79C8DF]">
                <Loader2 className="w-3 h-3 animate-spin" />
                In progress
              </span>
            );

            borderClass =
              'border-[#79C8DF]/50 bg-[#10243B] ring-1 ring-[#79C8DF]/30';
          } else if (st.state === 'done') {
            stateTag = (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-[#6FE3B8]">
                <Check className="w-3.5 h-3.5" />
                Completed
              </span>
            );

            borderClass = 'border-[#6FE3B8]/30 bg-[#0B1A2D]';
          } else if (st.state === 'failed') {
            stateTag = (
              <span className="text-xs font-mono text-[#F2766B]">
                Failed
              </span>
            );

            borderClass = 'border-[#F2766B]/40 bg-[#281722]';
          }

          let description = '';

          if (st.id === 'listening') {
            description =
              'Transcribes speech and measures pace, pauses, pitch, and volume.';
          } else if (st.id === 'watching') {
            description =
              'Tracks skeletal posture, hand gestures, and head orientation.';
          } else if (st.id === 'aligning') {
            description =
              'Synchronizes acoustic and landmark signals into 10-second windows.';
          } else if (st.id === 'writing') {
            description =
              'Finds notable moments and compiles structured rehearsal tips.';
          }

          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${borderClass}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#F7FAFC]">
                  {st.label}
                </span>

                <span className="text-xs text-[#9AAFC2] max-w-sm">
                  {description}
                </span>
              </div>

              <div className="shrink-0 ml-4">{stateTag}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Link
          to="/history"
          className="text-xs font-mono text-[#79C8DF] hover:text-[#A5DCEC] hover:underline"
        >
          &larr; Return to Rehearsal Archive
        </Link>
      </div>
    </div>
  );
}

export function FailureView({
  error,
  jobId,
}: {
  error: { code: string; message: string; hint: string };
  jobId: string;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center text-center select-none">
      <div className="mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#F2766B]/15 border border-[#F2766B]/40 flex items-center justify-center text-[#F2766B]">
          <span className="text-2xl font-bold font-mono">!</span>
        </div>
      </div>

      <span className="text-xs font-mono uppercase tracking-widest text-[#F2766B] mb-1">
        Analysis Interrupted
      </span>

      <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC] mb-2">
        {error.message || 'Analysis could not be completed.'}
      </h1>

      <p className="text-sm text-[#9AAFC2] mb-4">
        {error.hint || 'Please try uploading your video again.'}
      </p>

      <span className="text-xs font-mono text-[#7C93A9] bg-[#07111F] px-3 py-1 rounded-full border border-[#17324F] mb-8">
        ERROR CODE: {error.code}
      </span>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        <Link
          to="/upload"
          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#F7FAFC] text-[#07111F] font-medium text-xs hover:bg-[#DCEFF8] transition-colors"
        >
          Try another video
        </Link>

        <Link
          to="/history"
          className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#17324F] text-[#9AAFC2] hover:text-[#F7FAFC] text-xs font-mono transition-colors"
        >
          Open history
        </Link>
      </div>
    </div>
  );
}
