import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MagnifyingGlass, Funnel, Download, DotsThreeVertical, ArrowUpRight, MapTrifold, Crosshair } from '@phosphor-icons/react';
import api from '../../api/client';
import { Vehicle } from '../../types/api';
import { socket } from '../../lib/socket';
import { formatDistanceToNow } from 'date-fns';

import Map from '../../components/shared/Map';
import { useNotificationStore } from '../../stores/notificationStore';
import AddVehicleModal from '../../components/shared/AddVehicleModal';
import { useVehicleTracking, getVehicleTrackingStatus } from '../../hooks/useVehicleTracking';

export default function FleetPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focusPosition, setFocusPosition] = useState<[number, number] | undefined>(undefined);
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const { vehicles: liveVehicles, lastUpdatedAt } = useVehicleTracking();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['admin', 'vehicles'],
    queryFn: async () => {
      const res = await api.get('/admin/vehicles');
      return res.data.data as Vehicle[];
    },
  });

  useEffect(() => {
    socket.connect();
    return () => { socket.off('fleet:pos'); };
  }, [queryClient]);

  const filteredVehicles = vehicles?.filter(v => 
    v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalCount = vehicles?.length || 0;
  // Derive counts from live GPS data (status field not in DB schema)
  const activeCount = liveVehicles.filter(v => v.ignition && v.speed > 2).length;
  const idleCount = liveVehicles.filter(v => v.ignition && v.speed <= 2).length;
  const offlineCount = liveVehicles.filter(v => !v.ignition).length || (vehicles?.filter(v => !v.isActive).length ?? 0);


  const exportFleetToCSV = () => {
    if (!vehicles || vehicles.length === 0) return;
    
    const headers = ['Unit ID', 'Registration', 'Status', 'IMEI', 'Last Check-in', 'Coordinates'];
    const rows = filteredVehicles.map(v => [
      `UNIT-${v.id.substring(0,4).toUpperCase()}`,
      v.registrationNumber,
      v.status,
      v.imei,
      v.lastLocationAt ? new Date(v.lastLocationAt).toLocaleString() : 'N/A',
      v.lastLat && v.lastLng ? `${v.lastLat}, ${v.lastLng}` : 'SIGNAL LOST'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Fleet_Deployment_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({ type: 'success', title: 'Export Complete', message: 'Deployment roster has been downloaded.' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-xl border border-surface-border">
        <div>
          <h2 className="text-xl font-bold text-brand-teal">Fleet Status</h2>
          <p className="text-xs text-slate-text mt-0.5">Vehicle tracking and deployment roster</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-brand-teal text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-teal/90 transition-colors"
        >
          <PlusCircle size={18} weight="bold" />
          Register Unit
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 border border-surface-border rounded-xl">
          <p className="text-xs font-medium text-slate-text mb-3">Total Fleet</p>
          <p className="text-3xl font-bold text-brand-teal leading-none">{totalCount}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-brand-green">
            <ArrowUpRight size={12} weight="bold" />
            <span>{liveVehicles.length} with GPS</span>
          </div>
        </div>
        <div className="bg-white p-5 border border-surface-border rounded-xl">
          <p className="text-xs font-medium text-slate-text mb-3">En-route</p>
          <p className="text-3xl font-bold text-brand-green leading-none">{activeCount}</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-brand-green h-full rounded-full transition-all duration-1000" style={{ width: `${totalCount ? (activeCount/totalCount)*100 : 0}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-5 border border-surface-border rounded-xl">
          <p className="text-xs font-medium text-slate-text mb-3">Standby</p>
          <p className="text-3xl font-bold text-status-info leading-none">{idleCount}</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-status-info h-full rounded-full transition-all duration-1000" style={{ width: `${totalCount ? (idleCount/totalCount)*100 : 0}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-5 border border-surface-border rounded-xl">
          <p className="text-xs font-medium text-slate-text mb-3">Out of Service</p>
          <p className="text-3xl font-bold text-status-danger leading-none">{offlineCount}</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-status-danger h-full rounded-full transition-all duration-1000" style={{ width: `${totalCount ? (offlineCount/totalCount)*100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-surface-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-surface-border flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h3 className="font-semibold text-brand-teal">Vehicles</h3>
            <div className="flex items-center bg-white border border-surface-border rounded-lg px-4 py-2 shadow-inner group focus-within:border-brand-green transition-all">
              <MagnifyingGlass size={20} className="text-slate-400 group-focus-within:text-brand-green" />
              <input 
                className="border-none focus:ring-0 text-sm w-full sm:w-72 bg-transparent outline-none pl-3 font-semibold text-brand-teal placeholder:text-slate-400" 
                placeholder="Search Unit ID or Registration..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => addNotification({ type: 'info', title: 'Filters applied', message: 'Advanced filters panel opened.' })}
              className="p-3 hover:bg-brand-teal hover:text-white rounded-xl text-slate-500 transition-all shadow-sm border border-surface-border"
            >
              <Funnel size={22} weight="bold" />
            </button>
            <button 
              onClick={exportFleetToCSV}
              className="p-3 hover:bg-brand-teal hover:text-white rounded-xl text-slate-500 transition-all shadow-sm border border-surface-border"
            >
              <Download size={22} weight="bold" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-surface-border">
                <th className="px-6 py-3.5 text-xs font-medium text-slate-text">Vehicle</th>
                <th className="px-6 py-3.5 text-xs font-medium text-slate-text">Status</th>
                <th className="px-6 py-3.5 text-xs font-medium text-slate-text">Agency</th>
                <th className="px-6 py-3.5 text-xs font-medium text-slate-text">Speed</th>
                <th className="px-6 py-3.5 text-xs font-medium text-slate-text">Last Check-in</th>
                <th className="px-6 py-3.5 text-xs font-medium text-slate-text">Coordinates</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr><td colSpan={7} className="p-12 text-center font-bold text-slate-400">Syncing with Fleet Database...</td></tr>
              ) : filteredVehicles.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center font-bold text-slate-400">No units found matching criteria.</td></tr>
              ) : (
                filteredVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="font-semibold text-brand-teal text-sm">{v.registrationNumber}</p>
                        <p className="text-xs text-slate-text font-mono mt-0.5">{v.imei}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const live = liveVehicles.find(lv => lv.registration === v.registrationNumber);
                        const s = live ? getVehicleTrackingStatus(live) : (v.isActive ? 'stopped' : 'offline');
                        const cfg: Record<string, { cls: string; label: string }> = {
                          moving:      { cls: 'bg-brand-green/10 text-brand-green', label: 'Moving' },
                          stopped:     { cls: 'bg-status-info/10 text-status-info', label: 'Standby' },
                          busy:        { cls: 'bg-status-warning/10 text-status-warning', label: 'Busy' },
                          maintenance: { cls: 'bg-slate-100 text-slate-500', label: 'Maintenance' },
                          offline:     { cls: 'bg-status-danger/10 text-status-danger', label: 'Offline' },
                        };
                        const { cls, label } = cfg[s];
                        return <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${cls}`}>{label}</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-teal">NMS EOC</td>
                    <td className="px-6 py-4 text-sm text-brand-teal">
                      {(() => {
                        const live = liveVehicles.find(lv => lv.registration === v.registrationNumber);
                        return live ? `${live.speed} km/h` : '—';
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-teal">
                      {(() => {
                        const live = liveVehicles.find(lv => lv.registration === v.registrationNumber);
                        const ts = live?.timestamp ?? v.lastLocationAt;
                        return ts ? formatDistanceToNow(new Date(ts), { addSuffix: true }) : 'N/A';
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const live = liveVehicles.find(lv => lv.registration === v.registrationNumber);
                        const lat = live?.lat ?? v.lastLat;
                        const lng = live?.lng ?? v.lastLng;
                        return (
                          <span className={`text-xs font-mono ${lat && lng ? 'text-brand-green' : 'text-slate-400'}`}>
                            {lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'No signal'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {(() => {
                          const live = liveVehicles.find(lv => lv.registration === v.registrationNumber);
                          const lat = live?.lat ?? v.lastLat;
                          const lng = live?.lng ?? v.lastLng;
                          return (
                            <button
                              title="Locate on map"
                              disabled={!lat || !lng}
                              onClick={() => { if (lat && lng) setFocusPosition([lat, lng]); }}
                              className="p-1.5 text-slate-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Crosshair size={16} weight="bold" />
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => addNotification({ type: 'info', title: 'Vehicle Options', message: 'Vehicle management menu opened.' })}
                          className="p-1.5 text-slate-400 hover:text-brand-teal hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <DotsThreeVertical size={18} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white p-6 border border-surface-border rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-brand-teal">GPS Activity</h3>
              <p className="text-xs text-slate-text mt-0.5">Current vehicle states</p>
            </div>
            {lastUpdatedAt && (
              <span className="text-xs text-slate-text">
                Updated {formatDistanceToNow(lastUpdatedAt, { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="h-48 flex items-end gap-2">
            {liveVehicles.length > 0 ? liveVehicles.map((v) => {
              const s = getVehicleTrackingStatus(v);
              const h = s === 'moving' ? 80 + Math.round(Math.min(v.speed, 120) / 120 * 20)
                      : s === 'stopped' ? 40
                      : s === 'busy' ? 65
                      : 15;
              const color = s === 'moving' ? 'bg-brand-green' : s === 'stopped' ? 'bg-status-info' : s === 'busy' ? 'bg-status-warning' : 'bg-slate-200';
              return (
                <div
                  key={v.vehicleId}
                  className={`flex-1 ${color} rounded-t-md transition-all duration-1000`}
                  style={{ height: `${h}%` }}
                  title={`${v.registration} — ${s} ${s === 'moving' ? `(${v.speed} km/h)` : ''}`}
                />
              );
            }) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Awaiting GPS data…
              </div>
            )}
          </div>
          <div className="flex justify-between mt-6 border-t border-surface-border pt-4">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-slate-text mb-1">Moving</p>
                <p className="text-lg font-bold text-brand-green">{activeCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-text mb-1">Standby</p>
                <p className="text-lg font-bold text-status-info">{idleCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-text mb-1">Offline</p>
                <p className="text-lg font-bold text-status-danger">{offlineCount}</p>
              </div>
            </div>
            <button onClick={exportFleetToCSV} className="text-xs text-slate-text hover:text-brand-teal transition-colors">Download CSV</button>
          </div>
        </div>

        <div className="bg-brand-sidebar p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <MapTrifold size={18} weight="bold" className="text-brand-green" />
              <h3 className="font-semibold text-white">Live Map</h3>
            </div>
            <div className="w-full h-44 rounded-lg relative overflow-hidden mb-5 border border-white/10">
              <Map
                center={[-1.2921, 36.8219]}
                zoom={11}
                vehicleMarkers={liveVehicles}
                layerType="dark"
                showLiveBadge
                showLegend
                focusPosition={focusPosition}
                lastUpdatedAt={lastUpdatedAt}
              />
            </div>
            <p className="text-xs text-slate-400">
              {activeCount} unit{activeCount !== 1 ? 's' : ''} currently moving across the metropolitan area.
            </p>
          </div>
          <button
            onClick={() => addNotification({ type: 'info', title: 'Map Expanded', message: 'Full screen map launched.' })}
            className="w-full py-2.5 border border-brand-green/40 text-brand-green text-sm font-medium rounded-lg mt-6 hover:bg-brand-green hover:text-brand-sidebar transition-all"
          >
            Expand Map
          </button>
        </div>
      </div>
      
      <AddVehicleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
