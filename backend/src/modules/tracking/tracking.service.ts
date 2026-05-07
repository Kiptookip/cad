import { FastifyInstance } from 'fastify';
import { Role } from '../../shared/types/index.js';

/**
 * KimiiTrack GPS Tracking Service
 *
 * Platform: Uffizio (salivetracking.uffizio.com microservice)
 * Auth:     Short-lived Bearer JWT — obtained by POSTing credentials to
 *           the Kimiitrack session endpoint (expires every 30 minutes).
 *
 * TODO: The following values need to be filled in once Kimiitrack shares credentials:
 *   - KIMII_BASE_URL  (gps.kimiitelematics.com)
 *   - KIMII_USERNAME  (account login email)
 *   - KIMII_PASSWORD  (account login password)
 *   - KIMII_PROJECT_ID (49 — confirmed from browser inspection)
 *   - KIMII_USER_ID    (82629 — confirmed from browser inspection)
 *
 * Known vehicle IDs (Uffizio internal IDs, confirmed):
 *   260696, 260739, 260740, 260741, 260742, 260743, 260744, 260746, 260747, 260748
 *
 * Microservice endpoint (confirmed):
 *   POST https://salivetracking.uffizio.com/LiveTrackingDashBoardMicroService/api/livetracking
 *   Body: { callFor: "liveData", projectId: "49", vehicleDataId: ?, allWidgetIds: ? }
 *   Auth: Authorization: Bearer {jwt}
 *
 * PENDING: vehicleDataId and allWidgetIds exact format still needs to be confirmed.
 *          Reach out to Kimiitrack/Uffizio support for the correct values.
 */

interface VehicleLocation {
  vehicleId: string;
  imei: string;
  registration: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  ignition: boolean;
  timestamp: string;
  agencyId: string;
  isActive: boolean;
}

export class TrackingService {
  private bearerToken: string | null = null;
  private tokenExpiry: number = 0;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  private readonly baseUrl: string;
  private readonly microserviceUrl = 'https://salivetracking.uffizio.com/LiveTrackingDashBoardMicroService/api/livetracking';
  private readonly projectId: string;
  private readonly userId: string;

  constructor(private app: FastifyInstance) {
    this.baseUrl = app.config.KIMII_BASE_URL ?? '';
    this.projectId = app.config.KIMII_PROJECT_ID ?? '49';
    this.userId = app.config.KIMII_USER_ID ?? '82629';
  }

  /**
   * Authenticates with Kimiitrack and returns a Bearer token.
   * Tokens expire in ~30 minutes so this re-authenticates automatically.
   *
   * TODO: Confirm the login endpoint path with Kimiitrack support.
   */
  private async getBearerToken(): Promise<string> {
    if (this.bearerToken && Date.now() < this.tokenExpiry - 60_000) {
      return this.bearerToken;
    }

    // TODO: Replace with actual login endpoint once confirmed
    const response = await fetch(`${this.baseUrl}/GenerateJSON?`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-requested-with': 'XMLHttpRequest' },
      body: new URLSearchParams({
        javaclassmethodname: 'userLogin',
        javaclassname: 'com.uffizio.tools.projectmanager.GenerateJSONAjax',
        username: this.app.config.KIMII_USERNAME ?? '',
        password: this.app.config.KIMII_PASSWORD ?? '',
      }).toString(),
    });

    const data: any = await response.json();

    if (!data?.token) {
      throw new Error('Kimiitrack authentication failed — check KIMII_USERNAME and KIMII_PASSWORD');
    }

