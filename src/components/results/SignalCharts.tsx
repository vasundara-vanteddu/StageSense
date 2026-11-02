import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { DimensionKey, EventItem, WindowData } from '../../lib/types/report';
import { formatTimecode } from '../../lib/format';
import { Table, Eye } from 'lucide-react';

interface SignalChartsProps {
  windows: WindowData[];
  events: EventItem[];
  duration: number;
  currentTime: number;
  hoverTime: number | null;
  onSeek: (t: number) => void;
  className?: string;
}

interface ChartConfig {
  key: DimensionKey;
  label: string;
  unit: string;
  dataKey: keyof WindowData['metrics'];
  targetMin: number;
  targetMax: number;
  yDomain: [number, number];
  transform?: (val: number | null) => number;
}

const CHARTS_CONFIG: ChartConfig[] = [
  {
    key: 'speaking_rate',
    label: 'Speaking Rate',
    unit: 'wpm',
    dataKey: 'wpm',
    targetMin: 130,
    targetMax: 175,
    yDomain: [80, 230],
  },
  {
    key: 'vocal_expressiveness',
    label: 'Pitch Variation',
    unit: 'st',
    dataKey: 'pitch_sd_st',
    targetMin: 2.0,
    targetMax: 6.0,
    yDomain: [0, 8],
  },
  {
    key: 'pausing_fluency',
    label: 'Pause Share',
    unit: '%',
    dataKey: 'pause_ratio',
    targetMin: 8,
    targetMax: 25,
    yDomain: [0, 50],
    transform: (v) => (v !== null ? Math.round(v * 100) : 0),
  },
  {
    key: 'gestures',
    label: 'Gesture Activity',
    unit: 'units',
    dataKey: 'gesture_activity',
    targetMin: 0.25,
    targetMax: 1.5,
    yDomain: [0, 3.0],
  },
  {
    key: 'posture',
    label: 'Posture Sway',
    unit: 'sway',
    dataKey: 'sway',
    targetMin: 0.08,
    targetMax: 0.22,
    yDomain: [0, 0.45],
  },
  {
    key: 'visual_engagement',
    label: 'Camera Facing',
    unit: '%',
    dataKey: 'facing_fraction',
    targetMin: 65,
    targetMax: 100,
    yDomain: [0, 100],
    transform: (v) => (v !== null ? Math.round(v * 100) : 0),
  },
];

