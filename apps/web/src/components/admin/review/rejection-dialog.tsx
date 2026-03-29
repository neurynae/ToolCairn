'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}

export function RejectionDialog({ open, onOpenChange, onConfirm, pending }: RejectionDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!reason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason('');
      setError('');
    }
    onOpenChange(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-base font-semibold text-gray-900 mb-1">
            Reject node
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mb-4">
            Provide a reason so this rejection can be audited later.
          </Dialog.Description>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Duplicate of existing tool, low confidence data…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Rejecting…' : 'Confirm reject'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
