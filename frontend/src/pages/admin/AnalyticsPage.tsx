import { ChartLineUp, Clock, Ambulance, Download, MapTrifold, MapPinLine, Warning, ChartPolar } from '@phosphor-icons/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useNotificationStore } from '../../stores/notificationStore';

const responseTimeData = [
  { time: '08:00', avg: 5.2, target: 8.0 },
  { time: '09:00', avg: 4.8, target: 8.0 },
  { time: '10:00', avg: 6.1, target: 8.0 },
  { time: '11:00', avg: 7.4, target: 8.0 },
  { time: '12:00', avg: 9.2, target: 8.0 }, // Spike during lunch
  { time: '13:00', avg: 6.8, target: 8.0 },
  { time: '14:00', avg: 5.5, target: 8.0 },
];

const fleetData = [
  { sector: 'North', active: 12, idle: 4 },
  { sector: 'South', active: 8, idle: 6 },
  { sector: 'East', active: 15, idle: 2 },
  { sector: 'West', active: 9, idle: 5 },
  { sector: 'Central', active: 22, idle: 1 },
];

export default function AnalyticsPage() {
  const { addNotification } = useNotificationStore();

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-surface-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 bg-brand-green rounded-full"></div>
            <p className="font-sans text-[11px] font-black tracking-[0.2em] text-slate-text uppercase text-xs sm:text-[11px]">Data Intelligence Bureau</p>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-black text-brand-teal tracking-tight uppercase flex items-center gap-4">
            Operational Analytics
          </h2>
        </div>
        <button 
          onClick={() => addNotification({ type: 'success', title: 'Export Complete', message: 'The analytics report has been downloaded to your device.' })}
          className="w-full sm:w-auto bg-white border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-md active:scale-95"
        >
          <Download size={22} weight="bold" />
          Generate Tactical PDF
        </button>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-surface-border shadow-sm group hover:border-brand-green transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-brand-green/10 rounded-xl group-hover:bg-brand-green group-hover:text-white transition-all">
              <Clock size={26} weight="fill" className="text-brand-green group-hover:text-inherit" />
            </div>
          </div>
          <div className="mt-6 font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Avg Response Time</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none mt-1">5.8<span className="text-sm text-slate-400 ml-1 font-bold">MINS</span></div>
          <div className="flex items-center gap-1 mt-4">
             <span className="text-[10px] font-black text-brand-green uppercase tracking-tighter">▼ 1.2M</span>
             <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-1">VS LAST SHIFT</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-surface-border shadow-sm group hover:border-status-info transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-status-info/10 rounded-xl group-hover:bg-status-info group-hover:text-white transition-all">
              <Ambulance size={26} weight="fill" className="text-status-info group-hover:text-inherit" />
            </div>
          </div>
          <div className="mt-6 font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Fleet Utilization</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none mt-1">84%</div>
          <div className="mt-4 flex gap-1">
             <span className="px-2 py-0.5 bg-brand-green/10 text-brand-green text-[9px] font-black rounded-md uppercase tracking-widest border border-brand-green/20">OPTIMAL LOAD</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-surface-border shadow-sm group hover:border-status-danger transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-status-danger/10 rounded-xl group-hover:bg-status-danger group-hover:text-white transition-all">
              <Warning size={26} weight="fill" className="text-status-danger group-hover:text-inherit" />
            </div>
          </div>
          <div className="mt-6 font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">High Priority</div>
          <div className="font-sans text-4xl font-black text-brand-teal leading-none mt-1">24</div>
          <div className="mt-4 text-[9px] font-bold text-status-danger uppercase tracking-widest">Immediate Action Required</div>
        </div>

        <div className="bg-brand-sidebar p-6 rounded-xl border border-brand-teal/30 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-brand-green/20 rounded-xl">
                <MapPinLine size={26} weight="fill" className="text-brand-green" />
              </div>
            </div>
            <div className="mt-6 font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Operational Hotzone</div>
            <div className="font-sans text-4xl font-black text-white leading-none mt-1">CENTRAL</div>
            <div className="mt-4 text-[9px] font-bold text-brand-green uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping"></span>
              92.4 Density Index
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-all scale-125">
             <ChartPolar size={160} weight="fill" className="text-white" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        
        {/* Response Time Area Chart */}
        <div className="bg-white p-8 rounded-xl border border-surface-border shadow-sm flex flex-col h-[450px]">
          <div className="mb-8">
            <h3 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Response Performance</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Turnaround Time (TAT) Trend - Realtime</p>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#88c241" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#88c241" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dx={-10} />
                <RechartsTooltip 
                  cursor={{ stroke: '#88c241', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', background: '#273236', color: '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeDasharray="8 8" fill="none" strokeWidth={2} name="Benchmark (8m)" />
                <Area type="monotone" dataKey="avg" stroke="#88c241" strokeWidth={4} fillOpacity={1} fill="url(#colorAvg)" name="Actual TAT" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Distribution Bar Chart */}
        <div className="bg-white p-8 rounded-xl border border-surface-border shadow-sm flex flex-col h-[450px]">
          <div className="mb-8">
            <h3 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Geographic Deployment</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Resource allocation by metropolitan sector</p>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dx={-10} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', background: '#273236', color: '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Bar dataKey="active" name="En-route" stackId="a" fill="#88c241" radius={[0, 0, 6, 6]} barSize={40} />
                <Bar dataKey="idle" name="Standby" stackId="a" fill="#006973" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
