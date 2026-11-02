import React, { useState } from 'react';
import { useMethodology } from '../lib/hooks/useStageSense';
import { DIMENSIONS_CONTENT } from '../content/dimensions';
import { VALIDATION_CHECKS, VALIDATION_DISCLAIMER } from '../content/validation';
import { DimensionKey } from '../lib/types/report';
import { DimensionGlyph, BandCurve } from '../components/shared/BandBadge';
import { Check, X, Sliders, ChevronDown } from 'lucide-react';
import { DEFAULT_METHODOLOGY } from '../mocks/methodology';

export function MethodologyPage() {
  const { data: meth } = useMethodology();
  const [activeNav, setActiveNav] = useState('what-it-is');

  // Interactive Window Demo state
  const [windowDemoOffset, setWindowDemoOffset] = useState(15); // seconds 0 to 50

  // Interactive Scoring Calculator state
  const [sliderScores, setSliderScores] = useState<Record<DimensionKey, number>>({
    speaking_rate: 68,
    vocal_expressiveness: 78,
    pausing_fluency: 72,
    gestures: 62,
    posture: 85,
    visual_engagement: 88,
  });

  const [activeDims, setActiveDims] = useState<Record<DimensionKey, boolean>>({
    speaking_rate: true,
    vocal_expressiveness: true,
    pausing_fluency: true,
    gestures: true,
    posture: true,
    visual_engagement: true,
  });

  // Calculate live weighted overall
  let totalScoreWeight = 0;
  let totalActiveWeight = 0;
  (Object.keys(sliderScores) as DimensionKey[]).forEach((k) => {
    if (activeDims[k]) {
      const w = meth.weights[k] || DEFAULT_METHODOLOGY.weights[k];
      totalScoreWeight += sliderScores[k] * w;
      totalActiveWeight += w;
    }
  });

  const calculatedOverall =
    totalActiveWeight > 0 ? Math.round(totalScoreWeight / totalActiveWeight) : 0;

  // Selected pipeline node
  const [selectedPipelineNode, setSelectedPipelineNode] = useState<number | null>(0);

  const pipelineNodes = [
    {
      id: 'upload',
      title: 'Upload & Ingest',
      in: 'Raw video file (MP4, MOV, WEBM, MKV)',
      out: 'Demuxed audio stream + video frame stream',
      tool: 'FFmpeg / HTML5 Media Container Demuxer',
    },
    {
      id: 'preprocess',
      title: 'Acoustic & Frame Preprocessing',
      in: 'Audio stream & decoded video frames',
      out: '16kHz mono audio & 30fps normalized video frames',
      tool: 'Deterministic DSP resampler & colorspace converter',
    },
    {
      id: 'audio_visual',
      title: 'Parallel Signal Streams',
      in: 'Audio + Frame streams processed concurrently',
      out: 'Acoustic pitch F0 / RMS + 3D facial/wrist keypoints',
      tool: 'Whisper Large v3, PyAnnote, MediaPipe Pose & Face Mesh',
    },
    {
      id: 'timeline',
      title: 'Shared Timeline & 10s Windows',
      in: 'Continuous parallel signal vectors',
      out: '10-second analysis windows advancing with a 5-second hop',
      tool: 'Sliding window matrix aggregator',
    },
    {
      id: 'scoring',
      title: 'Trapezoid & Heuristic Scoring',
      in: 'Window metrics (wpm, pitch SD, pause ratio, sway...)',
      out: 'Window scores (0–100) and discrete states (Severe, Weak, Normal, Strong)',
      tool: 'Deterministic piecewise trapezoid transfer functions',
    },
    {
      id: 'moments',
      title: 'Moment Merging & Feedback',
      in: 'State sequences and overlapping weak spans',
      out: 'Consolidated cues (CUE 01...) and structured coaching tips',
      tool: 'Deterministic temporal union rules & template generator',
    },
  ];

  const sections = [
    { id: 'what-it-is', label: 'What StageSense Is & Isn’t' },
    { id: 'pipeline', label: 'The Processing Pipeline' },
    { id: 'windows', label: 'Time Windows & 5s Hop' },
    { id: 'dimensions', label: 'The Six Dimensions' },
    { id: 'scoring', label: 'Scoring Formulas & Calculator' },
    { id: 'moments', label: 'Finding Moments & Merging' },
    { id: 'validation', label: 'Evidence & Validation' },
    { id: 'limitations', label: 'Honest Limitations' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-24 max-w-7xl mx-auto px-4 sm:px-6 select-none">
      <div className="flex flex-col gap-2 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
          Technical Documentation
        </span>
        <h1 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-bold text-[#F7FAFC]">
          Methodology & Open Architecture
        </h1>
        <p className="text-sm text-[#9AAFC2] max-w-2xl leading-relaxed">
          StageSense assesses delivery using deterministic signal processing and transparent mathematical reference models. Every threshold, weight, and merge rule is documented below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Sticky Table of Contents */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-[#0B1A2D]/80 border border-[#17324F] rounded-2xl p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7C93A9] block mb-3">
            Table of Contents
          </span>
          <nav className="flex flex-col gap-1 text-xs font-mono" aria-label="Methodology Sections">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={() => setActiveNav(sec.id)}
                className={`px-3 py-2 rounded-xl text-left transition-colors ${
                  activeNav === sec.id
                    ? 'bg-[#10243B] text-[#79C8DF] font-bold border-l-2 border-[#79C8DF]'
                    : 'text-[#9AAFC2] hover:text-[#F7FAFC] hover:bg-[#17324F]/40'
                }`}
              >
                {sec.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Right Main Content */}
        <div className="lg:col-span-9 flex flex-col gap-16">
          {/* SECTION 1: WHAT IT IS AND ISN'T */}
          <section id="what-it-is" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              1. What StageSense Is, and Isn’t
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0B1A2D] border border-[#6FE3B8]/30 flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6FE3B8] font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> What StageSense Does
                </span>
                <ul className="flex flex-col gap-2.5 text-xs text-[#DCEFF8] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#6FE3B8]">•</span>
                    <span>Extracts quantitative speech acoustics and skeletal landmark coordinates.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6FE3B8]">•</span>
                    <span>Reports observable behavioral indicators per dimension inside 10-second time windows.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6FE3B8]">•</span>
                    <span>Surfaces timestamped stretches where pace, pitch, posture or pauses deviated from reference baselines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6FE3B8]">•</span>
                    <span>Explains every calculation with open formulas and data-true traces.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1A2D] border border-[#F2766B]/30 flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#F2766B] font-bold flex items-center gap-1.5">
                  <X className="w-4 h-4" /> What StageSense Does Not Do
                </span>
                <ul className="flex flex-col gap-2.5 text-xs text-[#9AAFC2] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F2766B]">•</span>
                    <span>Does NOT detect emotion, anxiety, confidence, sincerity, or intent.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F2766B]">•</span>
                    <span>Is NOT eye tracking. Visual Engagement is strictly a camera-facing head orientation proxy.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F2766B]">•</span>
                    <span>Does NOT grade the person, assign academic grades, or evaluate presentation content clarity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F2766B]">•</span>
                    <span>Does NOT claim statistical agreement with human presentation evaluators.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 2: THE PIPELINE */}
          <section id="pipeline" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              2. The Processing Pipeline
            </h2>
            <p className="text-sm text-[#9AAFC2] leading-relaxed">
              Audio and video feeds are processed asynchronously in parallel pipelines, then merged onto a single synchronized timeline matrix.
            </p>

            {/* Interactive Horizon Pipeline Diagram */}
            <div className="p-6 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {pipelineNodes.map((node, i) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedPipelineNode(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedPipelineNode === i
                        ? 'bg-[#10243B] border-[#79C8DF] shadow-[0_0_12px_rgba(121,200,223,0.3)] ring-1 ring-[#79C8DF]'
                        : 'bg-[#07111F] border-[#17324F] hover:border-[#79C8DF]/40'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-[#7C93A9] block mb-1">
                      STEP 0{i + 1}
                    </span>
                    <span className="text-xs font-semibold text-[#F7FAFC] block truncate">
                      {node.title}
                    </span>
                  </button>
                ))}
              </div>

              {selectedPipelineNode !== null && (
                <div className="p-4 rounded-xl bg-[#07111F] border border-[#17324F] flex flex-col gap-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-[#17324F] pb-2">
                    <span className="font-bold text-[#DCEFF8]">
                      {pipelineNodes[selectedPipelineNode].title}
                    </span>
                    <span className="text-[#537FA5]">
                      Engine: {pipelineNodes[selectedPipelineNode].tool}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#7C93A9]">Input stream:</span>
                    <span className="text-[#A5DCEC]">{pipelineNodes[selectedPipelineNode].in}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#7C93A9]">Output artifacts:</span>
                    <span className="text-[#6FE3B8]">{pipelineNodes[selectedPipelineNode].out}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: TIME WINDOWS & 5s HOP */}
          <section id="windows" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              3. Time Windows & 5-Second Hop
            </h2>
            <p className="text-sm text-[#9AAFC2] leading-relaxed">
              StageSense slices rehearsal recordings into 10-second observation windows that advance with a 5-second hop. Each 5-second slot's composite score is computed as the arithmetic mean of the up-to-two overlapping windows covering it.
            </p>

            {/* Interactive Window Overlap Demo */}
            <div className="p-6 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#DCEFF8] font-semibold">
                  Interactive Window Slider
                </span>
                <span className="text-xs font-mono text-[#79C8DF]">
                  Active Window: {windowDemoOffset}s – {windowDemoOffset + 10}s
                </span>
              </div>

              {/* Slider Control */}
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={windowDemoOffset}
                onChange={(e) => setWindowDemoOffset(Number(e.target.value))}
                className="w-full accent-[#79C8DF] cursor-pointer"
              />

              {/* Graphical Overlap Visualizer */}
              <div className="relative w-full h-24 bg-[#07111F] rounded-xl border border-[#17324F] overflow-hidden p-2 flex flex-col justify-between">
                {/* 5-second slots across 60 seconds */}
                <div className="flex items-center justify-between w-full h-8 gap-1">
                  {Array.from({ length: 12 }).map((_, slotIdx) => {
                    const slotT = slotIdx * 5;
                    const isCovered = slotT >= windowDemoOffset && slotT < windowDemoOffset + 10;
                    return (
                      <div
                        key={slotIdx}
                        className={`flex-1 h-full rounded flex items-center justify-center text-[10px] font-mono transition-colors ${
                          isCovered
                            ? 'bg-[#79C8DF]/40 text-[#DCEFF8] border border-[#79C8DF]'
                            : 'bg-[#10243B]/60 text-[#7C93A9]'
                        }`}
                      >
                        {slotT}s
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#7C93A9]">
                  <span>00:00</span>
                  <span className="text-[#79C8DF]">
                    Window covers 2 consecutive 5-second slots with 50% overlap
                  </span>
                  <span>01:00</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: THE SIX DIMENSIONS ACCORDION */}
          <section id="dimensions" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              4. The Six Dimensions
            </h2>
            <div className="flex flex-col gap-3">
              {(Object.keys(DIMENSIONS_CONTENT) as DimensionKey[]).map((k) => {
                const info = DIMENSIONS_CONTENT[k];
                return (
                  <details
                    key={k}
                    className="group p-4 rounded-2xl bg-[#0B1A2D] border border-[#17324F] transition-all"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <div className="flex items-center gap-3">
                        <DimensionGlyph dimension={k} className="w-4 h-4 text-[#79C8DF]" />
                        <span className="font-['Space_Grotesk'] font-semibold text-base text-[#F7FAFC]">
                          0{info.index} {info.name}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[#7C93A9] group-open:rotate-180 transition-transform" />
                    </summary>

                    <div className="mt-4 pt-4 border-t border-[#17324F]/70 flex flex-col gap-3 text-xs leading-relaxed">
                      <div>
                        <span className="font-mono text-[#79C8DF] uppercase font-bold block mb-0.5">
                          Signal Measured:
                        </span>
                        <p className="text-[#DCEFF8]">{info.whatIsMeasured}</p>
                      </div>
                      <div>
                        <span className="font-mono text-[#79C8DF] uppercase font-bold block mb-0.5">
                          Scoring Formula:
                        </span>
                        <p className="text-[#9AAFC2]">{info.howCalculated}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#07111F] border border-[#F2B75B]/20 text-[#F6C77F]">
                        <span className="font-mono uppercase font-bold block mb-0.5">Limits:</span>
                        <p>{info.limits}</p>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          {/* SECTION 5: SCORING FORMULAS & INTERACTIVE CALCULATOR */}
          <section id="scoring" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              5. Scoring Formulas & Interactive Calculator
            </h2>

            {/* Formulas in Mono Blocks */}
            <div className="p-4 rounded-xl bg-[#07111F] border border-[#17324F] font-mono text-xs text-[#A5DCEC] flex flex-col gap-2">
              <div>// 1. Window score (Piecewise Trapezoid Transfer Function)</div>
              <div>window_score = trapezoid(metric_val, [min, target_low, target_high, max])</div>
              <div className="mt-2">// 2. Dimension Score Formula</div>
              <div>dimension_score = 0.75 × mean(window_scores) + 0.25 × (% windows ≥ 60)</div>
              <div className="mt-2">// 3. Overall Delivery Composite</div>
              <div>overall_score = sum(dimension_score_i × weight_i) / sum(active_weights)</div>
            </div>

            {/* Interactive Calculator */}
            <div className="p-6 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#17324F]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#79C8DF]" />
                  <span className="font-['Space_Grotesk'] font-bold text-sm text-[#F7FAFC]">
                    Live Renormalizing Overall Calculator
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#7C93A9]">Simulated Overall:</span>
                  <span className="text-xl font-bold text-[#79C8DF] tabular-nums">
                    {calculatedOverall}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {(Object.keys(sliderScores) as DimensionKey[]).map((k) => {
                  const isChecked = activeDims[k];
                  const val = sliderScores[k];
                  const w = meth.weights[k] || DEFAULT_METHODOLOGY.weights[k];

                  return (
                    <div key={k} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setActiveDims((prev) => ({ ...prev, [k]: !prev[k] }))
                            }
                            className="w-3.5 h-3.5 rounded border-[#17324F] accent-[#79C8DF]"
                          />
                          <span className={isChecked ? 'text-[#DCEFF8] font-medium' : 'text-[#7C93A9] line-through'}>
                            {DIMENSIONS_CONTENT[k].name} ({Math.round(w * 100)}% weight)
                          </span>
                        </div>
                        <span className="text-[#79C8DF] font-bold tabular-nums">
                          {isChecked ? val : 'Not scored'}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        disabled={!isChecked}
                        value={val}
                        onChange={(e) =>
                          setSliderScores((prev) => ({
                            ...prev,
                            [k]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#79C8DF] disabled:opacity-30 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 6: FINDING MOMENTS */}
          <section id="moments" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              6. Finding Moments & Merging Rules
            </h2>
            <div className="p-5 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-3 text-xs leading-relaxed text-[#9AAFC2]">
              <p>
                Moments represent anomalous or standout stretches rather than isolated 10-second snapshots:
              </p>
              <ul className="flex flex-col gap-2 text-[#DCEFF8] font-mono">
                <li>• Consecutive weak windows on the same dimension merge into a unified event span.</li>
                <li>• A single in-between window scoring &lt;70 can be bridged to prevent unnatural fragmentation.</li>
                <li>• An event must sustain for ≥15 seconds or contain a severe window (&lt;35 score) to be reported.</li>
                <li>• Top five weak moments are selected for rehearsal attention (maximum two per dimension).</li>
              </ul>
            </div>
          </section>

          {/* SECTION 7: EVIDENCE & VALIDATION */}
          <section id="validation" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              7. Evidence & Validation Status
            </h2>
            <p className="text-sm text-[#F6C77F] p-4 rounded-xl bg-[#F2B75B]/10 border border-[#F2B75B]/30 font-medium leading-relaxed">
              {VALIDATION_DISCLAIMER}
            </p>

            <div className="flex flex-col gap-2 mt-2">
              {VALIDATION_CHECKS.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#0B1A2D] border border-[#17324F] flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col gap-0.5 max-w-md">
                    <span className="font-semibold text-[#F7FAFC]">{c.title}</span>
                    <span className="text-[#9AAFC2]">{c.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#10243B] text-[#79C8DF] border border-[#17324F]">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-[#7C93A9]">
                      {c.result ?? 'Results will appear once published.'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 8: LIMITATIONS */}
          <section id="limitations" className="flex flex-col gap-4 scroll-mt-28">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              8. Limitations of the Model
            </h2>
            <div className="p-5 rounded-2xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-3 text-xs leading-relaxed text-[#9AAFC2]">
              <p>• <strong className="text-[#DCEFF8]">English language only:</strong> ASR boundary models and syllable timing models are calibrated exclusively for English phonetics.</p>
              <p>• <strong className="text-[#DCEFF8]">2D camera projection:</strong> Posture tilt, sway, and slump are measured in optical 2D and can be biased by camera elevation or angle.</p>
              <p>• <strong className="text-[#DCEFF8]">Visual engagement is a proxy:</strong> Head orientation estimates do not measure pupil gaze, true audience eye contact, or cognitive attention.</p>
              <p>• <strong className="text-[#DCEFF8]">Filler counts are lower bounds:</strong> ASR models frequently normalize or omit subtle disfluencies.</p>
            </div>

            {/* Pipeline Version Footer */}
            <div className="p-4 rounded-xl bg-[#07111F] border border-[#17324F] flex items-center justify-between text-xs font-mono text-[#7C93A9] mt-4">
              <span>Pipeline Engine: {meth.pipeline_version}</span>
              <span>Speech Model: {meth.asr_model}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
