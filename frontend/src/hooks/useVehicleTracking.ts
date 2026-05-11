import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { socket } from '../lib/socket';
import { Vehicle } from '../types/api';

export interface LiveVehicle {
  vehicleId: string;
  imei: string;
  registration: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  ignition: boolean;
  timestamp: string;
  dbStatus: 'READY' | 'BUSY' | 'MAINTENANCE';
  isActive: boolean;
}

export type VehicleTrackingStatus = 'moving' | 'stopped' | 'busy' | 'maintenance' | 'offline';

export function getVehicleTrackingStatus(v: LiveVehicle): VehicleTrackingStatus {
  if (v.dbStatus === 'MAINTENANCE') return 'maintenance';
  if (v.dbStatus === 'BUSY') return 'busy';
  if (!v.isActive || !v.ignition) return 'offline';
  if (v.speed > 2) return 'moving';
  return 'stopped';
}

export function useVehicleTracking() {
  const [livePositions, setLivePositions] = useState<Map<string, LiveVehicle>>(new Map());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const { data: vehicles } = useQuery({
    queryKey: ['admin', 'vehicles', 'tracking'],
    queryFn: async () => {
      const res = await api.get('/admin/vehicles');
      return (res.data.data ?? res.data) as Vehicle[];
    },
    staleTime: 30_000,
  });

  // Seed from DB last-known positions (written by Uffizio poll every 30s)
  useEffect(() => {
    if (!vehicles) return;
    setLivePositions(prev => {
      const next = new Map(prev);
      for (const v of vehicles) {
        if (!v.lastLat || !v.lastLng) continue;
        if (!next.has(v.id)) {
          next.set(v.id, {
            vehicleId: v.id,
            imei: v.imei,
            registration: v.registrationNumber,
            lat: v.lastLat,
            lng: v.lastLng,
            speed: 0,
            heading: 0,
            ignition: false,
            timestamp: v.lastLocationAt ?? new Date().toISOString(),
            dbStatus: (v.status as LiveVehicle['dbStatus']) ?? 'READY',
            isActive: v.isActive,
          });
        }
      }
      return next;
    });
    if (!lastUpdatedAt && vehicles.some(v => v.lastLat)) {
      setLastUpdatedAt(new Date());
    }
  }, [vehicles]);

  // Real-time updates pushed from backend every 30s via Uffizio poll
  useEffect(() => {
    function onFleetPos(updates: LiveVehicle[]) {
      setLivePositions(prev => {
        const next = new Map(prev);
        for (const u of updates) {
          const existing = next.get(u.vehicleId);
          next.set(u.vehicleId, {
            vehicleId: u.vehicleId,
            imei: u.imei ?? existing?.imei ?? '',
            registration: u.registration ?? existing?.registration ?? '',
            lat: u.lat,
            lng: u.lng,
            speed: u.speed ?? 0,
            heading: u.heading ?? 0,
            ignition: u.ignition ?? false,
            timestamp: u.timestamp ?? new Date().toISOString(),
            dbStatus: existing?.dbStatus ?? 'READY',
            isActive: u.isActive ?? existing?.isActive ?? true,
          });
        }
        return next;
      });
      setLastUpdatedAt(new Date());
    }

    socket.on('fleet:pos', onFleetPos);
    return () => { socket.off('fleet:pos', onFleetPos); };
  }, []);

  return {
    vehicles: Array.from(livePositions.values()),
    lastUpdatedAt,
  };
}
