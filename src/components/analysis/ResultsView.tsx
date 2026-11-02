import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DimensionKey, Report } from '../../lib/types/report';
import { SessionProvider, useSession } from '../../lib/session/SessionProvider';
import { PlaybackEngine } from '../../lib/session/PlaybackEngine';
import { formatDate, formatTimecode } from '../../lib/format';
import { ScoreInstrument } from '../shared/ScoreInstrument';
import { SignalTimeline } from '../shared/SignalTimeline';
import { VideoStage } from '../results/VideoStage';
import { LiveReadout } from '../results/LiveReadout';
import { SpeechActivityRibbon } from '../shared/SpeechActivityRibbon';
import { SignalCharts } from '../results/SignalCharts';
import { MomentsPanel } from '../results/MomentsPanel';
import { TranscriptPanel } from '../results/TranscriptPanel';
import { ChannelStrip } from '../results/ChannelStrip';
import { WhereToStart } from '../results/WhereToStart';
import { WhatWorked, RehearsalPlan } from '../results/WhatWorked';
import { DimensionPanel } from '../results/DimensionPanel';
import { Printer, Trash2, HelpCircle, AlertTriangle, Layers, Film } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface ResultsViewProps {
  report: Report;
  isSample?: boolean;
}

export function ResultsView({ report, isSample = false }: ResultsViewProps) {
  return (
    <SessionProvider duration={report.meta.duration_s} events={report.events}>
      <ResultsViewInner report={report} isSample={isSample} />
    </SessionProvider>
  );
}

