import { X, Check, Trash } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../../stores/notificationStore';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-white shadow-2xl border-l border-surface-border flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-bg">
        <div className="flex items-center gap-2">
          <h3 className="font-sans text-lg font-bold text-brand-teal">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-brand-teal text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
            title="Mark all as read"
          >
            <Check size={18} weight="bold" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-3">
            <Trash size={48} weight="light" />
            <p className="font-sans text-sm">No notifications yet. You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 transition-colors ${notification.read ? 'bg-white opacity-70' : 'bg-[#f2fbff]'} cursor-pointer hover:bg-slate-50`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-sans text-sm ${notification.read ? 'font-semibold text-slate-700' : 'font-bold text-brand-teal'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="font-sans text-sm text-slate-600">{notification.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
