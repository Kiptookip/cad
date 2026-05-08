import { useQuery } from '@tanstack/react-query';
import { WarningCircle, Broadcast, Truck, Timer, Stack, CornersOut, Plus, Minus, Users, CloudCheck, Network, Shield } from '@phosphor-icons/react';
import api from '../../api/client';
import { Incident } from '../../types/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { useNotificationStore } from '../../stores/notificationStore';
import Map from '../../components/shared/Map';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [mapLayer, setMapLayer] = useState<'light' | 'dark' | 'street'>('light');

  // Query to get recent incidents
  const { data: incidentsData } = useQuery({
    queryKey: ['incidents', 'recent'],
    queryFn: async () => {
      const res = await api.get('/incidents?limit=10');
      return res.data.data as Incident[];
    },
  });

  // Query to get queue count
  const { data: queueData } = useQuery({
    queryKey: ['dispatch', 'queue'],
    queryFn: async () => {
      const res = await api.get('/dispatch/queue');
      return res.data.data as Incident[];
    },
  });

  // Listen to real-time events
  useEffect(() => {
    socket.connect();
    
    socket.on('incident:new', (incident) => {
      console.log('New incident received:', incident);
      // In a real app, we would invalidate queries or update React Query cache here
    });

    return () => {
      socket.off('incident:new');
      socket.disconnect();
    };
  }, []);

  const queueCount = queueData?.length || 0;
  const recentIncidents = incidentsData || [];

  const mapMarkers = recentIncidents.filter(i => i.lat && i.lng).map(inc => ({
    id: inc.id,
    lat: inc.lat!,
    lng: inc.lng!,
    title: `${inc.caseNumber} - ${inc.chiefComplaint}`,
    type: 'incident' as const
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {/* Queue Count */}
        <div className="bg-white border border-surface-border p-6 flex flex-col justify-between h-40 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-status-danger">
          <div className="flex justify-between items-start">
            <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-slate-text uppercase">Queue Count</span>
            <div className="bg-status-danger/10 p-2 rounded-lg">
              <WarningCircle size={24} weight="bold" className="text-status-danger" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-sans text-4xl font-black text-brand-teal leading-none">{queueCount}</span>
            <span className="bg-status-danger text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase shadow-sm">CRITICAL</span>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white border border-surface-border p-6 flex flex-col justify-between h-40 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-brand-green">
          <div className="flex justify-between items-start">
            <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-slate-text uppercase">Active Operations</span>
            <div className="bg-brand-green/10 p-2 rounded-lg">
              <Broadcast size={24} weight="bold" className="text-brand-green" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-sans text-4xl font-black text-brand-teal leading-none">
              {recentIncidents.filter(i => i.status === 'DISPATCH_HANDLING' || i.status === 'DISPATCHED').length || 8}
            </span>
            <span className="text-brand-green font-black text-xs flex items-center gap-1">
              <Plus size={14} weight="bold" /> 2 New
            </span>
          </div>
        </div>

        {/* Available Vehicles */}
        <div className="bg-white border border-surface-border p-6 flex flex-col justify-between h-40 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-brand-teal">
          <div className="flex justify-between items-start">
            <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-slate-text uppercase">Available Units</span>
            <div className="bg-brand-teal/10 p-2 rounded-lg">
              <Truck size={24} weight="bold" className="text-brand-teal" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-sans text-4xl font-black text-brand-teal leading-none">22</span>
            <span className="bg-brand-teal text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase shadow-sm">STANDBY</span>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-brand-sidebar p-6 flex flex-col justify-between h-40 rounded-xl shadow-lg border border-brand-teal/50">
          <div className="flex justify-between items-start">
            <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-slate-300 uppercase">Avg Response (TAT)</span>
            <div className="bg-white/10 p-2 rounded-lg">
              <Timer size={24} weight="bold" className="text-brand-green" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-sans text-4xl font-black text-white leading-none tracking-tight">6:42</span>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Benchmark</p>
              <p className="text-xs font-black text-brand-green">7:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Map & Queue List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Mini Map Section (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-surface-border flex justify-between items-center bg-[#f8fafb]">
            <h2 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Live Operational Map</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const layers: ('light' | 'dark' | 'street')[] = ['light', 'dark', 'street'];
                  const nextLayer = layers[(layers.indexOf(mapLayer) + 1) % layers.length];
                  setMapLayer(nextLayer);
                  addNotification({ type: 'info', title: 'Layer Changed', message: `Map layer set to ${nextLayer}.` });
                }}
                className="bg-white border border-surface-border px-3 py-1.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 rounded-lg hover:bg-brand-teal hover:text-white transition-all shadow-sm"
              >
                <Stack size={18} weight="bold" /> Layers
              </button>
              <button 
                onClick={() => addNotification({ type: 'info', title: 'Expanded', message: 'Map expanded to full screen.' })}
                className="bg-white border border-surface-border px-3 py-1.5 text-xs font-black flex items-center gap-1 rounded-lg hover:bg-brand-teal hover:text-white transition-all shadow-sm"
              >
                <CornersOut size={18} weight="bold" />
              </button>
            </div>
          </div>
          <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] lg:min-h-[550px] bg-slate-200">
            {/* Real Interactive Map */}
            <Map center={[-1.2921, 36.8219]} zoom={12} markers={mapMarkers} layerType={mapLayer} />
          </div>
        </div>

        {/* Queue Preview (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-surface-border rounded-xl shadow-sm flex flex-col h-[400px] lg:h-[615px]">
          <div className="px-6 py-4 border-b border-surface-border flex justify-between items-center bg-[#f8fafb]">
            <h2 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Queue Preview</h2>
            <span className="bg-status-danger text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">PRIORITY</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left bg-slate-50 border-b border-surface-border">
                  <th className="p-4 font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase">ID / Pri</th>
                  <th className="p-4 font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase">Description</th>
                  <th className="p-4 font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase">Wait</th>
                </tr>
              </thead>
              <tbody>
                {queueData ? queueData.slice(0, 5).map(incident => (
                  <tr key={incident.id} className="border-b border-surface-border hover:bg-slate-50 cursor-pointer">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-sans text-sm font-bold text-brand-teal">{incident.caseNumber}</span>
                        <span className="text-[10px] font-bold text-status-danger uppercase">Critical</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-sans text-sm text-brand-teal line-clamp-1">{incident.chiefComplaint}</span>
                        <span className="text-xs text-slate-text">{incident.locationName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-sans text-xs text-status-danger font-bold">00:00</span>
                    </td>
                  </tr>
                )) : (
                  // Mock data if no API response
                  <tr className="border-b border-surface-border hover:bg-slate-50 cursor-pointer">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-sans text-sm font-bold text-brand-teal">#9021</span>
                        <span className="text-[10px] font-bold text-status-danger uppercase">Critical</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-sans text-sm text-brand-teal line-clamp-1">Multi-Vehicle Collision</span>
                        <span className="text-xs text-slate-text">Highway A12 - Exit 4</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-sans text-xs text-status-danger font-bold">02:14</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50 border-t border-surface-border">
            <button 
              onClick={() => navigate('/queue')}
              className="w-full bg-brand-teal text-white py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] hover:bg-brand-sidebar transition-all shadow-md active:scale-95"
            >
              View Full Tactical Queue
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats / Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-white border border-surface-border p-4 rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-lg">
            <Network size={24} className="text-brand-green" />
          </div>
          <div>
            <p className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase">Active Channels</p>
            <p className="font-sans text-base font-bold text-brand-teal">12 Operational</p>
          </div>
        </div>
        <div className="bg-white border border-surface-border p-4 rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-lg">
            <Users size={24} className="text-brand-green" />
          </div>
          <div>
            <p className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase">Staff On-Duty</p>
            <p className="font-sans text-base font-bold text-brand-teal">45 Personnel</p>
          </div>
        </div>
        <div className="bg-white border border-surface-border p-4 rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-lg">
            <CloudCheck size={24} className="text-brand-green" />
          </div>
          <div>
            <p className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase">Comms Integrity</p>
            <p className="font-sans text-base font-bold text-brand-teal">99.98% Nominal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
