import { useEffect, useState, ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LiveVehicle, VehicleTrackingStatus, getVehicleTrackingStatus } from '../../hooks/useVehicleTracking';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// ── Static marker ─────────────────────────────────────────────────────────────

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'incident' | 'vehicle' | 'facility';
}

const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ── Vehicle marker system ─────────────────────────────────────────────────────

const STATUS_PALETTE: Record<VehicleTrackingStatus, { bg: string; light: string; ring: string }> = {
  moving:      { bg: '#15803d', light: '#22c55e', ring: 'rgba(34,197,94,0.18)' },
  stopped:     { bg: '#b45309', light: '#f59e0b', ring: 'rgba(245,158,11,0.16)' },
  busy:        { bg: '#1d4ed8', light: '#3b82f6', ring: 'rgba(59,130,246,0.20)' },
  maintenance: { bg: '#b91c1c', light: '#ef4444', ring: 'rgba(239,68,68,0.16)' },
  offline:     { bg: '#374151', light: '#6b7280', ring: 'rgba(107,114,128,0.12)' },
};

const STATUS_LABEL: Record<VehicleTrackingStatus, string> = {
  moving: 'MOVING', stopped: 'STOPPED', busy: 'EN ROUTE',
  maintenance: 'MAINTENANCE', offline: 'OFFLINE',
};

function secsAgo(ts: string): string {
  const s = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function createVehicleIcon(heading: number, status: VehicleTrackingStatus, speed: number): L.DivIcon {
  const p = STATUS_PALETTE[status];
  const isMoving = status === 'moving';
  const pulse = isMoving
    ? `<circle cx="22" cy="22" r="15" fill="none" stroke="${p.light}" stroke-width="2">
         <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
         <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite"/>
       </circle>` : '';
  const badge = speed > 2
    ? `<circle cx="37" cy="9" r="8" fill="${p.bg}" stroke="white" stroke-width="1.5"/>
       <text x="37" y="13" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="7" font-weight="800">${Math.round(speed)}</text>` : '';
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" overflow="visible">
      ${pulse}
      <circle cx="22" cy="22" r="16" fill="${p.ring}"/>
      <g transform="rotate(${heading},22,22)">
        <rect x="15" y="10" width="14" height="24" rx="4" fill="${p.light}" stroke="${p.bg}" stroke-width="1.5"/>
        <rect x="16.5" y="11.5" width="11" height="6" rx="1.5" fill="rgba(255,255,255,0.75)"/>
        <rect x="16.5" y="25" width="11" height="5" rx="1.5" fill="rgba(255,255,255,0.28)"/>
        <polygon points="22,6 27,11 17,11" fill="${p.bg}"/>
      </g>
      ${badge}
    </svg>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
  });
}

function vehiclePopupHtml(v: LiveVehicle, status: VehicleTrackingStatus): string {
  const p = STATUS_PALETTE[status];
  return `<div style="font-family:system-ui,sans-serif;min-width:200px;padding:2px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <span style="font-size:14px;font-weight:900;color:#0f172a;letter-spacing:-0.02em">${v.registration}</span>
      <span style="background:${p.bg};color:white;font-size:9px;font-weight:800;padding:3px 9px;border-radius:20px;letter-spacing:0.07em">${STATUS_LABEL[status]}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 16px;font-size:11px">
      <div style="color:#64748b;font-weight:600">Speed</div><div style="color:#0f172a;font-weight:800">${Math.round(v.speed)} km/h</div>
      <div style="color:#64748b;font-weight:600">Ignition</div><div style="color:${v.ignition ? '#15803d' : '#dc2626'};font-weight:800">${v.ignition ? 'ON' : 'OFF'}</div>
      <div style="color:#64748b;font-weight:600">Heading</div><div style="color:#0f172a;font-weight:800">${v.heading}°</div>
      <div style="color:#64748b;font-weight:600">Last seen</div><div style="color:#0f172a;font-weight:800">${secsAgo(v.timestamp)}</div>
    </div>
    <div style="margin-top:9px;padding-top:7px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;font-family:monospace;font-weight:700">IMEI ${v.imei}</div>
  </div>`;
}

// ── Leaflet internals ─────────────────────────────────────────────────────────

// Fly-to controller: reacts to a [lat, lng, timestamp] tuple so re-clicking same vehicle re-flies
function FlyToController({ target }: { target: [number, number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target[0], target[1]], 16, { animate: true, duration: 1.2 });
  }, [target, map]);
  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

function ClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// ── Overlay: LIVE badge ───────────────────────────────────────────────────────

function LiveBadge({ vehicleCount, incidentCount, lastUpdatedAt }: {
  vehicleCount: number; incidentCount: number; lastUpdatedAt: Date | null;
}) {
  const timeStr = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5 pointer-events-none">
      <div className="flex items-center gap-2 bg-[#0f172a]/85 backdrop-blur-sm text-white px-3 py-2 rounded-xl shadow-xl border border-white/10">
        <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-black tracking-[0.15em]">LIVE</span>
        {vehicleCount > 0 && <><span className="text-slate-500 text-[10px]">·</span><span className="text-[10px] font-bold text-slate-300">{vehicleCount} unit{vehicleCount !== 1 ? 's' : ''}</span></>}
        {incidentCount > 0 && <><span className="text-slate-500 text-[10px]">·</span><span className="text-[10px] font-bold text-red-400">{incidentCount} incident{incidentCount !== 1 ? 's' : ''}</span></>}
      </div>
      {timeStr && (
        <div className="bg-[#0f172a]/70 backdrop-blur-sm text-slate-400 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold border border-white/5">{timeStr}</div>
      )}
    </div>
  );
}

// ── Overlay: Legend ───────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'Moving' },
  { color: '#f59e0b', label: 'Stopped' },
  { color: '#3b82f6', label: 'En Route' },
  { color: '#ef4444', label: 'Maintenance' },
  { color: '#6b7280', label: 'Offline' },
];

