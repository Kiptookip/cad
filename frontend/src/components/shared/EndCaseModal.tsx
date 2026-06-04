import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XCircle, WarningCircle, X } from '@phosphor-icons/react';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';

interface Props {
  incidentId: string;
  caseNumber: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called after successful closure — use to navigate away or refresh. */
  onSuccess?: () => void;
  /** Extra query keys to invalidate on success. */
  invalidateKeys?: unknown[][];
}

const REASON_PRESETS = [
  'Patient refused treatment / transport',
  'Patient transferred to another facility',
  'False alarm — no emergency confirmed',
  'Resolved on scene without transport',
  'Duplicate case — merged with another incident',
  'Case handed off to partner agency',
];

export default function EndCaseModal({
  incidentId, caseNumber, isOpen, onClose, onSuccess, invalidateKeys = [],
}: Props) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post(`/incidents/${incidentId}/close`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      addNotification({
        type: 'success',
        title: 'Case Closed',
        message: `${caseNumber} has been closed and the reason recorded.`,
      });
      setReason('');
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Close Case',
        message: err?.response?.data?.message || 'Could not close the case. Try again.',
      });
    },
  });

  if (!isOpen) return null;

  const canSubmit = reason.trim().length >= 10 && !mutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-status-danger px-6 py-4 flex items-center gap-3">
          <XCircle size={22} weight="fill" className="text-white/80" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">End Case</p>
            <h2 className="text-base font-bold text-white truncate">{caseNumber}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 bg-status-danger/5 border border-status-danger/20 rounded-xl px-4 py-3">
            <WarningCircle size={18} weight="fill" className="text-status-danger mt-0.5 shrink-0" />
            <p className="text-sm text-status-danger font-medium">
              This will permanently close the case and mark it as resolved. A reason is required and will be saved to the case record.
            </p>
          </div>

          {/* Preset reasons */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {REASON_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-all ${
                    reason === preset
                      ? 'border-status-danger bg-status-danger/5 text-status-danger'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Reason textarea */}
          <div>
            <label className="block text-sm font-bold text-brand-teal mb-2">
              Closure Reason <span className="text-status-danger">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe why this case is being closed (minimum 10 characters)…"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-status-danger focus:border-status-danger outline-none resize-none text-slate-700 placeholder:text-slate-300 bg-white transition-all"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <p className={`text-xs mt-1 ${reason.trim().length < 10 && reason.length > 0 ? 'text-status-danger' : 'text-slate-400'}`}>
              {reason.trim().length} / 10 characters minimum
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-status-danger text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle size={16} weight="fill" />
            {mutation.isPending ? 'Closing…' : 'End Case'}
          </button>
        </div>
      </div>
    </div>
  );
}
