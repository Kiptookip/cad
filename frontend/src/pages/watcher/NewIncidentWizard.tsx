import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, ArrowLeft, CheckCircle, MapPin, Phone, User, WarningCircle, MagnifyingGlass, CrosshairSimple, X, PaperPlaneRight } from '@phosphor-icons/react';
import api from '../../api/client';
import Map from '../../components/shared/Map';
import { useNotificationStore } from '../../stores/notificationStore';

type WizardState = {
  alertMode: string;
  alertTime: string;
  subCounty: string;
  notifierContact: string;
  lat: number;
  lng: number;
  locationName: string;
  chiefComplaint: string;
  massCasualty: boolean;
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientContact: string;
  watcherComments: string;
};

const SUB_COUNTIES = [
  'Dagoretti North','Dagoretti South','Embakasi Central','Embakasi East',
  'Embakasi North','Embakasi South','Embakasi West','Kamukunji','Kasarani',
  'Kibra',"Lang'ata",'Makadara','Mathare','Roysambu','Ruaraka','Starehe','Westlands',
];

const STEPS = [
  { title: 'Alert Info', icon: Phone },
  { title: 'Location', icon: MapPin },
  { title: 'Complaint', icon: WarningCircle },
  { title: 'Patient', icon: User },
  { title: 'Review', icon: CheckCircle },
];