function ResultsViewInner({ report, isSample }: ResultsViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
  if (isSample || !report.job_id) {
    setVideoSrc(null);
    return;
  }

  let cancelled = false;

  api.getVideoUrl(report.job_id).then((url) => {
    if (!cancelled) {
      setVideoSrc(url);
    }
  });

  return () => {
    cancelled = true;
  };
}, [report.job_id, isSample]);

  const {
    currentTime,
    duration,
    selectedEventId,
    hoverTime,
    filters,
    followTranscript,
    seek,
    playEventSpan,
    selectEvent,
    nextEvent,
    prevEvent,
    setFilterKind,
    toggleFilterDimension,
    toggleTranscriptFollow,
  } = useSession();

  // Active view: 'summary' | 'session' (defaults to 'summary', or 'session' if t or event specified)
  const initialView = searchParams.get('view') === 'session' ? 'session' : 'summary';
  const [activeTab, setActiveTab] = useState<'summary' | 'session'>(initialView);

  // Active dimension panel
  const [activeDimension, setActiveDimension] = useState<DimensionKey | null>(
    (searchParams.get('dimension') as DimensionKey) || null
  );

  // Session right panel tab: 'moments' | 'transcript'
  const [sessionRightTab, setSessionRightTab] = useState<'moments' | 'transcript'>('moments');

  // Shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Sync URL query parameters
  useEffect(() => {
    const tParam = searchParams.get('t');
    if (tParam) {
      const parsed = parseFloat(tParam);
      if (!isNaN(parsed)) seek(parsed);
    }

    const evParam = searchParams.get('event');
    if (evParam) {
      selectEvent(evParam);
    }

    const dimParam = searchParams.get('dimension');
    if (dimParam) {
      setActiveDimension(dimParam as DimensionKey);
    }
  }, []);

  const handleSwitchTab = (tab: 'summary' | 'session') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('view', tab);
      return p;
    });
  };

  const handleOpenDimension = (d: DimensionKey) => {
    setActiveDimension(d);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('dimension', d);
      return p;
    });
  };

  const handleCloseDimension = () => {
    setActiveDimension(null);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('dimension');
      return p;
    });
  };

  const handleSeekAndSwitch = (t0: number, eventId?: string) => {
    seek(t0);
    if (eventId) selectEvent(eventId);
    handleSwitchTab('session');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (isSample) return;
    const confirmed = window.confirm('Delete this rehearsal analysis? This removes the recording and report data permanently.');
    if (!confirmed) return;

    try {
      await api.deleteJob(report.job_id);
      toast.success('Analysis deleted successfully.');
      navigate('/history');
    } catch {
      toast.error('Failed to delete analysis.');
    }
  };

  const allDimensionKeys: DimensionKey[] = [
    'speaking_rate',
    'vocal_expressiveness',
    'pausing_fluency',
    'gestures',
    'posture',
    'visual_engagement',
  ];

  return (
    <div className="relative min-w-0 flex flex-col gap-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 select-none">
      <PlaybackEngine />

      {/* Quality Warnings Notice */}
      {report.meta.quality.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-[#F2B75B]/10 border border-[#F2B75B]/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-[#F2B75B] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-mono font-bold text-[#F6C77F] uppercase tracking-wider">
              Recording Quality Notice
            </span>
            {report.meta.quality.warnings.map((w, idx) => (
              <p key={idx} className="text-[#DCEFF8]">
                {w.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sample Tag or Normal Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-[#17324F]/80 pb-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-[#F7FAFC] truncate">
              {report.meta.filename}
            </h1>
            {isSample && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#79C8DF]/20 text-[#A5DCEC] border border-[#79C8DF]/40 shrink-0">
                SAMPLE REPORT
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#7C93A9]">
            <span>{formatDate(report.meta.analysed_at)}</span>
            <span>·</span>
            <span>Duration {formatTimecode(report.meta.duration_s)}</span>
            <span>·</span>
            <span>Pipeline {report.meta.pipeline_version}</span>
          </div>
        </div>

        {/* Action Buttons: Print, Delete, Shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#17324F] hover:border-[#79C8DF] text-xs font-mono text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {!isSample && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#17324F] hover:border-[#F2766B] text-xs font-mono text-[#9AAFC2] hover:text-[#F8978D] transition-colors"
              title="Delete analysis"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="p-1.5 rounded-xl border border-[#17324F] hover:border-[#79C8DF] text-[#9AAFC2] hover:text-[#F7FAFC] transition-colors"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Switcher: Summary vs Session */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1 rounded-full bg-[#0B1A2D] border border-[#17324F] shadow-lg">
          <button
            type="button"
            onClick={() => handleSwitchTab('summary')}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-[#79C8DF] text-[#07111F] shadow-[0_0_12px_#79C8DF] font-bold'
                : 'text-[#9AAFC2] hover:text-[#F7FAFC]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Summary Overview
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('session')}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-medium transition-all ${
              activeTab === 'session'
                ? 'bg-[#79C8DF] text-[#07111F] shadow-[0_0_12px_#79C8DF] font-bold'
                : 'text-[#9AAFC2] hover:text-[#F7FAFC]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Session Replay & Signals
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ACT I: SUMMARY VIEW */}
      {/* ============================================================ */}
      {activeTab === 'summary' && (
        <div className="flex flex-col gap-10">
          {/* Opening Shot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#08101F]/70 border border-[#17324F] rounded-3xl p-6 sm:p-10 shadow-2xl">
            {/* Left Score Instrument */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#17324F]/70 pb-6 lg:pb-0 lg:pr-8">
              <ScoreInstrument score={report.overall.score} band={report.overall.band} size="lg" />
            </div>

            {/* Right Overview and Summary statement */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
                  Executive Delivery Synthesis
                </span>
                <p className="font-['Space_Grotesk'] text-lg sm:text-xl font-medium text-[#F7FAFC] leading-relaxed">
                  "{report.overall.summary}"
                </p>
                <span className="text-xs font-mono text-[#7C93A9]">
                  Evaluated across {report.windows.length} ten-second observation windows.
                </span>
              </div>

              {/* Full Width Skyline strip */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono text-[#7C93A9]">
                  Rehearsal Timeline Overview (click any cue to jump)
                </span>
                <SignalTimeline
                  windows={report.windows}
                  events={report.events}
                  duration={report.meta.duration_s}
                  mode="skyline"
                  height={95}
                  interactive={true}
                  currentTime={currentTime}
                  selectedEventId={selectedEventId}
                  onSeek={(t) => seek(t)}
                  onSelectEvent={(id) => handleSeekAndSwitch(0, id)}
                />
              </div>
            </div>
          </div>

          {/* Where To Start (Top 3) */}
          <WhereToStart
            topImprovements={report.feedback.top_improvements}
            onSeekAndSwitch={handleSeekAndSwitch}
          />

          {/* What Worked Well */}
          <WhatWorked
            strengths={report.feedback.strengths}
            onSeekAndSwitch={handleSeekAndSwitch}
          />

          {/* Six Dimensions Channel Strip */}
          <ChannelStrip
            dimensions={report.dimensions}
            windows={report.windows}
            onOpenDimension={handleOpenDimension}
          />

          {/* Next Rehearsal Practice Plan */}
          <RehearsalPlan
            jobId={report.job_id}
            topImprovements={report.feedback.top_improvements}
            onSeekAndSwitch={handleSeekAndSwitch}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* ACT II: SESSION VIEW */}
      {/* ============================================================ */}
      {activeTab === 'session' && (
        <div className="flex flex-col gap-6">
          {/* Top Video Stage + Live Readout + Moments Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 columns: Video Stage & Live Readout */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <VideoStage videoSrc={videoSrc} events={report.events} />
              <LiveReadout
                windows={report.windows}
                currentTime={currentTime}
                onOpenDimension={handleOpenDimension}
              />
              <SpeechActivityRibbon
                windows={report.windows}
                duration={duration}
                currentTime={currentTime}
              />
            </div>

            {/* Right 4 columns: Moments & Transcript Tabs */}
            <div className="lg:col-span-4 bg-[#08101F] border border-[#17324F] rounded-2xl p-4 flex flex-col gap-3 min-h-[580px]">
              {/* Segmented control for Right Panel */}
              <div className="flex items-center p-1 bg-[#07111F] rounded-xl border border-[#17324F]">
                <button
                  type="button"
                  onClick={() => setSessionRightTab('moments')}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                    sessionRightTab === 'moments'
                      ? 'bg-[#10243B] text-[#DCEFF8] font-bold shadow'
                      : 'text-[#7C93A9] hover:text-[#F7FAFC]'
                  }`}
                >
                  Moments ({report.events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionRightTab('transcript')}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                    sessionRightTab === 'transcript'
                      ? 'bg-[#10243B] text-[#DCEFF8] font-bold shadow'
                      : 'text-[#7C93A9] hover:text-[#F7FAFC]'
                  }`}
                >
                  Transcript ({report.transcript.segments.length})
                </button>
              </div>

              {sessionRightTab === 'moments' ? (
                <MomentsPanel
                  events={report.events}
                  feedback={report.feedback}
                  selectedEventId={selectedEventId}
                  currentTime={currentTime}
                  filterKind={filters.kind}
                  filterDimensions={filters.dimensions}
                  onSelectEvent={selectEvent}
                  onFilterKindChange={setFilterKind}
                  onToggleDimensionFilter={toggleFilterDimension}
                  onPlaySpan={playEventSpan}
                  onPrevEvent={prevEvent}
                  onNextEvent={nextEvent}
                  onOpenDimension={handleOpenDimension}
                />
              ) : (
                <TranscriptPanel
                  segments={report.transcript.segments}
                  events={report.events}
                  currentTime={currentTime}
                  followPlayback={followTranscript}
                  onToggleFollow={toggleTranscriptFollow}
                  onSeek={(t) => seek(t)}
                />
              )}
            </div>
          </div>

          {/* TemporalStack: Lanes + Recharts Signals */}
          <div className="flex flex-col gap-4 mt-2">
            <SignalTimeline
              windows={report.windows}
              events={report.events}
              duration={report.meta.duration_s}
              mode="lanes"
              interactive={true}
              currentTime={currentTime}
              selectedEventId={selectedEventId}
              onSeek={(t) => seek(t)}
              onSelectEvent={(id) => selectEvent(id)}
            />

            <SignalCharts
              windows={report.windows}
              events={report.events}
              duration={report.meta.duration_s}
              currentTime={currentTime}
              hoverTime={hoverTime}
              onSeek={(t) => seek(t)}
            />
          </div>
        </div>
      )}

      {/* Dimension Explainability Side Sheet */}
      {activeDimension && (
        <DimensionPanel
          dimensionKey={activeDimension}
          dimensionSummary={
            report.dimensions.find((d) => d.key === activeDimension) || report.dimensions[0]
          }
          windows={report.windows}
          events={report.events}
          allKeys={allDimensionKeys}
          onSelectDimension={handleOpenDimension}
          onClose={handleCloseDimension}
          onSelectEvent={(id) => {
            selectEvent(id);
            handleSwitchTab('session');
          }}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 bg-[#02050B]/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-[#0B1A2D] border border-[#17324F] rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#17324F] pb-3">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#F7FAFC]">
                Keyboard Navigation
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-[#7C93A9] hover:text-[#F7FAFC] text-xs font-mono"
              >
                Close (Esc)
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-[#17324F]/40">
                <span className="text-[#9AAFC2]">Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-[#10243B] border border-[#17324F] text-[#DCEFF8]">Space</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#17324F]/40">
                <span className="text-[#9AAFC2]">Skip ±5 seconds</span>
                <kbd className="px-2 py-0.5 rounded bg-[#10243B] border border-[#17324F] text-[#DCEFF8]">← / →</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#17324F]/40">
                <span className="text-[#9AAFC2]">Skip ±10 seconds</span>
                <kbd className="px-2 py-0.5 rounded bg-[#10243B] border border-[#17324F] text-[#DCEFF8]">J / L</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#17324F]/40">
                <span className="text-[#9AAFC2]">Previous / Next moment</span>
                <kbd className="px-2 py-0.5 rounded bg-[#10243B] border border-[#17324F] text-[#DCEFF8]">[ / ]</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#17324F]/40">
                <span className="text-[#9AAFC2]">Open shortcuts</span>
                <kbd className="px-2 py-0.5 rounded bg-[#10243B] border border-[#17324F] text-[#DCEFF8]">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
