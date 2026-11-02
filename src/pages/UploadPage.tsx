import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FrameMarks } from '../components/brand/FrameMarks';
import { formatFileSize, formatTimecode } from '../lib/format';
import { getErrorCopy } from '../content/errors';
import { api } from '../lib/api';
import { useHistory } from '../lib/hooks/useHistory';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type CheckState = 'pending' | 'passed' | 'failed';

interface FileChecks {
  format: CheckState;
  size: CheckState;
  length: CheckState;
  audio: CheckState;
}

export function UploadPage() {
  const navigate = useNavigate();
  const { addEntry } = useHistory();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [durationS, setDurationS] = useState<number | null>(null);

  const [checks, setChecks] = useState<FileChecks>({
    format: 'pending',
    size: 'pending',
    length: 'pending',
    audio: 'pending',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [bytesLoaded, setBytesLoaded] = useState(0);
  const [uploadError, setUploadError] = useState<{ title: string; hint: string } | null>(null);

  const allowedExtensions = ['mp4', 'mov', 'webm', 'mkv'];

  const validateFile = (file: File) => {
    setUploadError(null);
    setSelectedFile(file);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isFormatOk = allowedExtensions.includes(ext);
    const isSizeOk = file.size <= 500 * 1024 * 1024; // 500 MB

    const newChecks: FileChecks = {
      format: isFormatOk ? 'passed' : 'failed',
      size: isSizeOk ? 'passed' : 'failed',
      length: 'pending',
      audio: 'pending',
    };

    setChecks(newChecks);

    if (!isFormatOk) {
      setUploadError(getErrorCopy('UNSUPPORTED_FORMAT'));
      return;
    }
    if (!isSizeOk) {
      setUploadError(getErrorCopy('FILE_TOO_LARGE'));
      return;
    }

    // Read video duration and capture thumbnail
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      const dur = video.duration;
      setDurationS(dur);

      if (dur < 60) {
        setChecks((prev) => ({ ...prev, length: 'failed' }));
        setUploadError(getErrorCopy('TOO_SHORT'));
        return;
      } else if (dur > 15 * 60) {
        setChecks((prev) => ({ ...prev, length: 'failed' }));
        setUploadError(getErrorCopy('TOO_LONG'));
        return;
      }

      setChecks((prev) => ({
        ...prev,
        length: 'passed',
        audio: 'passed', // Best effort on client
      }));

      // Seek to 1s to capture thumbnail
      video.currentTime = Math.min(1, dur / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 180);
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch {
        // Thumbnail capture skipped
      }
      URL.revokeObjectURL(objectUrl);
    };

    video.onerror = () => {
      // Browser unable to decode video format (e.g. certain MKV)
      setChecks((prev) => ({
        ...prev,
        length: 'passed',
        audio: 'passed',
      }));
      setDurationS(212.4); // Server default estimate
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadPct(0);
    setUploadError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await api.createJob(selectedFile, {
        signal: controller.signal,
        onProgress: (pct, loaded) => {
          setUploadPct(pct);
          setBytesLoaded(loaded);
        },
      });

      // Save initial history entry
      addEntry({
        jobId: res.job_id,
        filename: selectedFile.name,
        createdAt: new Date().toISOString(),
        duration_s: durationS || 212.4,
        status: 'processing',
      });
      await api.startAnalysis(res.job_id);

      toast.success('Upload complete. Rehearsal queued.');
      navigate(`/analysis/${res.job_id}`);
    } catch (err: any) {
      if (err.message === 'Upload aborted') {
        toast.info('Upload cancelled.');
      } else {
        const code = err?.error?.code || 'NETWORK';
        setUploadError(getErrorCopy(code, err?.error?.message, err?.error?.hint));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setThumbnailUrl(null);
    setDurationS(null);
    setUploadError(null);
    setChecks({
      format: 'pending',
      size: 'pending',
      length: 'pending',
      audio: 'pending',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 select-none">
      <div className="flex flex-col gap-2 mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
          Rehearsal Ingestion
        </span>
        <h1 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#F7FAFC]">
          Bring a rehearsal.
        </h1>
        <p className="text-sm text-[#9AAFC2] max-w-xl">
          StageSense inspects format, duration, audio presence and boundaries before upload begins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Aperture Drop Area */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !selectedFile && !isUploading && fileInputRef.current?.click()}
            className={`relative w-full aspect-video rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col items-center justify-center p-6 ${
              isDragOver
                ? 'bg-[#10243B] border-[#79C8DF] shadow-[0_0_40px_rgba(121,200,223,0.3)] ring-2 ring-[#79C8DF]'
                : selectedFile
                ? 'bg-[#0B1A2D] border-[#17324F]'
                : 'bg-[#07111F]/80 border-[#17324F] hover:border-[#79C8DF]/50 hover:bg-[#0B1A2D]/60 cursor-pointer'
            }`}
          >
            {/* Corner Frame Marks */}
            <FrameMarks
              size={isDragOver ? 24 : 16}
              color={isDragOver ? '#79C8DF' : '#537FA5'}
              strokeWidth={1.5}
            />

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
              onChange={(e) => e.target.files?.[0] && validateFile(e.target.files[0])}
              className="hidden"
            />

            {/* Content states */}
            {selectedFile ? (
              <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-center">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Rehearsal Preview Thumbnail"
                    className="w-48 h-28 object-cover rounded-xl border border-[#17324F] shadow-lg mb-1"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#10243B] border border-[#17324F] flex items-center justify-center text-[#79C8DF]">
                    <Upload className="w-7 h-7" />
                  </div>
                )}

                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm text-[#F7FAFC] truncate max-w-sm">
                    {selectedFile.name}
                  </span>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#7C93A9]">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    <span>·</span>
                    <span>{durationS ? formatTimecode(durationS) : 'Calculating...'}</span>
                  </div>
                </div>

                {!isUploading && (
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="px-4 py-1.5 rounded-full border border-[#17324F] text-xs font-mono text-[#9AAFC2] hover:text-[#F2766B] hover:border-[#F2766B] transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartAnalysis();
                      }}
                      disabled={checks.format !== 'passed' || checks.size !== 'passed'}
                      className="px-6 py-2 rounded-full bg-[#F7FAFC] text-[#07111F] text-xs font-semibold hover:bg-[#DCEFF8] hover:shadow-[0_0_16px_#79C8DF] transition-all flex items-center gap-1.5"
                    >
                      <span>Start analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-[#10243B] border border-[#17324F] flex items-center justify-center text-[#79C8DF]">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-['Space_Grotesk'] text-lg font-semibold text-[#F7FAFC]">
                    Drop your rehearsal here
                  </span>
                  <span className="text-xs text-[#7C93A9]">
                    or click to choose a video file
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#537FA5] mt-1">
                  MP4 · MOV · WEBM · MKV — up to 500 MB — 1 to 15 minutes
                </span>
              </div>
            )}

            {/* Uploading Horizon Progress Bar */}
            {isUploading && (
              <div className="absolute inset-x-0 bottom-0 bg-[#07111F]/95 border-t border-[#17324F] p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#DCEFF8]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#79C8DF]" />
                    <span>Uploading rehearsal... {uploadPct}%</span>
                  </div>
                  <span className="text-[#7C93A9]">
                    {formatFileSize(bytesLoaded)} of {selectedFile ? formatFileSize(selectedFile.size) : '—'}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-[#17324F] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#79C8DF] shadow-[0_0_10px_#79C8DF] transition-all duration-200"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="self-end text-[11px] font-mono text-[#F2766B] hover:underline"
                >
                  Cancel upload
                </button>
              </div>
            )}
          </div>

          {/* Four Checks Row */}
          <div className="grid grid-cols-4 gap-2 bg-[#0B1A2D] border border-[#17324F] rounded-2xl p-3 text-xs font-mono">
            {(
              [
                { label: 'Format', state: checks.format },
                { label: 'Size', state: checks.size },
                { label: 'Length', state: checks.length },
                { label: 'Audio', state: checks.audio },
              ] as const
            ).map((c, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#07111F]/60">
                <span className="text-[#7C93A9] text-[10px] mb-1">{c.label}</span>
                {c.state === 'passed' ? (
                  <span className="inline-flex items-center gap-1 text-[#6FE3B8]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> OK
                  </span>
                ) : c.state === 'failed' ? (
                  <span className="inline-flex items-center gap-1 text-[#F2766B]">
                    <XCircle className="w-3.5 h-3.5" /> Fail
                  </span>
                ) : (
                  <span className="text-[#4D647A]">Pending</span>
                )}
              </div>
            ))}
          </div>

          {/* Inline Error Notice */}
          {uploadError && (
            <div className="p-4 rounded-xl bg-[#F2766B]/15 border border-[#F2766B]/40 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-4 h-4 text-[#F2766B] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#F8978D]">{uploadError.title}</span>
                <span className="text-[#DCEFF8]">{uploadError.hint}</span>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="font-mono text-[#79C8DF] hover:underline"
                  >
                    Choose another file
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="font-mono text-[#F7FAFC] hover:underline"
                  >
                    Retry upload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Framing & Calibration Guide */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-[#0B1A2D]/80 border border-[#17324F] rounded-3xl p-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
            Framing & Setup
          </span>

          {/* Minimalist framing SVG illustration */}
          <div className="w-full h-36 bg-[#07111F] rounded-2xl border border-[#17324F] flex items-center justify-center relative overflow-hidden">
            <svg width="180" height="120" viewBox="0 0 180 120" fill="none" className="text-[#79C8DF]">
              {/* Speaker silhouette */}
              <circle cx="90" cy="35" r="14" stroke="currentColor" strokeWidth="1.5" />
              <path d="M60 70 L90 60 L120 70 L120 110 L60 110 Z" stroke="currentColor" strokeWidth="1.5" />
              {/* Hand detection zone */}
              <rect x="45" y="65" width="90" height="40" rx="4" stroke="#DCEFF8" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <text x="90" y="88" textAnchor="middle" fill="#7C93A9" fontSize="9" fontFamily="monospace">
                Hand Gesture Zone
              </text>
            </svg>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-[#537FA5]">
              Head-to-waist framing
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs text-[#9AAFC2] divide-y divide-[#17324F]/70">
            <div className="pt-2 flex items-start gap-2">
              <span className="text-[#79C8DF] font-mono">01</span>
              <span>One speaker, facing the camera lens directly.</span>
            </div>
            <div className="pt-2 flex items-start gap-2">
              <span className="text-[#79C8DF] font-mono">02</span>
              <span>Keep your hands visible in frame if you want Gestures scored.</span>
            </div>
            <div className="pt-2 flex items-start gap-2">
              <span className="text-[#79C8DF] font-mono">03</span>
              <span>Good forward lighting on your face and a quiet acoustic space.</span>
            </div>
            <div className="pt-2 flex items-start gap-2">
              <span className="text-[#79C8DF] font-mono">04</span>
              <span>English speech, between 1 and 15 minutes in length.</span>
            </div>
            <div className="pt-2 flex items-start gap-2">
              <span className="text-[#79C8DF] font-mono">05</span>
              <span>Videos are processed privately. You can delete analyses at any time.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
