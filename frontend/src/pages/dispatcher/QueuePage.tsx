import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Funnel, SortAscending } from '@phosphor-icons/react';
import api from '../../api/client';
import { Incident } from '../../types/api';
import { socket } from '../../lib/socket';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../../stores/notificationStore';

export default function QueuePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await api.get('/incidents');
      return res.data.data as Incident[];
    },
  });

  useEffect(() => {
    socket.connect();
    
    socket.on('incident:new', (incident: Incident) => {
      queryClient.setQueryData(['incidents'], (old: Incident[] | undefined) => {
        if (!old) return [incident];
        return [incident, ...old];
      });
    });

    socket.on('incident:update', (updated: Incident) => {
      queryClient.setQueryData(['incidents'], (old: Incident[] | undefined) => {
        if (!old) return [updated];
        return old.map(inc => inc.id === updated.id ? updated : inc);
      });
    });

    return () => {
      socket.off('incident:new');
      socket.off('incident:update');
    };
  }, [queryClient]);

  const filteredIncidents = incidents?.filter(inc => {
    const matchesSearch = inc.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full gap-4 sm:gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-surface-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 bg-brand-green rounded-full"></div>
            <p className="font-sans text-[11px] font-black tracking-[0.2em] text-slate-text uppercase">Live Incident Management</p>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-black text-brand-teal tracking-tight uppercase">Tactical Queue</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center bg-white p-4 sm:p-6 border border-surface-border rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-green transition-colors" size={20} weight="bold" />
          <input 
            type="text" 
            placeholder="Search Case Number or Complaint..." 
            className="w-full pl-12 pr-4 py-3 border border-surface-border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-green outline-none text-sm font-semibold text-brand-teal transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 border border-surface-border rounded-lg flex items-center gap-3 group focus-within:ring-2 focus-within:ring-brand-green transition-all">
            <Funnel className="text-slate-400" size={18} weight="bold" />
            <select 
              className="bg-transparent border-none focus:ring-0 py-0 px-0 text-xs font-black uppercase tracking-widest text-brand-teal outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DISPATCH_HANDLING">Handling</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
        <button 
          onClick={() => addNotification({ type: 'info', title: 'Sort', message: 'Sorting applied.' })}
          className="flex items-center gap-2 ml-auto text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-teal hover:bg-brand-teal/5 border border-surface-border px-6 py-3 rounded-lg transition-all"
        >
          <SortAscending size={20} weight="bold" /> Sort Feed
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1 hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-surface-border sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Operational ID</th>
                <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Current Status</th>
                <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Medical Complaint</th>
                <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Zone / Sector</th>
                <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Response Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center font-bold text-slate-400">Synchronizing Tactical Feed...</td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center font-bold text-slate-400">No operations found in current filter.</td>
                </tr>
              ) : (
                filteredIncidents.map(inc => (
                  <tr 
                    key={inc.id} 
                    className="hover:bg-brand-green/5 cursor-pointer transition-all group"
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-brand-teal text-sm uppercase tracking-tight group-hover:text-brand-green transition-colors">{inc.caseNumber}</span>
                        {inc.massCasualty && (
                          <span className="mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse"></span>
                            <span className="text-[9px] font-black text-status-danger uppercase tracking-widest">MCI ALERT</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm border ${
                        inc.status === 'SUBMITTED' ? 'bg-status-danger/10 text-status-danger border-status-danger/20' :
                        inc.status === 'DISPATCH_HANDLING' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
                        inc.status === 'DISPATCHED' ? 'bg-status-info/10 text-status-info border-status-info/20' :
                        'bg-status-success/10 text-status-success border-status-success/20'
                      }`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-brand-teal">{inc.chiefComplaint}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinical Note Available</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-brand-teal line-clamp-1">{inc.locationName}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{inc.subCounty}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                           Date.now() - new Date(inc.createdAt).getTime() > 1000 * 60 * 10 ? 'bg-status-danger animate-pulse' : 'bg-brand-green'
                        }`}></div>
                        <span className="text-sm font-black text-brand-teal tracking-tight">
                          {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
