// =============================================================================
// MINDI Phase 1 — FileUploader
// Drag/drop + Google Drive connector.
// Shows PII warning banner when fields are redacted.
// =============================================================================
'use client';

import { useState, useRef, useCallback } from 'react';
import { useIngest } from './useIngest';
import { useAuth } from '../auth/useAuth';
import type { IngestJob } from '../../../../../shared/types/node';

const ACCEPTED = ['.txt', '.md', '.pdf', '.json'];
const MAX_MB = 50;

export default function FileUploader({ uid }: { uid: string }) {
  const { user } = useAuth();
  const { activeJobs, recentDone, uploading, error, ingestFile } = useIngest(uid);
  const [dragOver, setDragOver] = useState(false);
  const [piiWarning, setPiiWarning] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setLocalError(null);
    setPiiWarning([]);

    if (!ACCEPTED.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setLocalError('Unsupported file type. Please upload .txt, .md, .pdf, or .json');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setLocalError(`File too large. Maximum size is ${MAX_MB}MB`);
      return;
    }

    try {
      const result = await ingestFile(file);
      if (result?.piiFieldsRemovedByClient?.length) {
        setPiiWarning(result.piiFieldsRemovedByClient);
      }
    } catch {
      // Error handled by hook
    }
  }, [ingestFile]);

  return (
    <div className="space-y-3">
      {/* PII Warning */}
      {piiWarning.length > 0 && (
        <div role="alert" className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <span aria-hidden="true">🛡️</span>
          <div>
            <p className="font-medium text-sm">Personal info detected &amp; removed</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              Mindi redacted: {piiWarning.join(', ')}. Your data was never sent to AI models.
            </p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button" tabIndex={0}
        aria-label="Upload file to brain. Accepts .txt, .md, .pdf, .json up to 50MB"
        onKeyDown={e => e.key === 'Enter' && !uploading && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200 min-h-[140px]
          ${dragOver ? 'border-indigo-400 bg-indigo-400/10' : 'border-white/10 hover:border-white/20 bg-white/3'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="sr-only" aria-hidden="true" />

        {uploading ? (
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
            <p className="text-sm text-white/50">Processing your brain…</p>
          </div>
        ) : (
          <>
            <span className="text-4xl" aria-hidden="true">📄</span>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-white/80">Drop a file, or <span className="text-indigo-400">browse</span></p>
              <p className="text-xs text-white/35">.txt, .md, .pdf, .json · max 50MB</p>
            </div>
          </>
        )}
      </div>

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div className="space-y-1.5" aria-live="polite">
          {activeJobs.map(job => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Google Drive connector (scaffold) */}
      <button
        disabled
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/3 text-white/30 text-sm cursor-not-allowed"
        aria-label="Google Drive connector coming soon"
      >
        <span aria-hidden="true">📁</span>
        <span>Connect Google Drive <span className="text-[10px] bg-white/8 px-1.5 py-0.5 rounded ml-1">Soon</span></span>
      </button>

      {(error || localError) && (
        <p role="alert" className="text-xs text-red-400 px-1">{error || localError}</p>
      )}
    </div>
  );
}

function JobRow({ job }: { job: IngestJob }) {
  const statusLabel: Record<string, string> = {
    queued: 'Queued', chunking: 'Splitting text…', embedding: 'Building vectors…',
    fingerprinting: 'Extracting style…', complete: 'Done', failed: 'Failed',
  };
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/6 text-xs">
      {['queued','chunking','embedding','fingerprinting'].includes(job.status) && (
        <div className="w-3 h-3 border border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
      )}
      {job.status === 'complete'  && <span aria-hidden="true" className="text-emerald-400">✓</span>}
      {job.status === 'failed'    && <span aria-hidden="true" className="text-red-400">✗</span>}
      <span className="text-white/60 flex-1 truncate">{job.fileName}</span>
      <span className="text-white/30">{statusLabel[job.status]}</span>
      {job.progress > 0 && job.status !== 'complete' && (
        <span className="text-white/30">{job.progress}%</span>
      )}
    </div>
  );
}