    this.bearerToken = data.token;
    // Tokens last 30 minutes (1800s)
    this.tokenExpiry = Date.now() + 1_800_000;
    return this.bearerToken!;
  }

  /**
   * Fetches live GPS data for all vehicles and updates Redis cache.
   * Called every 60 seconds by the polling worker.
   *
   * TODO: Confirm vehicleDataId and allWidgetIds values with Kimiitrack support.
   */
  async fetchAndCacheLocations(): Promise<void> {
    const token = await this.getBearerToken();

    const response = await fetch(this.microserviceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callFor: 'liveData',
        projectId: this.projectId,
        // TODO: Replace these with correct values from Kimiitrack support
        vehicleDataId: null,
        allWidgetIds: null,
        filterObject: {
          userId: this.userId,
          vehicleRights: '260696,260739,260740,260741,260742,260743,260744,260746,260747,260748',
        },
      }),
    });

    const data: any = await response.json();

    if (!data?.data) {
      this.app.log.warn('Kimiitrack: no vehicle data in response');
      return;
    }

    const locations: VehicleLocation[] = await this.parseAndEnrichLocations(data.data);

    // Cache each vehicle and broadcast fleet positions
    const pipeline = this.app.redis.pipeline();
    for (const loc of locations) {
      const key = `vehicle:${loc.imei}:location`;
      pipeline.set(key, JSON.stringify(loc), 'EX', 300);
    }
    await pipeline.exec();

    // Broadcast throttled fleet positions to all dispatcher/watcher clients
    this.app.io.to(`role:${Role.DISPATCHER}`).to(`role:${Role.WATCHER}`).emit('fleet:pos', locations);
    this.app.log.info(`Kimiitrack: cached ${locations.length} vehicle locations`);
  }

  /**
   * Maps Uffizio API response fields to our internal VehicleLocation format.
   * Also cross-references with DB vehicles by IMEI for agencyId.
   *
   * TODO: Update field mapping once actual liveData response format is confirmed.
   */
  private async parseAndEnrichLocations(rawData: any): Promise<VehicleLocation[]> {
    // Fetch all vehicles from DB to map IMEI → agencyId
    const dbVehicles = await this.app.prisma.vehicle.findMany({
      select: { id: true, imei: true, registrationNumber: true, agencyId: true, isActive: true },
    });
    const vehicleMap = new Map(dbVehicles.map(v => [v.imei, v]));

    const locations: VehicleLocation[] = [];

    // TODO: Adjust these field names once liveData response format is confirmed
    for (const [, vehicle] of Object.entries<any>(rawData)) {
      const gps = vehicle.gps ?? vehicle;
      const imei = String(vehicle.imei_no ?? vehicle.imei ?? '');
      const dbVehicle = vehicleMap.get(imei);

      if (!dbVehicle) continue; // skip vehicles not in our DB

      locations.push({
        vehicleId: dbVehicle.id,
        imei,
        registration: dbVehicle.registrationNumber,
        lat: parseFloat(gps.latitude ?? gps.lat ?? 0),
        lng: parseFloat(gps.longitude ?? gps.lng ?? 0),
        speed: parseFloat(gps.speed ?? 0),
        heading: parseInt(gps.heading ?? 0, 10),
        ignition: gps.ignition === 'on' || gps.ignition === true,
        timestamp: gps.gps_actual_date_time ?? new Date().toISOString(),
        agencyId: dbVehicle.agencyId,
        isActive: dbVehicle.isActive,
      });
    }

    return locations;
  }

  /**
   * Starts the 60-second polling worker.
   * Called once during app startup.
   */
  start(): void {
    if (!this.app.config.KIMII_USERNAME || !this.app.config.KIMII_PASSWORD) {
      this.app.log.warn('Kimiitrack: KIMII_USERNAME or KIMII_PASSWORD not set — GPS polling disabled');
      return;
    }

    this.app.log.info('Kimiitrack: starting GPS polling worker (60s interval)');

    // Run immediately then every 60s
    this.fetchAndCacheLocations().catch(err =>
      this.app.log.error({ err }, 'Kimiitrack: initial fetch failed')
    );

    this.pollingInterval = setInterval(() => {
      this.fetchAndCacheLocations().catch(err =>
        this.app.log.error({ err }, 'Kimiitrack: polling fetch failed')
      );
    }, 60_000);
  }

  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