function MapLegend({ hasIncidents }: { hasIncidents: boolean }) {
  return (
    <div className="absolute bottom-8 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 px-3 py-2.5 pointer-events-none">
      <p className="text-[8px] font-black tracking-[0.18em] text-slate-400 uppercase mb-2">Legend</p>
      <div className="flex flex-col gap-1.5">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-[10px] font-semibold text-slate-600 leading-none">{item.label}</span>
          </div>
        ))}
        {hasIncidents && <>
          <div className="border-t border-slate-100 my-0.5" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#dc2626]" />
            <span className="text-[10px] font-semibold text-slate-600 leading-none">Incident</span>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── Overlay: Vehicle list panel ───────────────────────────────────────────────

function VehicleListPanel({
  vehicles,
  onFlyTo,
}: {
  vehicles: LiveVehicle[];
  onFlyTo: (v: LiveVehicle) => void;
}) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<LiveVehicle | null>(null);

  // Keep selected vehicle data fresh as positions update
  const freshSelected = selected
    ? vehicles.find(v => v.vehicleId === selected.vehicleId) ?? selected
    : null;

  function handleSelect(v: LiveVehicle) {
    setSelected(v);
    onFlyTo(v);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-14 left-3 z-[1000] flex items-center gap-2 bg-[#0f172a]/85 backdrop-blur-sm text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 hover:bg-[#0f172a] transition-all text-[10px] font-black tracking-widest"
      >
        <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
        UNITS ({vehicles.length})
      </button>
    );
  }

  return (
    <div className="absolute top-14 left-3 z-[1000] w-56 bg-[#0f172a]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
        {freshSelected ? (
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] font-black tracking-widest uppercase">All Units</span>
          </button>
        ) : (
          <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
            Units · {vehicles.length}
          </span>
        )}
        <button
          onClick={() => setOpen(false)}
          className="w-5 h-5 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-all text-sm leading-none"
        >
          ×
        </button>
      </div>

      {/* Detail view */}
      {freshSelected ? (() => {
        const status = getVehicleTrackingStatus(freshSelected);
        const p = STATUS_PALETTE[status];
        return (
          <div className="px-3 py-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-black text-sm tracking-tight">{freshSelected.registration}</span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: p.bg, color: 'white' }}>
                {STATUS_LABEL[status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <span className="text-slate-500 font-medium">Speed</span>
              <span className="text-white font-bold">{Math.round(freshSelected.speed)} km/h</span>
              <span className="text-slate-500 font-medium">Ignition</span>
              <span className="font-bold" style={{ color: freshSelected.ignition ? '#22c55e' : '#ef4444' }}>
                {freshSelected.ignition ? 'ON' : 'OFF'}
              </span>
              <span className="text-slate-500 font-medium">Heading</span>
              <span className="text-white font-bold">{freshSelected.heading}°</span>
              <span className="text-slate-500 font-medium">Updated</span>
              <span className="text-white font-bold">{secsAgo(freshSelected.timestamp)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 text-[9px] text-slate-600 font-mono">
              {freshSelected.imei}
            </div>
            <button
              onClick={() => onFlyTo(freshSelected)}
              className="w-full text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border border-brand-green/40 text-brand-green hover:bg-brand-green/10 transition-all"
            >
              Re-centre Map
            </button>
          </div>
        );
      })() : (
        /* List view */
        <div className="overflow-y-auto max-h-64 divide-y divide-white/5">
          {vehicles.length === 0 && (
            <p className="text-[11px] text-slate-500 text-center py-6">No units tracked yet</p>
          )}
          {vehicles.map(v => {
            const status = getVehicleTrackingStatus(v);
            const p = STATUS_PALETTE[status];
            return (
              <button
                key={v.vehicleId}
                onClick={() => handleSelect(v)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-all text-left group"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.light }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[11px] font-black truncate group-hover:text-brand-green transition-colors">
                    {v.registration}
                  </p>
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: p.light }}>
                    {STATUS_LABEL[status]}{v.speed > 2 ? `  ${Math.round(v.speed)} km/h` : ''}
                  </p>
                </div>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="text-slate-600 group-hover:text-slate-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  vehicleMarkers?: LiveVehicle[];
  className?: string;
  layerType?: 'light' | 'dark' | 'street';
  onLocationSelect?: (lat: number, lng: number) => void;
  showLegend?: boolean;
  showLiveBadge?: boolean;
  showVehicleList?: boolean;
  lastUpdatedAt?: Date | null;
  /** External trigger: pass a new [lat, lng] value to smoothly fly the map there */
  focusPosition?: [number, number];
  children?: ReactNode;
}

const TILE_URLS = {
  light:  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark:   'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

export default function Map({
  center,
  zoom = 13,
  markers = [],
  vehicleMarkers = [],
  className = 'h-full w-full',
  layerType = 'light',
  onLocationSelect,
  showLegend = false,
  showLiveBadge = false,
  showVehicleList = false,
  lastUpdatedAt = null,
  focusPosition,
  children,
}: MapProps) {
  // [lat, lng, timestamp] — timestamp ensures re-clicking same vehicle re-fires the effect
  const [flyTarget, setFlyTarget] = useState<[number, number, number] | null>(null);

  // React to external focusPosition changes (e.g. fleet table row click)
  useEffect(() => {
    if (focusPosition) {
      setFlyTarget([focusPosition[0], focusPosition[1], Date.now()]);
    }
  }, [focusPosition]);

  function flyToVehicle(v: LiveVehicle) {
    setFlyTarget([v.lat, v.lng, Date.now()]);
  }

  return (
    <div className={`relative z-0 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={TILE_URLS[layerType]}
        />
        <MapUpdater center={center} zoom={zoom} />
        <FlyToController target={flyTarget} />
        {onLocationSelect && <ClickHandler onLocationSelect={onLocationSelect} />}

        {markers.map(m => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={incidentIcon}>
            <Popup><div className="font-sans font-bold text-sm">{m.title}</div></Popup>
          </Marker>
        ))}

        {vehicleMarkers.map(v => {
          const status = getVehicleTrackingStatus(v);
          return (
            <Marker
              key={v.vehicleId}
              position={[v.lat, v.lng]}
              icon={createVehicleIcon(v.heading, status, v.speed)}
              eventHandlers={{ click: () => setFlyTarget([v.lat, v.lng, Date.now()]) }}
            >
              <Popup maxWidth={220}>
                <div dangerouslySetInnerHTML={{ __html: vehiclePopupHtml(v, status) }} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Overlays */}
      {showLiveBadge && (
        <LiveBadge
          vehicleCount={vehicleMarkers.length}
          incidentCount={markers.length}
          lastUpdatedAt={lastUpdatedAt}
        />
      )}
      {showVehicleList && vehicleMarkers.length > 0 && (
        <VehicleListPanel vehicles={vehicleMarkers} onFlyTo={flyToVehicle} />
      )}
      {showLegend && <MapLegend hasIncidents={markers.length > 0} />}
      {children}
    </div>
  );
}