export default function NewIncidentWizard() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotificationStore();
  const submitted = (location.state as any)?.submitted;
  const submittedCase = (location.state as any)?.caseNumber;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center">
          <CheckCircle size={36} weight="fill" className="text-brand-green" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-brand-teal">Incident Submitted</h2>
          {submittedCase && (
            <p className="text-sm text-slate-text mt-1">Case <span className="font-semibold text-brand-teal">{submittedCase}</span> is now in the dispatch queue.</p>
          )}
          <p className="text-xs text-slate-text mt-1">A dispatcher has been notified.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/watcher/new-incident', { replace: true, state: {} })}
            className="px-5 py-2.5 border border-surface-border text-brand-teal text-sm font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <PaperPlaneRight size={16} weight="bold" />
            Submit Another
          </button>
          <button
            onClick={() => navigate('/watcher')}
            className="px-5 py-2.5 bg-brand-teal text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [formData, setFormData] = useState<WizardState>({
    alertMode: 'Phone',
    alertTime: new Date().toISOString().slice(0, 16),
    subCounty: 'Westlands',
    notifierContact: '',
    lat: -1.2921,
    lng: 36.8219,
    locationName: '',
    chiefComplaint: '',
    massCasualty: false,
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientContact: '',
    watcherComments: '',
  });

  const update = (updates: Partial<WizardState>) => setFormData(prev => ({ ...prev, ...updates }));

  const searchLocation = async (query?: string) => {
    const q = query ?? searchQuery;
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Nairobi, Kenya')}&limit=1`);
      const data = await res.json();
      if (data?.length > 0) {
        update({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), locationName: q });
        setLocationConfirmed(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    update({ lat, lng });
    setLocationConfirmed(false);
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data?.display_name) {
        const shortName = data.display_name.split(',').slice(0, 2).join(',').trim();
        update({ locationName: shortName });
        setSearchQuery(shortName);
      }
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const createIncident = useMutation({
    mutationFn: async () => api.post('/incidents', {
      chiefComplaint: formData.chiefComplaint,
      locationName: formData.locationName,
      subCounty: formData.subCounty,
      lat: formData.lat,
      lng: formData.lng,
      alertMode: formData.alertMode,
      patientName: formData.patientName,
      patientAge: formData.patientAge,
      patientGender: formData.patientGender,
      patientContact: formData.patientContact,
      massCasualty: formData.massCasualty,
      watcherComments: formData.watcherComments,
      status: 'SUBMITTED',
    }),
    onSuccess: (res) => {
      const caseNumber = res?.data?.data?.caseNumber ?? '';
      navigate('/watcher/new-incident', {
        state: { submitted: true, caseNumber },
      });
    },
    onError: (err: any) => {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: err?.response?.data?.message || 'Could not submit incident. Please check your connection.',
      });
    },
  });

  const isLocationStep = step === 2;

  return (
    <div className="flex flex-col h-full min-h-screen bg-surface-page">

      {/* Top progress bar — always visible */}
      <div className="bg-white border-b border-surface-border px-6 py-4 flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i + 1 === step;
            const done = i + 1 < step;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  active ? 'bg-brand-teal text-white shadow-md' :
                  done ? 'bg-brand-green/20 text-brand-green' :
                  'text-slate-400'
                }`}>
                  <Icon size={12} weight="bold" />
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${done ? 'bg-brand-green' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
            Step {step} of {STEPS.length}
          </span>
          <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-all">
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex ${isLocationStep ? 'flex-col lg:flex-row' : 'items-center justify-center p-6'}`}>

        {/* ── LOCATION STEP: full split-screen layout ── */}
        {isLocationStep && (
          <>
            {/* Left: compact form panel */}
            <div className="w-full lg:w-[380px] bg-white border-r border-surface-border flex flex-col shrink-0">
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-brand-teal rounded-full" />
                  <h2 className="font-sans text-xl font-black text-brand-teal uppercase tracking-tight">Pin the Scene</h2>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Click the map or search to set location</p>
              </div>

              <div className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto">
                {/* Search */}
                <div>
                  <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Search Location</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Kenyatta Hospital, Westlands..."
                        className="w-full h-11 pl-9 pr-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none font-semibold text-brand-teal placeholder:text-slate-300"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchLocation(); } }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => searchLocation()}
                      disabled={isSearching || !searchQuery.trim()}
                      className="h-11 px-4 bg-brand-teal text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-sidebar transition-all disabled:opacity-50 shadow-md"
                    >
                      {isSearching ? '...' : 'Go'}
                    </button>
                  </div>
                </div>

                {/* Location name (editable) */}
                <div>
                  <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Location / Landmark</label>
                  <input
                    type="text"
                    placeholder="Describe the exact scene..."
                    className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none font-semibold text-brand-teal placeholder:text-slate-300"
                    value={formData.locationName}
                    onChange={e => update({ locationName: e.target.value })}
                  />
                </div>

                {/* Sub-county */}
                <div>
                  <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Sub-County</label>
                  <select
                    className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none font-semibold text-brand-teal"
                    value={formData.subCounty}
                    onChange={e => update({ subCounty: e.target.value })}
                  >
                    <option value="">Select sub-county...</option>
                    {SUB_COUNTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Coordinates readout */}
                <div className={`rounded-xl p-4 border transition-all ${formData.locationName ? 'bg-brand-green/5 border-brand-green/20' : 'bg-slate-50 border-surface-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CrosshairSimple size={14} weight="bold" className={formData.locationName ? 'text-brand-green' : 'text-slate-400'} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coordinates</span>
                    {isReverseGeocoding && <span className="text-[9px] text-brand-teal font-black animate-pulse">Identifying...</span>}
                  </div>
                  <p className="font-mono text-sm font-bold text-brand-teal">{formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}</p>
                  {formData.locationName && (
                    <p className="text-xs text-brand-green font-bold mt-1 truncate">{formData.locationName}</p>
                  )}
                </div>

                {/* Hint */}
                <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-4 flex gap-3">
                  <MapPin size={18} weight="fill" className="text-brand-teal shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-brand-teal leading-relaxed">
                    Click anywhere on the map to drop a pin. The address will be filled in automatically.
                  </p>
                </div>
              </div>

              {/* Nav buttons */}
              <div className="p-6 border-t border-surface-border flex justify-between">
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 h-11 rounded-xl font-black text-sm text-slate-400 hover:bg-slate-100 transition-all">
                  <ArrowLeft size={16} weight="bold" /> Back
                </button>
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!formData.locationName || !formData.subCounty}
                  className="flex items-center gap-2 px-6 h-11 bg-brand-teal text-white rounded-xl font-black text-sm hover:bg-brand-sidebar transition-all disabled:opacity-40 shadow-md"
                >
                  Next <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            </div>

            {/* Right: big interactive map */}
            <div className="flex-1 relative min-h-[400px] lg:min-h-0">
              {/* Map layer badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur border border-surface-border rounded-xl px-3 py-2 shadow-md pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
                <span className="font-black text-[10px] uppercase tracking-widest text-brand-teal">Live Scene Pinning</span>
              </div>

              {formData.locationName && (
                <div className="absolute top-4 right-4 z-10 bg-brand-green text-white rounded-xl px-4 py-2 shadow-lg pointer-events-none max-w-[240px]">
                  <p className="font-black text-[10px] uppercase tracking-widest mb-0.5">Scene Pinned</p>
                  <p className="text-xs font-bold truncate">{formData.locationName}</p>
                </div>
              )}

              <Map
                center={[formData.lat, formData.lng]}
                zoom={15}
                markers={[{
                  id: 'scene',
                  lat: formData.lat,
                  lng: formData.lng,
                  title: formData.locationName || 'Click to set location',
                  type: 'incident',
                }]}
                onLocationSelect={handleMapClick}
                layerType="street"
                className="h-full w-full"
              />

              {/* Bottom instruction bar */}
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8 pointer-events-none">
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest text-center">
                  {formData.locationName ? `📍 ${formData.subCounty} · ${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}` : 'Click anywhere on the map to pin the emergency scene'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── ALL OTHER STEPS: centered card layout ── */}
        {!isLocationStep && (
          <div className="w-full max-w-2xl">
            <div className="bg-white border border-surface-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-8">

                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                      <h2 className="font-sans text-2xl font-black text-brand-teal mb-1">Alert Information</h2>
                      <p className="text-sm text-slate-400 font-bold">Record how this emergency was reported.</p>
                    </div>
                    <div>
                      <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-3">Alert Mode</label>
                      <div className="grid grid-cols-4 gap-3">
                        {['Radio', 'Phone', 'Walk-in', 'Other'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => update({ alertMode: mode })}
                            className={`p-4 border rounded-xl text-sm font-black uppercase tracking-wider transition-all ${formData.alertMode === mode ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-surface-border text-slate-400 hover:border-brand-teal/40'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Alert Time</label>
                        <input type="datetime-local" className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={formData.alertTime} onChange={e => update({ alertTime: e.target.value })} />
                      </div>
                      <div>
                        <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Notifier Phone</label>
                        <input type="tel" placeholder="+254..." className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={formData.notifierContact} onChange={e => update({ notifierContact: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                      <h2 className="font-sans text-2xl font-black text-brand-teal mb-1">Chief Complaint</h2>
                      <p className="text-sm text-slate-400 font-bold">Describe the nature of the emergency.</p>
                    </div>
                    <div>
                      <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Primary Complaint</label>
                      <input type="text" placeholder="e.g. Severe Respiratory Distress" className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none font-semibold" value={formData.chiefComplaint} onChange={e => update({ chiefComplaint: e.target.value })} />
                    </div>
                    <label className={`flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${formData.massCasualty ? 'border-status-danger bg-status-danger/5' : 'border-surface-border hover:border-status-danger/40'}`}>
                      <input type="checkbox" className="w-5 h-5 mt-0.5 accent-status-danger" checked={formData.massCasualty} onChange={e => update({ massCasualty: e.target.checked })} />
                      <div>
                        <p className="font-black text-status-danger text-sm uppercase tracking-wider">Declare Mass Casualty Incident (MCI)</p>
                        <p className="text-xs text-status-danger/70 mt-1">Multiple victims requiring heavy response mobilisation.</p>
                      </div>
                    </label>
                    <div>
                      <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Watcher Notes</label>
                      <textarea className="w-full h-28 p-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none resize-none" placeholder="Critical situational details..." value={formData.watcherComments} onChange={e => update({ watcherComments: e.target.value })} />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                      <h2 className="font-sans text-2xl font-black text-brand-teal mb-1">Patient Information</h2>
                      <p className="text-sm text-slate-400 font-bold">Optional — fill in what is known.</p>
                    </div>
                    <div>
                      <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Full Name</label>
                      <input type="text" placeholder="John Doe" className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={formData.patientName} onChange={e => update({ patientName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Age</label>
                        <input type="text" placeholder="e.g. 45" className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={formData.patientAge} onChange={e => update({ patientAge: e.target.value })} />
                      </div>
                      <div>
                        <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Gender</label>
                        <select className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={formData.patientGender} onChange={e => update({ patientGender: e.target.value })}>
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block mb-2">Patient Contact</label>
                      <input type="tel" placeholder="If different from notifier..." className="w-full h-11 px-4 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={formData.patientContact} onChange={e => update({ patientContact: e.target.value })} />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                    <div>
                      <h2 className="font-sans text-2xl font-black text-brand-teal mb-1">Review & Submit</h2>
                      <p className="text-sm text-slate-400 font-bold">Verify all details before pushing to the dispatch queue.</p>
                    </div>
                    {createIncident.isError && (
                      <div className="bg-status-danger/10 border border-status-danger text-status-danger rounded-xl p-4 text-sm font-bold">
                        Submission failed. Please check your connection and try again.
                      </div>
                    )}
                    <div className="bg-slate-50 rounded-xl border border-surface-border divide-y divide-surface-border overflow-hidden">
                      {[
                        { label: 'Alert Mode', value: formData.alertMode },
                        { label: 'Location', value: formData.locationName || 'Not provided' },
                        { label: 'Sub-County', value: formData.subCounty },
                        { label: 'Complaint', value: formData.chiefComplaint || 'Not provided' },
                        { label: 'Patient', value: formData.patientName ? `${formData.patientName}, ${formData.patientAge || '?'} yrs, ${formData.patientGender || '?'}` : 'Unknown' },
                        { label: 'MCI', value: formData.massCasualty ? 'YES — DECLARED' : 'No', danger: formData.massCasualty },
                        { label: 'Notes', value: formData.watcherComments || 'None' },
                      ].map(row => (
                        <div key={row.label} className="px-5 py-3 flex items-start gap-4">
                          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase w-24 shrink-0 mt-0.5">{row.label}</span>
                          <span className={`text-sm font-bold ${row.danger ? 'text-status-danger' : 'text-brand-teal'}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Nav footer */}
              <div className="px-8 py-5 border-t border-surface-border flex justify-between items-center bg-slate-50">
                <button
                  onClick={step === 1 ? () => navigate(-1) : () => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 h-11 rounded-xl font-black text-sm text-slate-400 hover:bg-slate-100 transition-all"
                >
                  <ArrowLeft size={16} weight="bold" />
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                {step < 5 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="flex items-center gap-2 px-6 h-11 bg-brand-teal text-white rounded-xl font-black text-sm hover:bg-brand-sidebar transition-all shadow-md"
                  >
                    Next <ArrowRight size={16} weight="bold" />
                  </button>
                ) : (
                  <button
                    onClick={() => createIncident.mutate()}
                    disabled={createIncident.isPending || !formData.chiefComplaint || !formData.locationName}
                    className="flex items-center gap-2 px-8 h-11 bg-brand-green text-white rounded-xl font-black text-sm hover:brightness-110 transition-all shadow-md disabled:opacity-50"
                  >
                    {createIncident.isPending ? 'Submitting...' : 'Submit Incident'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
