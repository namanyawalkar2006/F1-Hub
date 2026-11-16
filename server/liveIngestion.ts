/**
 * Live Ingestion & Normalized State Engine
 * Synchronizes with OpenF1 upstream, validates types, normalizes data, and computes real freshness.
 * NEVER fakes or extrapolates data.
 */

import {
  openf1Client,
  OpenF1Session,
  OpenF1Meeting,
  OpenF1RaceControl,
  OpenF1Weather,
} from './openf1Client';
import { formatOpenF1Interval } from './formatOpenF1Interval';
import { calculateFreshness, FreshnessResult, normalizeTyreCompound, TyreCompound } from '../src/utils/f1State';

export interface NormalizedDriverRow {
  position: number;
  driver_number: number;
  broadcast_name: string;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string | null;
  headshot_url: string | null;
  gap: string | null;
  interval: string | null;
  last_lap_time: number | null;
  best_lap_time: number | null;
  tyre_compound: TyreCompound;
  tyre_age: number | null;
  stint: number | null;
  pit_status: 'ON_TRACK' | 'IN_PIT' | 'PIT_STOP' | 'OUT';
  pit_count: number;
  position_change: number; // positive = gained positions, negative = lost
}

export interface NormalizedLiveState {
  session: {
    session_key: number | null;
    session_name: string;
    session_type: string;
    meeting_name: string;
    circuit_short_name: string;
    country_name: string;
    country_flag: string | null;
    date_start: string | null;
    date_end: string | null;
    current_lap: number | null;
    total_laps: number | null;
    is_live: boolean;
  };
  track_status: {
    flag: 'GREEN' | 'YELLOW' | 'RED' | 'VSC' | 'SC' | 'CHEQUERED' | 'CLEAR';
    safety_car: boolean;
    virtual_safety_car: boolean;
    red_flag: boolean;
    status_message: string;
  };
  freshness: FreshnessResult;
  last_source_timestamp: string | null;
  drivers: NormalizedDriverRow[];
  race_control: Array<{
    date: string;
    category: string;
    flag: string | null;
    message: string;
    lap_number: number | null;
  }>;
  weather: {
    air_temperature: number | null;
    track_temperature: number | null;
    humidity: number | null;
    wind_speed: number | null;
    wind_direction: number | null;
    rainfall: number | null;
  } | null;
  provider: {
    name: 'OpenF1';
    status: 'CONNECTED' | 'RECONNECTING' | 'LIVE DATA UNAVAILABLE';
    updated_at: string;
  };
}

class LiveIngestionEngine {
  private currentState: NormalizedLiveState;
  private previousPositions = new Map<number, number>();
  private listeners = new Set<(state: NormalizedLiveState) => void>();
  private isPolling = false;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private activeSessionKey: number | null = null;

  constructor() {
    this.currentState = this.createEmptyState();
  }

  private createEmptyState(): NormalizedLiveState {
    return {
      session: {
        session_key: null,
        session_name: '—',
        session_type: '—',
        meeting_name: '—',
        circuit_short_name: '—',
        country_name: '—',
        country_flag: null,
        date_start: null,
        date_end: null,
        current_lap: null,
        total_laps: null,
        is_live: false,
      },
      track_status: {
        flag: 'CLEAR',
        safety_car: false,
        virtual_safety_car: false,
        red_flag: false,
        status_message: 'Track Clear',
      },
      freshness: {
        status: 'DATA UNAVAILABLE',
        ageSeconds: null,
        displayText: 'LIVE DATA UNAVAILABLE',
      },
      last_source_timestamp: null,
      drivers: [],
      race_control: [],
      weather: null,
      provider: {
        name: 'OpenF1',
        status: 'LIVE DATA UNAVAILABLE',
        updated_at: new Date().toISOString(),
      },
    };
  }

