'use client';

import { useEffect, useRef, useState } from 'react';

interface QueueStatus {
  pendingIndexJobs: number;
  pendingSchedulerJobs: number;
}

interface ProgressTrackerProps {
  onComplete?: () => void;
}

export function ProgressTracker({ onComplete }: ProgressTrackerProps) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [lastCount, setLastCount] = useState(0);
  const initialTotal = useRef<number | null>(null);

  useEffect(() => {
    const pollQueue = async () => {
      try {
        const res = await fetch('/api/admin/settings/run-discovery', { method: 'GET' });
        if (res.ok) {
          const data: QueueStatus = await res.json();
          setStatus(data);

          // Capture the initial total on first poll with jobs
          if (initialTotal.current === null && data.pendingIndexJobs > 0) {
            initialTotal.current = data.pendingIndexJobs;
          }

          // Check if processing is complete
          if (data.pendingIndexJobs === 0 && data.pendingSchedulerJobs === 0 && lastCount > 0) {
            onComplete?.();
          }
          setLastCount(data.pendingIndexJobs);
        }
      } catch {
        // Polling failure is non-fatal — retry on next interval
      }
    };

    pollQueue();
    const interval = setInterval(pollQueue, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [lastCount, onComplete]);

  if (!status || (status.pendingIndexJobs === 0 && status.pendingSchedulerJobs === 0)) {
    return null;
  }

  const total = initialTotal.current ?? status.pendingIndexJobs;
  const completed = total - status.pendingIndexJobs;
  const pct = total > 0 ? Math.min(100, Math.max(0, (completed / total) * 100)) : 0;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        <div>
          <p className="text-sm font-medium text-blue-900">Processing in progress...</p>
          <p className="text-xs text-blue-700">
            {status.pendingIndexJobs} index jobs + {status.pendingSchedulerJobs} scheduler jobs
            pending
          </p>
        </div>
      </div>
      <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
