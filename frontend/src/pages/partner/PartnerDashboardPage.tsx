import { ShareNetwork, ShieldWarning, Handshake, CheckCircle, Warning, MagnifyingGlass, Funnel, ArrowSquareOut, MapPin, Users } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { Incident } from '../../types/api';
import { useNotificationStore } from '../../stores/notificationStore';
import Map from '../../components/shared/Map';

export default function PartnerDashboardPage() {
  const { addNotification } = useNotificationStore();

  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['partner', 'incidents'],
    queryFn: async () => {
      const res = await api.get('/partner/incidents?limit=20');
      return res.data.data as Incident[];
    },
  });

  const incidents = incidentsData ?? [];
  const urgentCount = incidents.filter(i => i.status === 'SUBMITTED').length;
  const activeCount = incidents.filter(i => i.status === 'DISPATCHED' || i.status === 'DISPATCH_HANDLING').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;

  const mapMarkers = incidents
    .filter(i => i.lat && i.lng)
    .map(i => ({ id: i.id, lat: i.lat!, lng: i.lng!, title: i.chiefComplaint, type: 'incident' as const }));
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-surface-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 bg-brand-green rounded-full"></div>
            <p className="font-sans text-[11px] font-black tracking-[0.2em] text-slate-text uppercase text-xs sm:text-[11px]">Multi-Agency Coordination</p>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-black text-brand-teal tracking-tight uppercase">Partner Overview</h2>
        </div>
        <button 
          onClick={() => addNotification({ type: 'success', title: 'Request Sent', message: 'Resource request has been forwarded to central dispatch.' })}
          className="w-full sm:w-auto bg-brand-teal hover:bg-brand-sidebar text-white font-black text-xs uppercase tracking-widest px-6 py-3 sm:px-8 sm:py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-95"
        >
          <Handshake size={22} weight="fill" />
          Request Resource
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-surface-border shadow-sm relative overflow-hidden group hover:border-brand-green transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-brand-green/10 rounded-xl group-hover:bg-brand-green group-hover:text-white transition-all">
              <ShareNetwork size={26} className="text-brand-green group-hover:text-inherit" />
            </div>
            {urgentCount > 0 && <span className="bg-status-danger text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm animate-pulse">{urgentCount} URGENT</span>}
          </div>
          <div className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-1">Forwarded Cases</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none">{incidents.length}</div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-all">
            <ShieldWarning size={140} weight="fill" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-surface-border shadow-sm group hover:border-status-warning transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-status-warning/10 rounded-xl group-hover:bg-status-warning group-hover:text-white transition-all">
              <Warning size={26} className="text-status-warning group-hover:text-inherit" weight="fill" />
            </div>
          </div>
          <div className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-1">Active Operations</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none">{activeCount}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-surface-border shadow-sm group hover:border-brand-teal transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-brand-teal/10 rounded-xl group-hover:bg-brand-teal group-hover:text-white transition-all">
              <CheckCircle size={26} className="text-brand-teal group-hover:text-inherit" weight="fill" />
            </div>
          </div>
          <div className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-1">Resolved Units</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none">{resolvedCount}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Cases Table */}
        <div className="flex-[2] bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-surface-border bg-[#f8fafb] flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <h3 className="font-sans text-lg sm:text-xl font-black text-brand-teal uppercase tracking-tight flex items-center gap-3">
              <ShareNetwork size={26} weight="bold" />
              Intelligence Feed
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => addNotification({ type: 'info', title: 'Search', message: 'Search functionality triggered.' })}
                className="p-3 text-slate-400 hover:bg-brand-teal hover:text-white rounded-xl transition-all shadow-sm border border-surface-border"
              >
                <MagnifyingGlass size={22} weight="bold" />
              </button>
              <button 
                onClick={() => addNotification({ type: 'info', title: 'Filters', message: 'Filter menu opened.' })}
                className="p-3 text-slate-400 hover:bg-brand-teal hover:text-white rounded-xl transition-all shadow-sm border border-surface-border"
              >
                <Funnel size={22} weight="bold" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-surface-border">
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Case ID / Type</th>
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Geographic Sector</th>
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Response Time</th>
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Priority</th>
                  <th className="px-8 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center font-bold text-slate-400">Loading cases...</td></tr>
                ) : incidents.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center font-bold text-slate-400 uppercase tracking-widest">No forwarded cases</td></tr>
                ) : incidents.map(c => (
                  <tr key={c.id} className="hover:bg-brand-green/5 transition-all group cursor-default">
                    <td className="px-8 py-5">
                      <div className="font-black text-brand-teal text-sm uppercase tracking-tight">{c.caseNumber}</div>
                      <div className="font-bold text-[11px] text-slate-400 uppercase tracking-widest">{c.chiefComplaint}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-brand-teal">
                        <MapPin size={16} className="text-slate-300" />
                        {c.locationName}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-brand-teal">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm border ${
                        c.status === 'SUBMITTED' ? 'bg-status-danger/10 text-status-danger border-status-danger/20' :
                        c.status === 'DISPATCHED' || c.status === 'DISPATCH_HANDLING' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
                        c.status === 'RESOLVED' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                        'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => addNotification({ type: 'info', title: 'Case Details', message: `Opened details for ${c.caseNumber}` })}
                        className="p-3 rounded-xl text-brand-teal hover:bg-brand-teal hover:text-white transition-all shadow-sm border border-surface-border"
                      >
                        <ArrowSquareOut size={22} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Case Breakdown */}
        <div className="flex-1 bg-brand-sidebar p-8 rounded-xl shadow-2xl border border-brand-teal flex flex-col h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-brand-green/20 p-2 rounded-lg">
              <Users size={22} weight="bold" className="text-brand-green" />
            </div>
            <h4 className="font-sans text-xl font-black text-white uppercase tracking-tight">Case Breakdown</h4>
          </div>
          <div className="space-y-8">
            {[
              { label: 'Awaiting Dispatch', val: incidents.filter(i => i.status === 'SUBMITTED').length, total: incidents.length, color: 'bg-status-danger' },
              { label: 'In Progress', val: incidents.filter(i => i.status === 'DISPATCHED' || i.status === 'DISPATCH_HANDLING').length, total: incidents.length, color: 'bg-brand-green' },
              { label: 'Resolved', val: incidents.filter(i => i.status === 'RESOLVED').length, total: incidents.length, color: 'bg-status-info' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between font-bold text-xs uppercase tracking-[0.15em] mb-2">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-black text-white">{item.val}</span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: item.total > 0 ? `${(item.val / item.total) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8">{incidents.length} total cases forwarded</p>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden flex flex-col h-[550px]">
        <div className="px-8 py-6 border-b border-surface-border bg-[#f8fafb] flex justify-between items-center">
          <h3 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight flex items-center gap-3">
            <MapPin size={26} weight="bold" />
            Tactical Deployment Radar
          </h3>
          <div className="flex items-center gap-2">
             <span className="bg-brand-green/10 text-brand-green text-[10px] font-black px-4 py-1.5 rounded-full border border-brand-green/20">LIVE DATA STREAM</span>
          </div>
        </div>
        <div className="flex-1 relative bg-slate-200">
          <Map center={[-1.2921, 36.8219]} zoom={12} markers={mapMarkers} layerType="light" />
        </div>
      </div>

    </div>
  );
}
