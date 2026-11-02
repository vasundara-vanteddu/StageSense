import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHistory, HistoryEntry } from '../lib/hooks/useHistory';
import { EmptyStage } from '../components/brand/FrameMarks';
import { formatTimecode, formatShortMonthDay, getMonthGroup } from '../lib/format';
import { BandBadge } from '../components/shared/BandBadge';
import { SignalTimeline } from '../components/shared/SignalTimeline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Search, Trash2, ArrowUpDown, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function HistoryPage() {
  const navigate = useNavigate();
  const { entries, removeEntry, seedDemoHistory } = useHistory();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'processing' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Filter and Sort
  const filteredEntries = entries.filter((e) => {
    if (search && !e.filename.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'score') return (b.overall || 0) - (a.overall || 0);
    return 0;
  });

  // Group by month
  const groupedByMonth: Record<string, HistoryEntry[]> = {};
  sortedEntries.forEach((e) => {
    const grp = getMonthGroup(e.createdAt);
    if (!groupedByMonth[grp]) groupedByMonth[grp] = [];
    groupedByMonth[grp].push(e);
  });

  // Progress chart data (>= 2 completed)
  const completedEntries = entries
    .filter((e) => e.status === 'done' && e.overall !== undefined)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const progressData = completedEntries.map((e) => ({
    date: formatShortMonthDay(e.createdAt),
    score: e.overall,
    name: e.filename,
    id: e.jobId,
  }));

  const handleToggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        toast.info('Compare works with exactly two sessions.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('Delete this rehearsal analysis? This cannot be undone.');
    if (!confirmed) return;
    removeEntry(id);
    toast.success('Removed session from history.');
  };

  const compareA = entries.find((e) => e.jobId === selectedForCompare[0]);
  const compareB = entries.find((e) => e.jobId === selectedForCompare[1]);

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Rehearsal Archive
          </span>
          <h1 className="font-['Space_Grotesk'] text-3xl font-bold text-[#F7FAFC]">
            Your Rehearsals ({entries.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedForCompare([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono border transition-colors ${
              compareMode
                ? 'bg-[#79C8DF] text-[#07111F] font-bold border-[#79C8DF]'
                : 'bg-[#0B1A2D] text-[#9AAFC2] border-[#17324F] hover:text-[#F7FAFC]'
            }`}
          >
            {compareMode ? 'Exit Compare' : 'Compare Two Sessions'}
          </button>

          <Link
            to="/upload"
            className="px-5 py-2 rounded-full bg-[#F7FAFC] text-[#07111F] text-xs font-semibold hover:bg-[#DCEFF8] transition-all"
          >
            Analyze a Rehearsal
          </Link>
        </div>
      </div>

      {/* Progress Chart for >= 2 sessions */}
      {completedEntries.length >= 2 && !compareMode && (
        <div className="mb-10 p-6 rounded-3xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DCEFF8]">
                Overall Delivery Trajectory
              </h3>
              <p className="text-xs text-[#7C93A9]">
                Score trend across {completedEntries.length} completed rehearsals
              </p>
            </div>
            <span className="text-xs font-mono text-[#6FE3B8]">
              Latest: {completedEntries[completedEntries.length - 1].overall} score
            </span>
          </div>

          <div className="h-44 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" stroke="#537FA5" fontSize={11} fontFamily="monospace" />
                <YAxis domain={[40, 100]} stroke="#537FA5" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#07111F] border border-[#17324F] p-2 rounded-xl text-xs font-mono shadow-xl">
                          <span className="text-[#DCEFF8] block font-semibold truncate max-w-xs">{d.name}</span>
                          <span className="text-[#79C8DF] font-bold">Overall Score: {d.score}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#79C8DF"
                  strokeWidth={2.5}
                  dot={{ fill: '#07111F', stroke: '#79C8DF', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#DCEFF8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Compare Panel when exactly 2 selected */}
      {compareMode && compareA && compareB && (
        <div className="mb-10 p-6 rounded-3xl bg-[#10243B] border border-[#79C8DF]/50 flex flex-col gap-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#17324F] pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#79C8DF]">
                Rehearsal Comparison
              </span>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#F7FAFC]">
                {compareA.filename} vs {compareB.filename}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#DCEFF8]">Session A: {compareA.overall ?? '—'}</span>
              <span className="text-[#DCEFF8]">Session B: {compareB.overall ?? '—'}</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  (compareB.overall || 0) >= (compareA.overall || 0)
                    ? 'text-[#6FE3B8] bg-[#6FE3B8]/20'
                    : 'text-[#F2766B] bg-[#F2766B]/20'
                }`}
              >
                {(compareB.overall || 0) - (compareA.overall || 0) >= 0 ? '+' : ''}
                {(compareB.overall || 0) - (compareA.overall || 0)} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {[
              { dim: 'Speaking Rate', delta: +6, note: 'Pace improved by 6 points toward target corridor' },
              { dim: 'Vocal Expressiveness', delta: +4, note: 'Pitch dynamics showed greater musicality' },
              { dim: 'Pausing & Fluency', delta: +8, note: 'Vocal fillers decreased noticeably' },
              { dim: 'Gestures', delta: -2, note: 'Hands were slightly more static in session B' },
              { dim: 'Posture', delta: +5, note: 'Shoulder stability remained upright' },
              { dim: 'Visual Engagement', delta: +3, note: 'Camera-facing head orientation remained locked' },
            ].map((d, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#0B1A2D] border border-[#17324F] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#DCEFF8]">{d.dim}</span>
                  <span className={`font-bold ${d.delta >= 0 ? 'text-[#6FE3B8]' : 'text-[#F2766B]'}`}>
                    {d.delta >= 0 ? `+${d.delta}` : d.delta} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#9AAFC2] font-sans leading-relaxed">{d.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {entries.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-2 rounded-2xl bg-[#0B1A2D] border border-[#17324F]">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-1.5 flex-1">
            <Search className="w-4 h-4 text-[#79C8DF] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by filename..."
              className="w-full bg-transparent text-xs text-[#F7FAFC] placeholder-[#7C93A9] focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 px-2 overflow-x-auto">
            {/* Status filters */}
            {(['all', 'done', 'processing', 'failed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-mono capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-[#10243B] text-[#DCEFF8] border border-[#79C8DF]'
                    : 'text-[#7C93A9] hover:text-[#F7FAFC]'
                }`}
              >
                {st}
              </button>
            ))}

            {/* Sort toggle */}
            <div className="flex items-center gap-1 border-l border-[#17324F] pl-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#537FA5]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-mono text-[#DCEFF8] focus:outline-none"
              >
                <option value="newest" className="bg-[#0B1A2D]">Newest</option>
                <option value="oldest" className="bg-[#0B1A2D]">Oldest</option>
                <option value="score" className="bg-[#0B1A2D]">Highest score</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      {entries.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-4 bg-[#0B1A2D]/40 rounded-3xl border border-[#17324F]">
          <EmptyStage />
          <div className="flex flex-col gap-1 max-w-sm">
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[#F7FAFC]">
              No rehearsals yet
            </h2>
            <p className="text-xs text-[#9AAFC2]">
              Your analyses appear here after your first upload.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Link
              to="/upload"
              className="px-6 py-2.5 rounded-full bg-[#F7FAFC] text-[#07111F] text-xs font-semibold hover:bg-[#DCEFF8]"
            >
              Analyze a rehearsal
            </Link>
            <Link
              to="/samples/product-pitch"
              className="px-4 py-2.5 rounded-full border border-[#17324F] text-xs font-mono text-[#9AAFC2] hover:text-[#F7FAFC]"
            >
              Explore sample
            </Link>
          </div>

          <button
            type="button"
            onClick={seedDemoHistory}
            className="text-xs font-mono text-[#79C8DF] hover:underline mt-4"
          >
            Seed demo history (3 sample rehearsals)
          </button>
        </div>
      ) : sortedEntries.length === 0 ? (
        <div className="py-16 text-center text-xs font-mono text-[#7C93A9] bg-[#0B1A2D]/40 rounded-2xl border border-[#17324F]">
          No matches found for these filters.{' '}
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
            className="text-[#79C8DF] hover:underline ml-1"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(groupedByMonth).map(([month, groupEntries]) => (
            <div key={month} className="flex flex-col gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#7C93A9] px-1">
                {month}
              </span>

              <div className="flex flex-col gap-3">
                {groupEntries.map((e) => {
                  const isCompareSelected = selectedForCompare.includes(e.jobId);

                  return (
                    <div
                      key={e.jobId}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompareSelected
                          ? 'bg-[#10243B] border-[#79C8DF] shadow-[0_0_16px_rgba(121,200,223,0.2)]'
                          : 'bg-[#0B1A2D] border-[#17324F] hover:border-[#79C8DF]/40'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {compareMode && e.status === 'done' && (
                          <input
                            type="checkbox"
                            checked={isCompareSelected}
                            onChange={() => handleToggleCompare(e.jobId)}
                            className="w-4 h-4 rounded border-[#17324F] accent-[#79C8DF] cursor-pointer"
                          />
                        )}

                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-['Space_Grotesk'] text-base font-semibold text-[#F7FAFC] truncate">
                              {e.filename}
                            </span>
                            {e.status === 'processing' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#79C8DF]/20 text-[#DCEFF8] border border-[#79C8DF]/40">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
                              </span>
                            )}
                            {e.status === 'failed' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F2766B]/20 text-[#F8978D] border border-[#F2766B]/40">
                                Failed ({e.errorCode || 'ERROR'})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono text-[#7C93A9]">
                            <span>{formatShortMonthDay(e.createdAt)}</span>
                            <span>·</span>
                            <span>{formatTimecode(e.duration_s)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Skyline Strip if available */}
                      {e.composite_strip && e.composite_strip.length > 0 && (
                        <div className="hidden sm:block w-48 h-7">
                          <SignalTimeline
                            windows={e.composite_strip.map((c, idx) => ({
                              i: idx,
                              t0: idx * 5,
                              t1: idx * 5 + 10,
                              composite: c,
                              scores: {} as any,
                              states: {} as any,
                              metrics: {} as any,
                            }))}
                            duration={e.duration_s}
                            mode="compact"
                            interactive={false}
                          />
                        </div>
                      )}

                      {/* Score or Row Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                        {e.status === 'done' && e.overall !== undefined ? (
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC] tabular-nums">
                                {e.overall}
                              </span>
                              <BandBadge band={e.band || 'Solid'} />
                            </div>
                            <Link
                              to={`/analysis/${e.jobId}`}
                              className="px-4 py-2 rounded-xl bg-[#10243B] hover:bg-[#17324F] border border-[#17324F] text-xs font-mono text-[#DCEFF8] hover:text-[#F7FAFC] flex items-center gap-1 transition-colors"
                            >
                              <span>View report</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : e.status === 'processing' ? (
                          <Link
                            to={`/analysis/${e.jobId}`}
                            className="text-xs font-mono text-[#79C8DF] hover:underline"
                          >
                            View progress →
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Link
                              to="/upload"
                              className="text-xs font-mono text-[#F7FAFC] hover:underline"
                            >
                              Retry
                            </Link>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(e.jobId)}
                          className="p-2 rounded-lg text-[#7C93A9] hover:text-[#F2766B] hover:bg-[#10243B] transition-colors"
                          title="Delete rehearsal"
                          aria-label="Delete rehearsal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