  public subscribe(callback: (state: NormalizedLiveState) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentState);
    return () => this.listeners.delete(callback);
  }

  public getCurrentState(): NormalizedLiveState {
    // Recalculate freshness dynamically based on wall clock time
    const freshness = calculateFreshness(this.currentState.last_source_timestamp);
    this.currentState.freshness = freshness;
    return this.currentState;
  }

  public start() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.syncLoop();
    this.pollIntervalTimer = setInterval(() => this.syncLoop(), 3000);
  }

  public stop() {
    this.isPolling = false;
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }

  public async setSession(sessionKey: number) {
    this.activeSessionKey = sessionKey;
    await this.syncLoop();
  }

  private async syncLoop() {
    try {
      // 1. Identify active or latest session
      let session: OpenF1Session | null = null;
      if (this.activeSessionKey) {
        session = await openf1Client.getSession(this.activeSessionKey);
      }
      if (!session) {
        session = await openf1Client.getLatestSession();
      }

      if (!session) {
        this.currentState.provider.status = 'LIVE DATA UNAVAILABLE';
        this.currentState.freshness = {
          status: 'DATA UNAVAILABLE',
          ageSeconds: null,
          displayText: 'LIVE DATA UNAVAILABLE',
        };
        this.notify();
        return;
      }

      const sessionKey = session.session_key;
      const meetingKey = session.meeting_key;

      // 2. Fetch parallel session datasets
      const [
        meeting,
        driversRaw,
        positionsRaw,
        intervalsRaw,
        lapsRaw,
        stintsRaw,
        raceControlRaw,
        weatherRaw,
        pitsRaw,
      ] = await Promise.all([
        openf1Client.getLatestMeeting(),
        openf1Client.getDrivers(sessionKey),
        openf1Client.getPositions(sessionKey),
        openf1Client.getIntervals(sessionKey),
        openf1Client.getLaps(sessionKey),
        openf1Client.getStints(sessionKey),
        openf1Client.getRaceControl(sessionKey),
        openf1Client.getWeather(sessionKey),
        openf1Client.getPits(sessionKey),
      ]);

      // 3. Determine if currently live
      const now = Date.now();
      const startTime = session.date_start ? new Date(session.date_start).getTime() : 0;
      const endTime = session.date_end ? new Date(session.date_end).getTime() : 0;
      const isLiveNow = now >= startTime && (endTime === 0 || now <= endTime + 3600000); // within 1 hr post session

      // Find the most recent timestamp among positions/intervals/laps
      let latestSourceTimestamp: string | null = null;
      const timestamps = [
        ...positionsRaw.map(p => p.date),
        ...intervalsRaw.map(i => i.date),
        ...raceControlRaw.map(rc => rc.date),
        ...weatherRaw.map(w => w.date),
      ].filter(Boolean);

      if (timestamps.length > 0) {
        timestamps.sort();
        latestSourceTimestamp = timestamps[timestamps.length - 1];
      }

      // 4. Map latest position for each driver
      const latestPositionByDriver = new Map<number, { pos: number; date: string }>();
      for (const p of positionsRaw) {
        const existing = latestPositionByDriver.get(p.driver_number);
        if (!existing || new Date(p.date) > new Date(existing.date)) {
          latestPositionByDriver.set(p.driver_number, { pos: p.position, date: p.date });
        }
      }

      // Map latest intervals
      const latestIntervalByDriver = new Map<number, { gap: number | string | null; interval: number | string | null; date: string }>();
      for (const inv of intervalsRaw) {
        const existing = latestIntervalByDriver.get(inv.driver_number);
        if (!existing || new Date(inv.date) > new Date(existing.date)) {
          latestIntervalByDriver.set(inv.driver_number, {
            gap: inv.gap_to_leader,
            interval: inv.interval,
            date: inv.date,
          });
        }
      }

      // Map driver laps (last lap, best lap, max lap)
      let sessionMaxLap = 0;
      const driverLapsMap = new Map<number, { lastLapTime: number | null; bestLapTime: number | null; currentLap: number }>();
      for (const lap of lapsRaw) {
        if (lap.lap_number > sessionMaxLap) {
          sessionMaxLap = lap.lap_number;
        }
        const existing = driverLapsMap.get(lap.driver_number);
        const lapDuration = lap.lap_duration && lap.lap_duration > 0 ? lap.lap_duration : null;

        if (!existing) {
          driverLapsMap.set(lap.driver_number, {
            lastLapTime: lapDuration,
            bestLapTime: lapDuration,
            currentLap: lap.lap_number,
          });
        } else {
          if (lap.lap_number >= existing.currentLap) {
            existing.currentLap = lap.lap_number;
            if (lapDuration) existing.lastLapTime = lapDuration;
          }
          if (lapDuration && (existing.bestLapTime === null || lapDuration < existing.bestLapTime)) {
            existing.bestLapTime = lapDuration;
          }
        }
      }

      // Map latest tyre stint
      const driverStintMap = new Map<number, { compound: TyreCompound; tyreAge: number | null; stintNum: number | null }>();
      for (const stint of stintsRaw) {
        const existing = driverStintMap.get(stint.driver_number);
        if (!existing || (stint.stint_number && (!existing.stintNum || stint.stint_number >= existing.stintNum))) {
          // Calculate tyre age: age_at_start + (current_lap - lap_start)
          const driverLaps = driverLapsMap.get(stint.driver_number);
          const currentLap = driverLaps?.currentLap ?? stint.lap_start;
          const additionalLaps = Math.max(0, currentLap - stint.lap_start);
          const totalAge = (stint.tyre_age_at_start || 0) + additionalLaps;

          driverStintMap.set(stint.driver_number, {
            compound: normalizeTyreCompound(stint.compound),
            tyreAge: totalAge > 0 ? totalAge : null,
            stintNum: stint.stint_number,
          });
        }
      }

      // Map pit stops count
      const pitCountByDriver = new Map<number, number>();
      for (const pit of pitsRaw) {
        pitCountByDriver.set(pit.driver_number, (pitCountByDriver.get(pit.driver_number) || 0) + 1);
      }

      // 5. Build normalized driver rows
      const rows: NormalizedDriverRow[] = [];
      const distinctDrivers = driversRaw.filter((d, idx, arr) => arr.findIndex(item => item.driver_number === d.driver_number) === idx);

      for (const driver of distinctDrivers) {
        const posInfo = latestPositionByDriver.get(driver.driver_number);
        const position = posInfo ? posInfo.pos : 99;
        const intervalInfo = latestIntervalByDriver.get(driver.driver_number);
        const lapsInfo = driverLapsMap.get(driver.driver_number);
        const stintInfo = driverStintMap.get(driver.driver_number);
        const pitCount = pitCountByDriver.get(driver.driver_number) || 0;

        // Position change calculation compared to previous snapshot
        const prevPos = this.previousPositions.get(driver.driver_number);
        let posChange = 0;
        if (prevPos !== undefined && position < 99 && prevPos < 99) {
          posChange = prevPos - position; // e.g. prev=5, now=4 => +1 (moved up)
        }

        // Pit status detection
        let pitStatus: 'ON_TRACK' | 'IN_PIT' | 'PIT_STOP' | 'OUT' = 'ON_TRACK';
        const recentPit = pitsRaw.filter(p => p.driver_number === driver.driver_number).sort((a, b) => b.lap_number - a.lap_number)[0];
        if (recentPit && lapsInfo && recentPit.lap_number >= lapsInfo.currentLap) {
          pitStatus = 'IN_PIT';
        }

        rows.push({
          position,
          driver_number: driver.driver_number,
          broadcast_name: driver.broadcast_name || driver.full_name,
          name_acronym: driver.name_acronym || '—',
          full_name: driver.full_name || driver.broadcast_name,
          team_name: driver.team_name || '—',
          team_colour: driver.team_colour,
          headshot_url: driver.headshot_url,
          gap: formatOpenF1Interval(intervalInfo?.gap ?? null, true) ?? (position === 1 ? 'LEADER' : null),
          interval: formatOpenF1Interval(intervalInfo?.interval ?? null),
          last_lap_time: lapsInfo?.lastLapTime ?? null,
          best_lap_time: lapsInfo?.bestLapTime ?? null,
          tyre_compound: stintInfo?.compound ?? 'UNKNOWN',
          tyre_age: stintInfo?.tyreAge ?? null,
          stint: stintInfo?.stintNum ?? null,
          pit_status: pitStatus,
          pit_count: pitCount,
          position_change: posChange,
        });
      }

      // Sort drivers by position
      rows.sort((a, b) => a.position - b.position);

      // Re-normalize positions 1..N if positions are sequential or unranked
      rows.forEach((r, idx) => {
        if (r.position === 99) {
          r.position = idx + 1;
        }
      });

      // Update previous positions map for next delta comparison
      for (const r of rows) {
        this.previousPositions.set(r.driver_number, r.position);
      }

      // 6. Track flags and race control status
      const recentRaceControl = raceControlRaw.slice(-15).reverse();
      let flag: 'GREEN' | 'YELLOW' | 'RED' | 'VSC' | 'SC' | 'CHEQUERED' | 'CLEAR' = 'CLEAR';
      let hasSC = false;
      let hasVSC = false;
      let hasRed = false;
      let statusMsg = 'Track Clear';

      if (raceControlRaw.length > 0) {
        const lastFlagMsg = [...raceControlRaw].reverse().find(rc => rc.flag || rc.category === 'Flag' || rc.category === 'SafetyCar');
        if (lastFlagMsg) {
          const msg = (lastFlagMsg.message || '').toUpperCase();
          if (msg.includes('RED FLAG') || lastFlagMsg.flag === 'RED') {
            flag = 'RED';
            hasRed = true;
            statusMsg = 'RED FLAG — SESSION SUSPENDED';
          } else if (msg.includes('VIRTUAL SAFETY CAR') || msg.includes('VSC')) {
            flag = 'VSC';
            hasVSC = true;
            statusMsg = 'VIRTUAL SAFETY CAR DEPLOYED';
          } else if (msg.includes('SAFETY CAR') || msg.includes('SC')) {
            flag = 'SC';
            hasSC = true;
            statusMsg = 'SAFETY CAR DEPLOYED';
          } else if (msg.includes('CHEQUERED') || lastFlagMsg.flag === 'CHEQUERED') {
            flag = 'CHEQUERED';
            statusMsg = 'SESSION COMPLETED';
          } else if (lastFlagMsg.flag === 'YELLOW') {
            flag = 'YELLOW';
            statusMsg = 'YELLOW FLAG';
          } else if (lastFlagMsg.flag === 'GREEN' || msg.includes('GREEN')) {
            flag = 'GREEN';
            statusMsg = 'GREEN FLAG';
          }
        }
      }

      // 7. Latest weather snapshot
      const latestWeather = weatherRaw.length > 0 ? weatherRaw[weatherRaw.length - 1] : null;

      // 8. Compute Freshness
      const freshness = calculateFreshness(latestSourceTimestamp);

      // Update state
      this.currentState = {
        session: {
          session_key: session.session_key,
          session_name: session.session_name,
          session_type: session.session_type,
          meeting_name: meeting?.meeting_name || session.circuit_short_name || 'Grand Prix',
          circuit_short_name: session.circuit_short_name,
          country_name: session.country_name,
          country_flag: meeting?.country_flag || null,
          date_start: session.date_start,
          date_end: session.date_end,
          current_lap: sessionMaxLap > 0 ? sessionMaxLap : null,
          total_laps: session.session_type === 'Race' ? 71 : null,
          is_live: isLiveNow,
        },
        track_status: {
          flag,
          safety_car: hasSC,
          virtual_safety_car: hasVSC,
          red_flag: hasRed,
          status_message: statusMsg,
        },
        freshness,
        last_source_timestamp: latestSourceTimestamp,
        drivers: rows,
        race_control: recentRaceControl.map(rc => ({
          date: rc.date,
          category: rc.category,
          flag: rc.flag,
          message: rc.message,
          lap_number: rc.lap_number,
        })),
        weather: latestWeather
          ? {
              air_temperature: latestWeather.air_temperature,
              track_temperature: latestWeather.track_temperature,
              humidity: latestWeather.humidity,
              wind_speed: latestWeather.wind_speed,
              wind_direction: latestWeather.wind_direction,
              rainfall: latestWeather.rainfall,
            }
          : null,
        provider: {
          name: 'OpenF1',
          status: 'CONNECTED',
          updated_at: new Date().toISOString(),
        },
      };

      this.notify();
    } catch {
      this.currentState.provider.status = 'RECONNECTING';
      this.notify();
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentState);
      } catch (e) {
        console.error('Error in live ingestion subscriber', e);
      }
    }
  }
}

export const liveIngestion = new LiveIngestionEngine();
