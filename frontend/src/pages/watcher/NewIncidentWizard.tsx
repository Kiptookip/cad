import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle, MapPin, Phone, User, WarningCircle } from '@phosphor-icons/react';
import api from '../../api/client';
import Map from '../../components/shared/Map';

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

export default function NewIncidentWizard() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

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

  const updateForm = (updates: Partial<WizardState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const [isSearching, setIsSearching] = useState(false);

  const searchLocation = async () => {
    if (!formData.locationName) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.locationName + ', Nairobi, Kenya')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        updateForm({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const createIncident = useMutation({
    mutationFn: async () => {
      // POST /incidents
      return api.post('/incidents', {
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
        status: 'SUBMITTED'
      });
    },
    onSuccess: () => {
      navigate('/dashboard'); // Or show success modal
    }
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { title: 'ALERT INFO', icon: <Phone /> },
    { title: 'LOCATION', icon: <MapPin /> },
    { title: 'COMPLAINT', icon: <WarningCircle /> },
    { title: 'PATIENT DATA', icon: <User /> },
    { title: 'REVIEW', icon: <CheckCircle /> }
  ];

  return (
    <div className="p-6 flex-1 flex flex-col items-center">
      
      {/* Progress Bar */}
      <div className="w-full max-w-4xl mb-8">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="font-sans text-xs font-bold text-brand-teal uppercase tracking-widest">Step {step} of 5</span>
          <span className="font-sans text-sm font-bold text-slate-text">{steps[step-1].title}</span>
        </div>
        <div className="flex gap-2 w-full h-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 rounded-full ${i < step ? 'bg-brand-green' : 'bg-slate-200'}`}></div>
          ))}
        </div>
      </div>

      <section className="w-full max-w-4xl bg-white border border-surface-border rounded-lg overflow-hidden shadow-sm flex flex-col lg:flex-row min-h-[500px]">
        {/* Left Form Panel */}
        <div className="flex-1 p-8 border-b lg:border-b-0 lg:border-r border-surface-border flex flex-col">
          
          <div className="mb-6 flex-1">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h2 className="font-sans text-[24px] font-bold text-brand-teal mb-1">Alert Information</h2>
                  <p className="font-sans text-sm text-slate-text mb-6">Record the initial contact details for the new incident.</p>
                </div>
                
                <div>
                  <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">ALERT MODE</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Radio', 'Phone', 'Walk-in', 'Other'].map(mode => (
                      <div 
                        key={mode} 
                        onClick={() => updateForm({ alertMode: mode })}
                        className={`relative flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${formData.alertMode === mode ? 'border-brand-green bg-brand-green/10 text-brand-green font-bold' : 'border-surface-border text-slate-text hover:bg-slate-50'}`}
                      >
                        <span className="font-sans text-sm">{mode}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">ALERT TIME</label>
                    <input 
                      type="datetime-local" 
                      className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                      value={formData.alertTime}
                      onChange={e => updateForm({ alertTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">NOTIFIER PHONE</label>
                    <input 
                      type="tel" 
                      placeholder="+254..." 
                      className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                      value={formData.notifierContact}
                      onChange={e => updateForm({ notifierContact: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h2 className="font-sans text-[24px] font-bold text-brand-teal mb-1">Location Details</h2>
                  <p className="font-sans text-sm text-slate-text mb-6">Pinpoint the exact scene of the emergency.</p>
                </div>
                
                <div>
                  <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">LOCATION NAME / LANDMARK</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Grand Central Station, Platform 4B" 
                      className="flex-1 h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                      value={formData.locationName}
                      onChange={e => updateForm({ locationName: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchLocation(); } }}
                    />
                    <button
                      type="button"
                      onClick={searchLocation}
                      disabled={isSearching || !formData.locationName}
                      className="px-4 h-11 bg-slate-100 hover:bg-slate-200 text-slate-text font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                      {isSearching ? '...' : 'Search'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">SUB-COUNTY</label>
                  <select 
                    className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                    value={formData.subCounty}
                    onChange={e => updateForm({ subCounty: e.target.value })}
                  >
                    <option value="">Select region...</option>
                    <option value="Dagoretti North">Dagoretti North</option>
                    <option value="Dagoretti South">Dagoretti South</option>
                    <option value="Embakasi Central">Embakasi Central</option>
                    <option value="Embakasi East">Embakasi East</option>
                    <option value="Embakasi North">Embakasi North</option>
                    <option value="Embakasi South">Embakasi South</option>
                    <option value="Embakasi West">Embakasi West</option>
                    <option value="Kamukunji">Kamukunji</option>
                    <option value="Kasarani">Kasarani</option>
                    <option value="Kibra">Kibra</option>
                    <option value="Lang'ata">Lang'ata</option>
                    <option value="Makadara">Makadara</option>
                    <option value="Mathare">Mathare</option>
                    <option value="Roysambu">Roysambu</option>
                    <option value="Ruaraka">Ruaraka</option>
                    <option value="Starehe">Starehe</option>
                    <option value="Westlands">Westlands</option>
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h2 className="font-sans text-[24px] font-bold text-brand-teal mb-1">Chief Complaint</h2>
                  <p className="font-sans text-sm text-slate-text mb-6">Describe the nature of the medical emergency.</p>
                </div>
                
                <div>
                  <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">PRIMARY COMPLAINT</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Severe Respiratory Distress" 
                    className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                    value={formData.chiefComplaint}
                    onChange={e => updateForm({ chiefComplaint: e.target.value })}
                  />
                </div>
                
                <label className="flex items-center gap-3 p-4 border border-status-danger bg-status-danger/5 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-status-danger"
                    checked={formData.massCasualty}
                    onChange={e => updateForm({ massCasualty: e.target.checked })}
                  />
                  <div>
                    <p className="font-bold text-status-danger text-sm">Declare Mass Casualty Incident (MCI)</p>
                    <p className="text-xs text-status-danger/80">Check this if there are multiple victims requiring heavy response.</p>
                  </div>
                </label>

                <div>
                  <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">WATCHER NOTES</label>
                  <textarea 
                    className="w-full h-24 p-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none resize-none"
                    placeholder="Add critical situational details..."
                    value={formData.watcherComments}
                    onChange={e => updateForm({ watcherComments: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h2 className="font-sans text-[24px] font-bold text-brand-teal mb-1">Patient Information</h2>
                  <p className="font-sans text-sm text-slate-text mb-6">Provide known details about the victim (Optional).</p>
                </div>
                
                <div>
                  <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">FULL NAME</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                    value={formData.patientName}
                    onChange={e => updateForm({ patientName: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">AGE</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 45" 
                      className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                      value={formData.patientAge}
                      onChange={e => updateForm({ patientAge: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">GENDER</label>
                    <select 
                      className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                      value={formData.patientGender}
                      onChange={e => updateForm({ patientGender: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-2 block">PATIENT CONTACT</label>
                  <input 
                    type="tel" 
                    placeholder="If different from notifier..." 
                    className="w-full h-11 px-4 border border-surface-border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                    value={formData.patientContact}
                    onChange={e => updateForm({ patientContact: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h2 className="font-sans text-[24px] font-bold text-brand-teal mb-1">Review & Submit</h2>
                  <p className="font-sans text-sm text-slate-text mb-6">Verify all details before pushing to the dispatch queue.</p>
                </div>
                
                <div className="bg-[#f2fbff] p-4 rounded-lg border border-surface-border space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-surface-border pb-4">
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest text-slate-text uppercase mb-1">Type</span>
                      <span className="font-semibold text-brand-teal">{formData.chiefComplaint || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest text-slate-text uppercase mb-1">Location</span>
                      <span className="font-semibold text-brand-teal">{formData.locationName || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-b border-surface-border pb-4">
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest text-slate-text uppercase mb-1">Patient</span>
                      <span className="font-semibold text-brand-teal">{formData.patientName || 'Unknown'} ({formData.patientAge || '?'})</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest text-slate-text uppercase mb-1">MCI Protocol</span>
                      <span className={`font-semibold ${formData.massCasualty ? 'text-status-danger' : 'text-slate-text'}`}>
                        {formData.massCasualty ? 'YES - DECLARED' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold tracking-widest text-slate-text uppercase mb-1">Notes</span>
                    <span className="text-sm text-slate-text italic">{formData.watcherComments || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="pt-6 mt-auto flex justify-between items-center border-t border-surface-border">
            <button 
              onClick={step === 1 ? () => navigate(-1) : prevStep}
              className="px-6 h-11 rounded-lg font-sans text-sm font-bold text-slate-text hover:bg-slate-100 transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step < 5 ? (
              <button 
                onClick={nextStep}
                className="px-8 h-11 bg-brand-teal text-white rounded-lg font-sans text-sm font-bold hover:brightness-110 shadow-md flex items-center gap-2 transition-all"
              >
                Next Step
                <ArrowRight weight="bold" />
              </button>
            ) : (
              <button 
                onClick={() => createIncident.mutate()}
                disabled={createIncident.isPending}
                className="px-8 h-11 bg-brand-green text-white rounded-lg font-sans text-sm font-bold hover:brightness-110 shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {createIncident.isPending ? 'Submitting...' : 'SUBMIT INCIDENT'}
              </button>
            )}
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-full lg:w-80 bg-[#eaf5fb] p-8 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-lg border border-surface-border">
            <h4 className="font-sans text-[11px] font-bold tracking-widest text-slate-text uppercase mb-3">Intake Guidance</h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <CheckCircle className="text-brand-green shrink-0 mt-0.5" weight="fill" />
                <p className="font-sans text-xs text-slate-text">Maintain clear communication and verify location thoroughly.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="text-brand-green shrink-0 mt-0.5" weight="fill" />
                <p className="font-sans text-xs text-slate-text">Do not guess vitals or demographics; if unknown, leave blank.</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative rounded-lg overflow-hidden border border-surface-border bg-slate-200 min-h-[200px]">
            <Map 
              center={[formData.lat, formData.lng]} 
              zoom={15} 
              markers={[{ id: 'scene', lat: formData.lat, lng: formData.lng, title: formData.locationName || 'Emergency Scene', type: 'incident' }]}
              className="h-full w-full opacity-80 mix-blend-multiply" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4 pointer-events-none">
              <p className="text-white font-bold font-sans text-sm">{formData.subCounty} Region</p>
              <p className="text-white/80 font-sans text-xs">Awaiting dispatch</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
