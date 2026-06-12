import { Incident, Vehicle } from '../types/api';

export const mockIncidents: Incident[] = [
  {
    id: 'inc-001',
    caseNumber: 'EOC-9021',
    status: 'SUBMITTED',
    chiefComplaint: 'Multi-Vehicle Collision',
    locationName: 'Highway A12 - Exit 4',
    subCounty: 'Westlands',
    lat: -1.2655,
    lng: 36.8010,
    massCasualty: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'inc-002',
    caseNumber: 'EOC-9022',
    status: 'DISPATCH_HANDLING',
    chiefComplaint: 'Structure Fire - Residential',
    locationName: 'South B, Mukuru',
    subCounty: 'Starehe',
    lat: -1.3122,
    lng: 36.8340,
    massCasualty: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'inc-003',
    caseNumber: 'EOC-9023',
    status: 'DISPATCHED',
    chiefComplaint: 'Cardiac Arrest',
    locationName: 'Lavington Mall',
    subCounty: 'Dagoretti North',
    lat: -1.2780,
    lng: 36.7645,
    massCasualty: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'inc-004',
    caseNumber: 'EOC-9024',
    status: 'RESOLVED',
    chiefComplaint: 'Minor Injury - Fall',
    locationName: 'Central Park',
    subCounty: 'CBD',
    lat: -1.2865,
    lng: 36.8172,
    massCasualty: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  }
];

export const mockVehicles: Vehicle[] = [
  {
    id: 'veh-001',
    registrationNumber: 'KCA 123X',
    isActive: true,
    status: 'READY',
    agencyId: 'agency-1',
    lastLat: -1.2921,
    lastLng: 36.8219,
    imei: '864321045678901',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veh-002',
    registrationNumber: 'KCB 456Y',
    isActive: true,
    status: 'BUSY',
    agencyId: 'agency-1',
    lastLat: -1.3000,
    lastLng: 36.8100,
    imei: '864321045678902',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veh-003',
    registrationNumber: 'KCC 789Z',
    isActive: false,
    status: 'MAINTENANCE',
    agencyId: 'agency-1',
    lastLat: -1.2800,
    lastLng: 36.8300,
    imei: '864321045678903',
    createdAt: new Date().toISOString(),
  }
];

export const mockQueueData = mockIncidents.filter(inc => inc.status !== 'RESOLVED');
