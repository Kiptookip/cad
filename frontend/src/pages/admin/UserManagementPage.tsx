import { useState } from 'react';
import { UserPlus, MagnifyingGlass, Faders, DotsThreeVertical, Download, ClockCounterClockwise, MagicWand, CaretLeft, CaretRight, TrendUp, ShieldCheck } from '@phosphor-icons/react';
import { useNotificationStore } from '../../stores/notificationStore';

// Mock Data
const users = [
  { id: '1', name: 'Sarah Mitchell', email: 's.mitchell@eoc.gov', role: 'Super Admin', agency: 'National Command', status: 'Active', initials: 'SM', color: 'bg-brand-teal text-white' },
  { id: '2', name: 'Robert Kurosawa', email: 'r.kuro@city-fire.org', role: 'Dispatcher', agency: 'Metropolitan Fire Dept', status: 'Active', initials: 'RK', color: 'bg-[#006973] text-white' },
  { id: '3', name: 'Amanda Lee', email: 'lee.a@regional-ems.net', role: 'Watcher', agency: 'EMS Regional Office', status: 'Offline', initials: 'AL', color: 'bg-slate-300 text-slate-700' },
  { id: '4', name: 'David Wright', email: 'dwright@safety.gov', role: 'Admin', agency: 'Public Safety Dept', status: 'Suspended', initials: 'DW', color: 'bg-brand-green text-white' },
  { id: '5', name: 'James Herrera', email: 'j.herrera@police.net', role: 'Dispatcher', agency: 'City Police Services', status: 'Active', initials: 'JH', color: 'bg-[#cce7f3] text-brand-teal' },
];

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useNotificationStore();
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-surface-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 bg-brand-green rounded-full"></div>
            <p className="font-sans text-[11px] font-black tracking-[0.2em] text-slate-text uppercase text-xs sm:text-[11px]">Personnel & Identity Bureau</p>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-black text-brand-teal tracking-tight uppercase">Personnel Roster</h2>
        </div>
        <button 
          onClick={() => addNotification({ type: 'success', title: 'User Setup', message: 'Add User wizard launched.' })}
          className="w-full sm:w-auto bg-brand-green hover:bg-brand-sidebar hover:text-white text-brand-teal font-black text-xs uppercase tracking-widest px-6 py-3 sm:px-8 sm:py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-95"
        >
          <UserPlus size={22} weight="bold" />
          Enlist Personnel
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-surface-border p-6 rounded-xl shadow-sm group hover:border-brand-green transition-all">
          <div className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-2">Total Personnel</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none">1,284</div>
          <div className="font-sans text-[10px] font-black text-brand-green mt-4 flex items-center gap-1 uppercase tracking-tighter">
            <TrendUp size={14} weight="bold" /> +12 RECRUITED THIS MONTH
          </div>
        </div>
        
        <div className="bg-white border border-surface-border p-6 rounded-xl shadow-sm group hover:border-status-info transition-all">
          <div className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-2">Active Duty</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none">432</div>
          <div className="flex -space-x-2 mt-4">
            <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-green flex items-center justify-center text-[9px] text-white font-black shadow-sm">JD</div>
            <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-teal flex items-center justify-center text-[9px] text-white font-black shadow-sm">ML</div>
            <div className="w-8 h-8 rounded-full border-2 border-white bg-status-info flex items-center justify-center text-[9px] text-white font-black shadow-sm">KS</div>
            <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-sidebar flex items-center justify-center text-[9px] text-white font-black shadow-sm">+429</div>
          </div>
        </div>

        <div className="md:col-span-2 bg-brand-sidebar p-6 rounded-xl shadow-2xl flex items-center justify-between border border-brand-teal/30 relative overflow-hidden group">
          <div className="w-full max-w-md relative z-10">
            <div className="font-sans text-[10px] font-black tracking-[0.2em] text-brand-green uppercase mb-2">Tactical Capacity</div>
            <div className="font-sans text-4xl font-black text-white flex items-end gap-3 leading-none">
              88% <span className="text-[10px] text-brand-green font-black uppercase tracking-widest mb-1.5 bg-brand-green/10 px-3 py-1 rounded-full border border-brand-green/20">High Load</span>
            </div>
            <div className="w-full bg-white/5 h-2.5 rounded-full mt-6 overflow-hidden border border-white/5">
              <div className="bg-brand-green h-full w-[88%] shadow-[0_0_12px_rgba(136,194,65,0.4)]"></div>
            </div>
          </div>
          <div className="hidden md:block opacity-5 group-hover:opacity-10 transition-all scale-150 relative z-0">
            <TrendUp size={80} color="#88c241" weight="fill" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-surface-border rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6 shadow-sm">
        <div className="relative flex-1 group">
          <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-green transition-colors" weight="bold" />
          <input 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-surface-border rounded-lg font-sans text-sm font-semibold text-brand-teal focus:bg-white focus:ring-2 focus:ring-brand-green outline-none transition-all" 
            placeholder="Search by name, email, or agency identifier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 flex-1">
            <span className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Role</span>
            <select className="flex-1 bg-slate-50 border border-surface-border rounded-lg px-4 py-3 font-sans text-xs font-black uppercase tracking-widest text-brand-teal outline-none focus:ring-2 focus:ring-brand-green transition-all cursor-pointer">
              <option>All Roles</option>
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Dispatcher</option>
              <option>Watcher</option>
            </select>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <span className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Agency</span>
            <select className="flex-1 bg-slate-50 border border-surface-border rounded-lg px-4 py-3 font-sans text-xs font-black uppercase tracking-widest text-brand-teal outline-none focus:ring-2 focus:ring-brand-green transition-all cursor-pointer">
              <option>All Agencies</option>
              <option>Fire Dept</option>
              <option>Police Services</option>
              <option>Medical Emergency</option>
            </select>
          </div>
          <button 
            onClick={() => addNotification({ type: 'info', title: 'Filters', message: 'Advanced filter menu opened.' })}
            className="p-3 bg-white border border-surface-border rounded-xl hover:bg-brand-teal hover:text-white text-slate-400 transition-all shadow-sm flex items-center justify-center"
          >
            <Faders size={22} weight="bold" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Table */}
        <div className="flex-[3] bg-white rounded-xl shadow-sm border border-surface-border overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 hide-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-surface-border">
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Personnel</th>
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Operational Role</th>
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Assigned Agency</th>
                  <th className="px-8 py-5 font-sans text-[10px] font-black tracking-[0.2em] text-slate-text uppercase">Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-brand-green/5 transition-all group cursor-default">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${u.color}`}>
                          {u.initials}
                        </div>
                        <div>
                          <div className="font-black text-brand-teal text-sm uppercase tracking-tight">{u.name}</div>
                          <div className="font-bold text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-brand-green/10 text-brand-green px-3 py-1.5 rounded-full font-black text-[10px] border border-brand-green/20 uppercase tracking-widest shadow-sm">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-sm text-brand-teal uppercase tracking-tight">{u.agency}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${u.status === 'Active' ? 'bg-brand-green animate-pulse' : u.status === 'Offline' ? 'bg-slate-300' : 'bg-status-danger'}`}></span>
                        <span className={`font-black text-[11px] uppercase tracking-widest ${u.status === 'Active' ? 'text-brand-teal' : u.status === 'Offline' ? 'text-slate-400' : 'text-status-danger'}`}>{u.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => addNotification({ type: 'info', title: 'User Actions', message: `Editing actions for ${u.name}` })}
                        className="p-3 rounded-xl hover:bg-white text-slate-400 hover:text-brand-teal transition-all shadow-sm border border-transparent hover:border-surface-border"
                      >
                        <DotsThreeVertical size={24} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-slate-50 px-4 sm:px-8 py-5 border-t border-surface-border flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="font-bold text-[11px] text-slate-400 uppercase tracking-widest text-center sm:text-left">Showing 1 to 5 of 1,284 personnel</div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-surface-border hover:bg-white hover:text-brand-teal disabled:opacity-30 text-slate-400 transition-all shadow-sm" disabled>
                <CaretLeft size={20} weight="bold" />
              </button>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-lg bg-brand-teal text-white font-black text-xs shadow-md">1</button>
                <button className="w-9 h-9 rounded-lg hover:bg-white border border-transparent hover:border-surface-border font-black text-xs text-slate-500 transition-all">2</button>
                <button className="w-9 h-9 rounded-lg hover:bg-white border border-transparent hover:border-surface-border font-black text-xs text-slate-500 transition-all">3</button>
              </div>
              <button className="p-2 rounded-lg border border-surface-border hover:bg-white hover:text-brand-teal text-slate-400 transition-all shadow-sm">
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel Widgets */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="bg-[#f8fafb] rounded-xl p-8 border border-surface-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="bg-brand-teal/10 p-2 rounded-lg">
                  <MagicWand size={22} weight="bold" className="text-brand-teal" />
                </div>
               <h4 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Directives</h4>
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => addNotification({ type: 'success', title: 'Exporting...', message: 'Personnel roster downloading.' })}
                className="flex items-center justify-between p-5 bg-white rounded-xl hover:shadow-lg transition-all text-brand-teal border border-surface-border group"
              >
                <span className="font-black text-[11px] uppercase tracking-widest group-hover:text-brand-green transition-colors">Export Tactical Roster</span>
                <Download size={22} weight="bold" className="text-slate-300 group-hover:text-brand-green transition-colors" />
              </button>
              <button 
                onClick={() => addNotification({ type: 'info', title: 'Audit Log', message: 'Opening system audit trail.' })}
                className="flex items-center justify-between p-5 bg-white rounded-xl hover:shadow-lg transition-all text-brand-teal border border-surface-border group"
              >
                <span className="font-black text-[11px] uppercase tracking-widest group-hover:text-brand-green transition-colors">Audit Integrity Log</span>
                <ClockCounterClockwise size={22} weight="bold" className="text-slate-300 group-hover:text-brand-green transition-colors" />
              </button>
              <button 
                onClick={() => addNotification({ type: 'info', title: 'Bulk Update', message: 'Bulk role modification wizard started.' })}
                className="flex items-center justify-between p-5 bg-white rounded-xl hover:shadow-lg transition-all text-brand-teal border border-surface-border group"
              >
                <span className="font-black text-[11px] uppercase tracking-widest group-hover:text-brand-green transition-colors">Bulk Credentialing</span>
                <MagicWand size={22} weight="bold" className="text-slate-300 group-hover:text-brand-green transition-colors" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-brand-teal/30 bg-brand-sidebar shadow-2xl flex-1 min-h-[250px] group">
            <div className="absolute inset-0 p-8 flex flex-col justify-end z-10 bg-gradient-to-t from-brand-sidebar via-brand-sidebar/60 to-transparent">
              <div className="font-sans text-[10px] font-black tracking-[0.2em] text-brand-green uppercase mb-2">Active Theater</div>
              <div className="font-sans text-2xl font-black text-white uppercase tracking-tight">Operation Silver Shield</div>
              <p className="font-sans text-xs font-bold text-slate-400 mt-4 leading-relaxed uppercase tracking-wide">34 Personnel currently deployed. Roster modifications restricted by tactical lock.</p>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-all scale-150">
               <ShieldCheck size={120} weight="fill" className="text-white" />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
