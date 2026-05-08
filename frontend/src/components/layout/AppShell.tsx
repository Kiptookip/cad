import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ToastContainer from '../shared/ToastContainer';
import { socket } from '../../lib/socket';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';

export default function AppShell() {
  const { addNotification } = useNotificationStore();
  const token = useAuthStore((s) => s.token);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!token) return <Navigate to="/login" replace />;

  useEffect(() => {
    socket.connect();

    socket.on('incident:new', (data) => {
      addNotification({
        type: 'warning',
        title: 'New Incident Submitted',
        message: `Incident #${data.id.substring(0, 4)} reported at ${data.locationName}.`,
      });
    });

    socket.on('fleet:offline', (data) => {
      addNotification({
        type: 'error',
        title: 'Vehicle Offline',
        message: `Unit ${data.id.substring(0, 4)} has gone offline unexpectedly.`,
      });
    });

    return () => {
      socket.off('incident:new');
      socket.off('fleet:offline');
    };
  }, [addNotification]);

  return (
    <div className="flex min-h-screen bg-surface-page font-sans text-slate-text">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        <TopBar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
