import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCT_PITCH_SAMPLE } from '../mocks/samples';
import { DIMENSIONS_CONTENT } from '../content/dimensions';
import { FOUR_CUES, HONESTY_POINTS } from '../content/landing';
import { SignalTimeline } from '../components/shared/SignalTimeline';
import { ScoreInstrument } from '../components/shared/ScoreInstrument';
import { DimensionInstrument } from '../components/shared/DimensionInstrument';
import { SpeakerFrame, BandCurve } from '../components/shared/BandBadge';
import { DimensionGlyph } from '../components/shared/BandBadge';
import { DimensionKey } from '../lib/types/report';
import { formatTimecode } from '../lib/format';
import { ArrowRight, Play, Pause, Check } from 'lucide-react';

export function LandingPage() {
  // Product section tab
  const [productTab, setProductTab] = useState<'summary' | 'session' | 'explanation'>('summary');

  // Six dimensions active item
  const [activeDimKey, setActiveDimKey] = useState<DimensionKey>('speaking_rate');

  // Mini interactive demo player state
  const [demoTime, setDemoTime] = useState(125);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [selectedDemoEventId, setSelectedDemoEventId] = useState('cue-07');

  const selectedDemoEvent = PRODUCT_PITCH_SAMPLE.events.find((e) => e.id === selectedDemoEventId) || PRODUCT_PITCH_SAMPLE.events[0];

  return (
    <div className="relative min-w-0 flex flex-col gap-24 sm:gap-36 pb-24 select-none">
      {/* ============================================================ */}
      {/* 1. HERO SECTION */}
      {/* ============================================================ */}
      <section className="relative min-h-[92vh] pt-32 sm:pt-40 flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col gap-6 max-w-3xl">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10243B]/80 border border-[#17324F] text-[11px] font-mono text-[#DCEFF8] w-fit shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#79C8DF] shadow-[0_0_6px_#79C8DF]" />
            <span>Research prototype · English speech · Pipeline v1.0</span>
          </div>

          {/* Headline */}
          <div className="flex flex-col">
            <h1 className="font-['Space_Grotesk'] text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F7FAFC] leading-[1.05]">
              Your presentation.
            </h1>
            <span className="font-['Space_Grotesk'] text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[#DCEFF8] leading-[1.05]">
              Understood in every dimension.
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#9AAFC2] max-w-xl leading-relaxed">
            Upload a rehearsal. StageSense listens and watches, then lays your pace, voice, pauses, hands, posture, and focus along one timeline you can scrub, replay, and learn from.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/upload"
              className="px-7 py-3.5 rounded-full bg-[#F7FAFC] text-[#07111F] text-sm font-semibold hover:bg-[#DCEFF8] hover:shadow-[0_0_24px_rgba(121,200,223,0.7)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Analyze a Presentation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/samples/product-pitch"
              className="px-6 py-3.5 rounded-full border border-[#17324F] hover:border-[#79C8DF] text-xs font-mono text-[#DCEFF8] hover:bg-[#10243B] transition-colors"
            >
              Explore a Sample
            </Link>
          </div>

          {/* File Limits Caption */}
          <span className="text-xs font-mono text-[#537FA5]">
            MP4 · MOV · WEBM · MKV — up to 500 MB — 1 to 15 minutes
          </span>
        </div>

        {/* Live Skyline Horizon Scene in Hero */}
        <div className="mt-14 relative w-full flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#7C93A9]">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#79C8DF]" />
              Live Presentation Skyline (Product Pitch sample)
            </span>
            <span className="text-[#537FA5]">Sample data excerpt · 74 Solid</span>
          </div>

          <SignalTimeline
            windows={PRODUCT_PITCH_SAMPLE.windows}
            events={PRODUCT_PITCH_SAMPLE.events}
            duration={PRODUCT_PITCH_SAMPLE.meta.duration_s}
            mode="skyline"
            height={110}
            interactive={true}
            currentTime={demoTime}
            selectedEventId={selectedDemoEventId}
            onSeek={(t) => setDemoTime(t)}
            onSelectEvent={(id) => setSelectedDemoEventId(id)}
          />

          {/* Floating Instrument Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            <div className="p-3 rounded-xl bg-[#0B1A2D]/80 border border-[#17324F] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#7C93A9]">Delivery Score</span>
              <span className="text-sm font-mono font-bold text-[#6FE3B8]">74 Solid</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1A2D]/80 border border-[#17324F] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#7C93A9]">Mid-Pace Spike</span>
              <span className="text-sm font-mono font-bold text-[#F2B75B]">196 wpm</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1A2D]/80 border border-[#17324F] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#7C93A9]">Opening Focus</span>
              <span className="text-sm font-mono font-bold text-[#6FE3B8]">94% facing</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1A2D]/80 border border-[#17324F] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#7C93A9]">Windows</span>
              <span className="text-sm font-mono font-bold text-[#DCEFF8]">41 windows</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. PRODUCT TOUR (#product) */}
      {/* ============================================================ */}
      <section id="product" className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-8 scroll-mt-24">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Three Ways To Read Your Rehearsal
          </span>
          <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#F7FAFC]">
            From a single recording to a map of your delivery.
          </h2>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0B1A2D] border border-[#17324F] w-fit">
          {(
            [
              { id: 'summary', label: 'Summary Overview' },
              { id: 'session', label: 'Session Replay' },
              { id: 'explanation', label: 'Explainability Panel' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setProductTab(t.id)}
              className={`px-5 py-2 rounded-xl text-xs font-mono transition-all ${
                productTab === t.id
                  ? 'bg-[#10243B] text-[#DCEFF8] font-bold border border-[#79C8DF]/50 shadow-md'
                  : 'text-[#7C93A9] hover:text-[#F7FAFC]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Preview Stage */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#08101F] border border-[#17324F] shadow-2xl flex flex-col gap-6">
          {productTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <ScoreInstrument score={74} band="Solid" size="lg" />
              </div>
              <div className="md:col-span-7 flex flex-col gap-4">
                <span className="text-xs font-mono uppercase text-[#79C8DF]">Summary Layer</span>
                <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
                  An overall score, six dimensions, and top priorities.
                </h3>
                <p className="text-sm text-[#9AAFC2] leading-relaxed">
                  Understand your high-level baseline at a glance. Review the 3 highest-leverage delivery moments, see what worked well, and practice with your next rehearsal plan.
                </p>
                <Link
                  to="/samples/product-pitch?view=summary"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#79C8DF] hover:underline mt-2"
                >
                  <span>Open live summary view in sample</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {productTab === 'session' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 flex flex-col gap-3">
                <SpeakerFrame />
                <span className="text-[11px] font-mono text-[#7C93A9]">
                  Session timeline & synchronized signal multiples
                </span>
              </div>
              <div className="md:col-span-5 flex flex-col gap-4">
                <span className="text-xs font-mono uppercase text-[#79C8DF]">Session Layer</span>
                <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
                  Synchronized video, timeline, and signal multiples.
                </h3>
                <p className="text-sm text-[#9AAFC2] leading-relaxed">
                  Scrub the video and watch the live readout, timeline lanes, signal multiples, transcript, and cues follow in real time.
                </p>
                <Link
                  to="/samples/product-pitch?view=session"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#79C8DF] hover:underline mt-2"
                >
                  <span>Open live session replay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {productTab === 'explanation' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 p-5 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#79C8DF]">Visual Engagement</span>
                  <span className="text-sm font-mono font-bold text-[#6FE3B8]">88 score</span>
                </div>
                <BandCurve bands={[0.2, 0.65]} value={88} unit="%" width={260} height={60} />
                <p className="text-[11px] font-mono text-[#7C93A9]">
                  Shaded corridor scores 100. Falls toward 0 outside target bounds.
                </p>
              </div>
              <div className="md:col-span-7 flex flex-col gap-4">
                <span className="text-xs font-mono uppercase text-[#79C8DF]">Explainability Layer</span>
                <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
                  Every score backed by transparent formulas.
                </h3>
                <p className="text-sm text-[#9AAFC2] leading-relaxed">
                  No black-box evaluation. Every dimension opens into its piecewise trapezoid curve, observed window counts, formulas, and measurement caveats.
                </p>
                <Link
                  to="/samples/product-pitch?dimension=visual_engagement"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#79C8DF] hover:underline mt-2"
                >
                  <span>Inspect Visual Engagement drawer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. TWO STREAMS, ONE TIMELINE */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Architecture
          </span>
          <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#F7FAFC]">
            Two streams, one synchronized timeline.
          </h2>
          <p className="text-sm text-[#9AAFC2] max-w-xl">
            Listening and Watching run along parallel tracks before converging into aligned 10-second observation windows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FOUR_CUES.map((cue, idx) => (
            <div
              key={cue.id}
              className="p-5 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col justify-between gap-4 group hover:border-[#79C8DF]/50 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#79C8DF]">
                  PHASE 0{idx + 1}
                </span>
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#F7FAFC]">
                  {cue.name}
                </h3>
                <p className="text-xs text-[#9AAFC2] leading-relaxed">
                  {cue.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#17324F]/70 text-[10px] font-mono text-[#7C93A9] flex flex-col gap-1">
                <span>In: {cue.inputs}</span>
                <span className="text-[#A5DCEC]">Out: {cue.outputs}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SIX DIMENSIONS STAGE */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Observation Dimensions
          </span>
          <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#F7FAFC]">
            Six dimensions. Each one explained.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 6 clickable dimension rows */}
          <div className="lg:col-span-6 flex flex-col gap-2">
            {(Object.keys(DIMENSIONS_CONTENT) as DimensionKey[]).map((k) => {
              const info = DIMENSIONS_CONTENT[k];
              const isActive = activeDimKey === k;

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActiveDimKey(k)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-[#10243B] border-[#79C8DF] shadow-[0_0_16px_rgba(121,200,223,0.15)] ring-1 ring-[#79C8DF]'
                      : 'bg-[#0B1A2D]/80 border-[#17324F] hover:bg-[#10243B]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#79C8DF] font-bold">
                      {info.index}
                    </span>
                    <DimensionGlyph dimension={k} className="w-4 h-4 text-[#79C8DF]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#F7FAFC]">
                        {info.name}
                      </span>
                      <span className="text-xs text-[#9AAFC2]">{info.oneLiner}</span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-[#79C8DF] translate-x-1' : 'text-[#4D647A]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Custom SVG DimensionInstrument & Specs */}
          <div className="lg:col-span-6 p-6 rounded-3xl bg-[#08101F] border border-[#17324F] flex flex-col gap-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#17324F] pb-4">
              <div className="flex items-center gap-2">
                <DimensionGlyph dimension={activeDimKey} className="w-5 h-5 text-[#79C8DF]" />
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#F7FAFC]">
                  {DIMENSIONS_CONTENT[activeDimKey].name}
                </h3>
              </div>
              <span className="text-xs font-mono text-[#79C8DF]">
                Illustration · sample series
              </span>
            </div>

            {/* Custom SVG Instrument */}
            <div className="flex items-center justify-center p-6 bg-[#0B1A2D] rounded-2xl border border-[#17324F]">
              <DimensionInstrument
                dimension={activeDimKey}
                score={82}
                size="lg"
              />
            </div>

            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              <div>
                <span className="font-mono text-[#79C8DF] font-bold uppercase block mb-1">
                  What is measured:
                </span>
                <p className="text-[#DCEFF8]">{DIMENSIONS_CONTENT[activeDimKey].measures}</p>
              </div>

              <div>
                <span className="font-mono text-[#F2766B] font-bold uppercase block mb-1">
                  What is NOT measured:
                </span>
                <p className="text-[#9AAFC2]">{DIMENSIONS_CONTENT[activeDimKey].doesNotMeasure}</p>
              </div>
            </div>

            <Link
              to={`/methodology#dimensions`}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#79C8DF] hover:underline"
            >
              <span>How it is scored in methodology</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. INTERACTIVE MINI DEMO */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Interactive Rehearsal Experience
          </span>
          <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#F7FAFC]">
            Try a real report.
          </h2>
          <p className="text-sm text-[#9AAFC2] max-w-xl">
            Test how moments connect directly to timeline timecodes and specific behavioral suggestions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#08101F] border border-[#17324F] rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Left 7 cols: Player and Timeline */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <SpeakerFrame />

            {/* Play controls */}
            <div className="p-3 rounded-xl bg-[#0B1A2D] border border-[#17324F] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDemoPlaying(!demoPlaying)}
                  className="p-2 rounded-lg bg-[#79C8DF] text-[#07111F] hover:bg-[#DCEFF8] transition-colors"
                  aria-label={demoPlaying ? 'Pause demo' : 'Play demo'}
                >
                  {demoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <span className="text-xs font-mono text-[#DCEFF8]">
                  {formatTimecode(demoTime)} / 03:32
                </span>
              </div>

              <span className="text-xs font-mono text-[#7C93A9]">
                Click skyline cues to jump
              </span>
            </div>

            <SignalTimeline
              windows={PRODUCT_PITCH_SAMPLE.windows}
              events={PRODUCT_PITCH_SAMPLE.events}
              duration={PRODUCT_PITCH_SAMPLE.meta.duration_s}
              mode="skyline"
              height={90}
              currentTime={demoTime}
              selectedEventId={selectedDemoEventId}
              onSeek={(t) => setDemoTime(t)}
              onSelectEvent={(id) => {
                setSelectedDemoEventId(id);
                const ev = PRODUCT_PITCH_SAMPLE.events.find((e) => e.id === id);
                if (ev) setDemoTime(ev.t0);
              }}
            />
          </div>

          {/* Right 5 cols: Active Moment Card */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 p-5 rounded-2xl bg-[#0B1A2D] border border-[#17324F]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#17324F] pb-3">
                <span className="text-xs font-mono text-[#79C8DF] font-bold">
                  {selectedDemoEvent.id.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-[#DCEFF8]">
                  {formatTimecode(selectedDemoEvent.t0)} – {formatTimecode(selectedDemoEvent.t1)}
                </span>
              </div>

              <h4 className="font-['Space_Grotesk'] text-lg font-bold text-[#F7FAFC]">
                {selectedDemoEvent.subtype.replace(/_/g, ' ').toUpperCase()}
              </h4>

              {selectedDemoEvent.metric && (
                <div className="p-2.5 rounded-lg bg-[#07111F] text-xs font-mono text-[#A5DCEC] flex items-center justify-between">
                  <span>Measured Value:</span>
                  <span className="font-bold">{selectedDemoEvent.metric.name} {selectedDemoEvent.metric.value}</span>
                </div>
              )}

              <p className="text-xs text-[#9AAFC2] leading-relaxed">
                Notice how the event span aligns precisely with the recorded metric dip. All feedback stems from fixed templates mapped to measured signals.
              </p>
            </div>

            <Link
              to="/samples/product-pitch"
              className="w-full py-2.5 rounded-xl bg-[#F7FAFC] text-[#07111F] text-xs font-semibold text-center hover:bg-[#DCEFF8] transition-colors"
            >
              Open Complete Sample Report →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. HONEST BY DESIGN */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Core Principles
          </span>
          <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#F7FAFC]">
            Honest by design.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HONESTY_POINTS.map((pt, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-3"
            >
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#F7FAFC]">
                {pt.title}
              </h3>
              <p className="text-xs text-[#9AAFC2] leading-relaxed">
                {pt.body}
              </p>
              {pt.link && (
                <Link
                  to={pt.link}
                  className="text-xs font-mono text-[#79C8DF] hover:underline mt-auto pt-2"
                >
                  {pt.linkText}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. CLOSING CTA */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#10243B] to-[#07111F] border border-[#17324F] shadow-2xl flex flex-col items-center text-center gap-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Ready to rehearse?
          </span>
          <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-bold text-[#F7FAFC] max-w-xl">
            Bring a rehearsal.
          </h2>
          <p className="text-sm text-[#9AAFC2] max-w-md leading-relaxed">
            Record 1 to 15 minutes of yourself speaking. See moment by moment how your delivery landed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/upload"
              className="px-8 py-3.5 rounded-full bg-[#F7FAFC] text-[#07111F] text-sm font-semibold hover:bg-[#DCEFF8] hover:shadow-[0_0_24px_rgba(121,200,223,0.7)] transition-all"
            >
              Analyze a Rehearsal
            </Link>
            <Link
              to="/samples/product-pitch"
              className="px-6 py-3.5 rounded-full border border-[#17324F] text-xs font-mono text-[#DCEFF8] hover:bg-[#10243B] transition-colors"
            >
              Explore Sample Pitch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
