import { X, Info, CheckCircle, WarningCircle, Warning } from '@phosphor-icons/react';
import { useNotificationStore } from '../../stores/notificationStore';

const iconMap = {
  info: <Info weight="fill" className="text-brand-teal" size={24} />,
  success: <CheckCircle weight="fill" className="text-brand-green" size={24} />,
  warning: <Warning weight="fill" className="text-status-warning" size={24} />,
  error: <WarningCircle weight="fill" className="text-status-danger" size={24} />,
};

const bgMap = {
  info: 'bg-[#eaf5fb] border-brand-teal/20',
  success: 'bg-[#f0f9e8] border-brand-green/20',
  warning: 'bg-[#fff8e6] border-status-warning/20',
  error: 'bg-[#fff0f0] border-status-danger/20',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none w-96 max-w-[calc(100vw-3rem)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-8 fade-in ${bgMap[toast.type]}`}
        >
          <div className="shrink-0 mt-0.5">{iconMap[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-bold text-slate-800">{toast.title}</p>
            <p className="font-sans text-sm text-slate-600 mt-1">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      ))}
    </div>
  );
}
