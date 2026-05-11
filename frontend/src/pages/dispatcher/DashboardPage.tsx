import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WarningCircle, Broadcast, Truck, Timer, Stack, CornersOut, Plus, Users, CloudCheck, Network, X } from '@phosphor-icons/react';
import api from '../../api/client';
import { Incident } from '../../types/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { useNotificationStore } from '../../stores/notificationStore';
import Map from '../../components/shared/Map';
import { useVehicleTracking } from '../../hooks/useVehicleTracking';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [mapLayer, setMapLayer] = useState<'light' | 'dark' | 'street'>('light');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

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

  const queryClient = useQueryClient();
  const { vehicles: liveVehicles, lastUpdatedAt } = useVehicleTracking();

  // Listen to real-time events
  useEffect(() => {
    socket.connect();
    
    socket.on('incident:new', () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'recent'] });
    });

    return () => {
      socket.off('incident:new');
    };
  }, []);

  const queueCount = queueData?.length ?? 0;
  const recentIncidents = incidentsData ?? [];
  const availableVehicles = liveVehicles.filter(v => v.dbStatus === 'READY').length;

  const incidentMarkers = recentIncidents
    .filter(i => i.lat && i.lng)
    .map(inc => ({
      id: inc.id,
      lat: inc.lat!,
      lng: inc.lng!,
      title: `${inc.caseNumber} - ${inc.chiefComplaint}`,
      type: 'incident' as const,
    }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {/* Queue Count */}
        <div 
          onClick={() => navigate('/queue')}
          className="group relative bg-white border border-surface-border p-4 flex flex-col justify-between h-32 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-status-danger group-hover:w-1.5 transition-all"></div>
          <div className="flex justify-between items-start">
            <span className="font-sans text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase group-hover:text-status-danger transition-colors">Queue Count</span>
            <div className="bg-status-danger/10 p-1.5 rounded-lg group-hover:bg-status-danger group-hover:text-white transition-all duration-300">
              <WarningCircle size={20} weight="bold" />
            </div>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-sans text-3xl font-black text-brand-teal leading-none tracking-tighter">{queueCount}</span>
            <span className="bg-status-danger text-white px-2 py-1 rounded-md text-[8px] font-black tracking-widest uppercase shadow-lg shadow-status-danger/20">CRITICAL</span>
          </div>
        </div>

        {/* Active Incidents */}
        <div 
          onClick={() => navigate('/queue')}
          className="group relative bg-white border border-surface-border p-4 flex flex-col justify-between h-32 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-green group-hover:w-1.5 transition-all"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-sans text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase group-hover:text-brand-green transition-colors">Active Operations</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-brand-green animate-pulse"></span>
                <span className="text-[7px] font-black text-brand-green uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="bg-brand-green/10 p-1.5 rounded-lg group-hover:bg-brand-green group-hover:text-white transition-all duration-300">
              <Broadcast size={20} weight="bold" />
            </div>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-sans text-3xl font-black text-brand-teal leading-none tracking-tighter">
              {recentIncidents.filter(i => i.status === 'DISPATCH_HANDLING' || i.status === 'DISPATCHED').length}
            </span>
            <span className="text-brand-green font-black text-[9px] flex items-center gap-1 bg-brand-green/5 px-2 py-1 rounded-md">
              <Plus size={10} weight="bold" /> 2 New
            </span>
          </div>
        </div>

        {/* Available Vehicles */}
        <div 
          onClick={() => navigate('/fleet')}
          className="group relative bg-white border border-surface-border p-4 flex flex-col justify-between h-32 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-teal group-hover:w-1.5 transition-all"></div>
          <div className="flex justify-between items-start">
            <span className="font-sans text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase group-hover:text-brand-teal transition-colors">Available Units</span>
            <div className="bg-brand-teal/10 p-1.5 rounded-lg group-hover:bg-brand-teal group-hover:text-white transition-all duration-300">
              <Truck size={20} weight="bold" />
            </div>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-sans text-3xl font-black text-brand-teal leading-none tracking-tighter">{availableVehicles}</span>
            <span className="bg-brand-teal text-white px-2 py-1 rounded-md text-[8px] font-black tracking-widest uppercase shadow-lg shadow-brand-teal/20">STANDBY</span>
          </div>
        </div>

        {/* Response Time */}
        <div className="group relative bg-[#1a2327] p-4 flex flex-col justify-between h-32 rounded-xl shadow-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:shadow-brand-green/20">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="font-sans text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase group-hover:text-brand-green transition-colors">Avg Response (TAT)</span>
            <div className="bg-brand-green/20 p-1.5 rounded-lg border border-brand-green/30">
              <Timer size={20} weight="bold" className="text-brand-green" />
            </div>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-sans text-3xl font-black text-white leading-none tracking-tighter shadow-text">6:42</span>
            <div className="text-right">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Benchmark</p>
              <p className="text-xs font-black text-brand-green">7:00</p>
            </div>
          </div>
        </div>
      </div>


      {/* Main Layout: Map & Queue List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Mini Map Section (8 Cols) */}
        <div className={`lg:col-span-8 bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-500 ${
          isMapExpanded ? 'fixed inset-4 z-[100] shadow-2xl' : 'relative'
        }`}>
          <div className="px-6 py-4 border-b border-surface-border flex justify-between items-center bg-[#f8fafb]">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-brand-green rounded-full"></div>
               <h2 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Live Operational Map</h2>
               {isMapExpanded && <span className="bg-brand-green text-brand-sidebar text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Full Scale Tactical View</span>}
            </div>
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
                onClick={() => {
                  setIsMapExpanded(!isMapExpanded);
                  if (!isMapExpanded) {
                    addNotification({ type: 'info', title: 'Tactical View', message: 'Map expanded to full scale.' });
                  }
                }}
                className={`bg-white border border-surface-border px-3 py-1.5 text-xs font-black flex items-center gap-2 rounded-lg transition-all shadow-sm ${
                  isMapExpanded ? 'hover:bg-status-danger hover:text-white' : 'hover:bg-brand-teal hover:text-white'
                }`}
              >
                {isMapExpanded ? (
                  <>
                    <X size={18} weight="bold" /> Close
                  </>
                ) : (
                  <>
                    <CornersOut size={18} weight="bold" /> Expand
                  </>
                )}
              </button>
            </div>
          </div>
          <div className={`relative flex-1 bg-slate-200 ${isMapExpanded ? 'h-full' : 'min-h-[300px] sm:min-h-[400px] lg:min-h-[550px]'}`}>
            {/* Real Interactive Map */}
            <Map
              center={[-1.2921, 36.8219]}
              zoom={isMapExpanded ? 14 : 12}
              markers={incidentMarkers}
              vehicleMarkers={liveVehicles}
              layerType={mapLayer}
              showLiveBadge
              showLegend
              showVehicleList
              lastUpdatedAt={lastUpdatedAt}
            />
          </div>
        </div>

        {/* Queue Preview (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-surface-border rounded-2xl shadow-sm flex flex-col h-[400px] lg:h-[615px] overflow-hidden group">
          <div className="px-8 py-5 border-b border-surface-border flex justify-between items-center bg-[#f8fafb]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-status-danger rounded-full"></div>
              <h2 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Queue Preview</h2>
            </div>
            <span className="bg-status-danger text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-status-danger/20 animate-pulse">PRIORITY</span>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left bg-slate-50/50 border-b border-surface-border">
                  <th className="px-8 py-4 font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">ID / Pri</th>
                  <th className="px-8 py-4 font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Description</th>
                  <th className="px-8 py-4 font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Wait</th>
                </tr>
              </thead>
              <tbody>
                {queueData ? queueData.slice(0, 8).map(incident => (
                  <tr 
                    key={incident.id} 
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="border-b border-surface-border/50 hover:bg-brand-green/5 cursor-pointer transition-all duration-200 group/row"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-sans text-sm font-black text-brand-teal group-hover/row:text-brand-green transition-colors">{incident.caseNumber}</span>
                        <span className="text-[9px] font-black text-status-danger uppercase tracking-widest mt-0.5">Critical</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-sans text-sm font-bold text-brand-teal line-clamp-1 group-hover/row:text-brand-green transition-colors">{incident.chiefComplaint}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{incident.locationName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse"></div>
                         <span className="font-sans text-xs text-status-danger font-black">00:00</span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center font-bold text-slate-400 text-sm uppercase tracking-widest">Queue is clear</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-[#f8fafb] border-t border-surface-border">
            <button 
              onClick={() => navigate('/queue')}
              className="w-full bg-brand-teal text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-brand-sidebar hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-brand-teal/10 active:scale-95 flex items-center justify-center gap-3"
            >
              <Stack size={20} weight="bold" />
              Full Tactical Queue
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