export function SignalCharts({
  windows,
  events,
  duration,
  currentTime,
  hoverTime,
  onSeek,
  className = '',
}: SignalChartsProps) {
  const [showTable, setShowTable] = useState(false);

  // Prepare chart series points
  const chartData = windows.map((w) => {
    const midTime = (w.t0 + w.t1) / 2;
    return {
      time: midTime,
      formattedTime: formatTimecode(midTime),
      wpm: w.metrics.wpm,
      pitch_sd_st: w.metrics.pitch_sd_st,
      pause_ratio: w.metrics.pause_ratio !== null ? Math.round(w.metrics.pause_ratio * 100) : null,
      gesture_activity: w.metrics.gesture_activity,
      sway: w.metrics.sway,
      facing_fraction: w.metrics.facing_fraction !== null ? Math.round(w.metrics.facing_fraction * 100) : null,
    };
  });

  return (
    <div className={`flex flex-col gap-4 w-full select-none ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DCEFF8]">
          Signal Multiples & Reference Bands
        </h4>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#79C8DF] hover:text-[#A5DCEC] transition-colors"
        >
          {showTable ? <Eye className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
          {showTable ? 'Hide data table' : 'View accessible table'}
        </button>
      </div>

      {showTable ? (
        <div className="w-full max-h-80 overflow-y-auto border border-[#17324F] rounded-xl bg-[#0B1A2D] p-3 text-xs font-mono text-[#9AAFC2]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#17324F] text-[#DCEFF8]">
                <th className="py-1 px-2">Window</th>
                <th className="py-1 px-2">Pace (wpm)</th>
                <th className="py-1 px-2">Pitch (st)</th>
                <th className="py-1 px-2">Pause (%)</th>
                <th className="py-1 px-2">Gestures</th>
                <th className="py-1 px-2">Sway</th>
                <th className="py-1 px-2">Facing (%)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, idx) => (
                <tr key={idx} className="border-b border-[#17324F]/40 hover:bg-[#10243B]">
                  <td className="py-1 px-2 text-[#DCEFF8]">{d.formattedTime}</td>
                  <td className="py-1 px-2">{d.wpm ?? '—'}</td>
                  <td className="py-1 px-2">{d.pitch_sd_st ?? '—'}</td>
                  <td className="py-1 px-2">{d.pause_ratio ?? '—'}%</td>
                  <td className="py-1 px-2">{d.gesture_activity ?? '—'}</td>
                  <td className="py-1 px-2">{d.sway ?? '—'}</td>
                  <td className="py-1 px-2">{d.facing_fraction ?? '—'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {CHARTS_CONFIG.map((cfg) => {
            const dimEvents = events.filter((e) => e.dimension === cfg.key);

            return (
              <div
                key={cfg.key}
                className="flex items-center gap-3 bg-[#0B1A2D]/60 border border-[#17324F] rounded-xl p-2.5 hover:border-[#79C8DF]/40 transition-colors"
              >
                {/* 136px Left Label Gutter */}
                <div className="w-[136px] shrink-0 flex flex-col justify-center">
                  <span className="text-xs font-mono font-medium text-[#DCEFF8]">
                    {cfg.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#7C93A9]">
                    Target {cfg.targetMin}–{cfg.targetMax} {cfg.unit}
                  </span>
                </div>

                {/* 96px Recharts multiple */}
                <div className="flex-1 h-[78px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      onClick={(e: any) => {
                        if (e?.activePayload?.[0]?.payload?.time !== undefined) {
                          onSeek(e.activePayload[0].payload.time);
                        }
                      }}
                    >
                      {/* Target corridor shaded in soft cyan */}
                      <ReferenceArea
                        y1={cfg.targetMin}
                        y2={cfg.targetMax}
                        fill="rgba(121, 200, 223, 0.08)"
                        stroke="rgba(121, 200, 223, 0.15)"
                        strokeDasharray="2 2"
                      />

                      {/* Event spans on this dimension */}
                      {dimEvents.map((ev) => {
                        let fill = 'rgba(242, 183, 91, 0.12)';
                        if (ev.severity === 'strong') fill = 'rgba(111, 227, 184, 0.12)';
                        else if (ev.severity === 'severe') fill = 'rgba(242, 118, 107, 0.16)';

                        return (
                          <ReferenceArea
                            key={ev.id}
                            x1={ev.t0}
                            x2={ev.t1}
                            fill={fill}
                            strokeOpacity={0.2}
                          />
                        );
                      })}

                      {/* Playhead Reference Line */}
                      <ReferenceLine
                        x={currentTime}
                        stroke="#F7FAFC"
                        strokeWidth={1.5}
                      />

                      {/* Hover Line */}
                      {hoverTime !== null && (
                        <ReferenceLine
                          x={hoverTime}
                          stroke="#A5DCEC"
                          strokeDasharray="2 2"
                          strokeWidth={1}
                        />
                      )}

                      <XAxis dataKey="time" type="number" domain={[0, duration]} hide />
                      <YAxis domain={cfg.yDomain} hide />

                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            return (
                              <div className="bg-[#07111F] border border-[#17324F] p-1.5 rounded text-[10px] font-mono shadow-md text-[#DCEFF8]">
                                <span className="text-[#7C93A9]">{p.formattedTime}: </span>
                                <span className="font-bold text-[#79C8DF]">
                                  {payload[0].value} {cfg.unit}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      {/* Luminous Line Trace */}
                      <Line
                        type="monotone"
                        dataKey={cfg.dataKey}
                        stroke="#79C8DF"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
