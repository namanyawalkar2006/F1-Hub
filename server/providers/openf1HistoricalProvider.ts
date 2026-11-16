/**
 * OpenF1 Historical Provider (Free Community Tier)
 * Accesses recorded session telemetry, laps, weather, and race control for completed sessions.
 * Explicitly marks all data as HISTORICAL ($0 cost - no paid subscription required).
 */

import { openf1Client } from '../openf1Client';
import { formatOpenF1Interval } from '../formatOpenF1Interval';
import { NormalizedLiveSessionState } from './types';
import { normalizeTyreCompound, TyreCompound } from '../../src/utils/f1State';

const historicalSessionCache = new Map<number, { data: NormalizedLiveSessionState; timestamp: number }>();
const inFlightRequests = new Map<number, Promise<NormalizedLiveSessionState | null>>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for completed sessions

export const openf1HistoricalProvider = {
  /**
   * Retrieves recorded session telemetry for a specific or latest completed session
   */
  async getSessionData(sessionKey?: number | string): Promise<NormalizedLiveSessionState | null> {
    try {
      const session = sessionKey
        ? await openf1Client.getSession(sessionKey)
        : await openf1Client.getLatestSession();

      if (!session) return null;

      const key = session.session_key;

      // 1. Check in-memory cache
      const cached = historicalSessionCache.get(key);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
      }

      // 2. Check if a request for this session is already in-flight
      const existingPromise = inFlightRequests.get(key);
      if (existingPromise) {
        return await existingPromise;
      }

      // 3. Initiate fetch and share promise
      const fetchPromise = (async () => {
        try {
      const delay = <T,>(ms: number, request: () => Promise<T>) =>
        new Promise<void>((resolve) => setTimeout(resolve, ms)).then(request);

      const [meeting, driversRaw] = await Promise.all([
        openf1Client.getMeeting(session.meeting_key),
        openf1Client.getDrivers(key),
      ]);

      const [
        positionsRaw,
        intervalsRaw,
        lapsRaw,
        stintsRaw,
        raceControlRaw,
        weatherRaw,
        pitsRaw,
      ] = await Promise.all([
        openf1Client.getPositions(key),
        delay(350, () => openf1Client.getIntervals(key)),
        delay(700, () => openf1Client.getLaps(key)),
        delay(1050, () => openf1Client.getStints(key)),
        delay(1400, () => openf1Client.getRaceControl(key)),
        delay(1750, () => openf1Client.getWeather(key)),
        delay(2100, () => openf1Client.getPits(key)),
      ]);

      // Map positions
      const latestPosMap = new Map<number, { position: number; date: string }>();
      for (const p of positionsRaw) {
        const existing = latestPosMap.get(p.driver_number);
        if (!existing || p.date > existing.date) {
          latestPosMap.set(p.driver_number, { position: p.position, date: p.date });
        }
      }

      // Map intervals
      const latestIntervalMap = new Map<number, { gap: number | string | null; interval: number | string | null; date: string }>();
      for (const i of intervalsRaw) {
        const existing = latestIntervalMap.get(i.driver_number);
        if (!existing || i.date > existing.date) {
          latestIntervalMap.set(i.driver_number, {
            gap: i.gap_to_leader,
            interval: i.interval,
            date: i.date,
          });
        }
      }

      // Map laps
      let maxLap = 0;
      const driverLapsMap = new Map<number, {
        last: number | null;
        best: number | null;
        count: number;
        sector1: number | null;
        sector2: number | null;
        sector3: number | null;
      }>();
      for (const l of lapsRaw) {
        if (l.lap_number > maxLap) maxLap = l.lap_number;
        const existing = driverLapsMap.get(l.driver_number);
        const dur = l.lap_duration && l.lap_duration > 0 ? l.lap_duration : null;

        if (!existing) {
          driverLapsMap.set(l.driver_number, {
            last: dur,
            best: dur,
            count: l.lap_number,
            sector1: l.duration_sector_1,
            sector2: l.duration_sector_2,
            sector3: l.duration_sector_3,
          });
        } else {
          if (l.lap_number >= existing.count) {
            existing.count = l.lap_number;
            existing.last = dur;
            existing.sector1 = l.duration_sector_1;
            existing.sector2 = l.duration_sector_2;
            existing.sector3 = l.duration_sector_3;
          }
          if (dur && (existing.best === null || dur < existing.best)) {
            existing.best = dur;
          }
        }
      }

      // Map tyre stints
      const stintMap = new Map<number, { compound: TyreCompound; age: number | null; stintNum: number | null }>();
      for (const s of stintsRaw) {
        const laps = driverLapsMap.get(s.driver_number);
        const cur = laps?.count ?? s.lap_start;
        const age = (s.tyre_age_at_start || 0) + Math.max(0, cur - s.lap_start);
        const existing = stintMap.get(s.driver_number);
        if (!existing || s.stint_number >= (existing.stintNum ?? 0)) {
          stintMap.set(s.driver_number, {
            compound: normalizeTyreCompound(s.compound),
            age: age > 0 ? age : null,
            stintNum: s.stint_number,
          });
        }
      }

      // Map pit count
      const pitCountMap = new Map<number, number>();
      for (const pit of pitsRaw) {
        pitCountMap.set(pit.driver_number, (pitCountMap.get(pit.driver_number) || 0) + 1);
      }

      const distinctDrivers = driversRaw.filter((d, idx, arr) => arr.findIndex(item => item.driver_number === d.driver_number) === idx);

      const drivers = distinctDrivers.map((d) => {
        const pos = latestPosMap.get(d.driver_number)?.position ?? null;
        const interval = latestIntervalMap.get(d.driver_number);
        const lap = driverLapsMap.get(d.driver_number);
        const stint = stintMap.get(d.driver_number);
        const pits = pitCountMap.get(d.driver_number) || 0;

        return {
          position: pos,
          driver_number: d.driver_number,
          broadcast_name: d.broadcast_name || d.full_name,
          name_acronym: d.name_acronym || '—',
          full_name: d.full_name || d.broadcast_name,
          team_name: d.team_name || '—',
          team_colour: d.team_colour,
          gap: formatOpenF1Interval(interval?.gap ?? null, true) ?? (pos === 1 ? 'LEADER' : null),
          interval: formatOpenF1Interval(interval?.interval ?? null),
          last_lap_time: lap?.last ?? null,
          best_lap_time: lap?.best ?? null,
          sector_1_time: lap?.sector1 ?? null,
          sector_2_time: lap?.sector2 ?? null,
          sector_3_time: lap?.sector3 ?? null,
          tyre_compound: stint?.compound ?? 'UNKNOWN',
          tyre_age: stint?.age ?? null,
          stint: stint?.stintNum ?? null,
          pit_status: null,
          pit_count: pits,
          position_change: 0,
        };
      });

      drivers.sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));

      // Latest weather
      const latestWeather = weatherRaw.reduce<typeof weatherRaw[number] | null>(
        (latest, weather) => !latest || weather.date > latest.date ? weather : latest,
        null,
      );

      // Find the last recorded timestamp from the session
      const timestamps = [
        ...positionsRaw.map((position) => position.date),
        ...intervalsRaw.map((interval) => interval.date),
        ...lapsRaw.map((lap) => lap.date_start),
        ...raceControlRaw.map((event) => event.date),
        ...weatherRaw.map((weather) => weather.date),
        ...pitsRaw.map((pit) => pit.date),
      ];
      const lastTimestamp = timestamps.reduce<string | null>(
        (latest, timestamp) => !latest || timestamp > latest ? timestamp : latest,
        null,
      ) ?? session.date_end;

      const result = {
        policy: 'HISTORICAL' as const,
        is_authorized_live_feed: false,
        status_banner: 'HISTORICAL DATA • SESSION COMPLETED',
        status_message: 'Recorded session telemetry. Live timing is not active.',
        last_verified_timestamp: lastTimestamp,
        latency_seconds: null,
        session: {
          session_key: session.session_key,
          session_name: session.session_name,
          meeting_name: meeting?.meeting_name || session.circuit_short_name || 'Grand Prix',
          circuit_name: session.circuit_short_name,
          country_name: session.country_name,
          date_start: session.date_start,
          date_end: session.date_end,
          current_lap: maxLap > 0 ? maxLap : null,
          total_laps: session.session_type === 'Race' && maxLap > 0 ? maxLap : null,
          is_live_schedule: false,
        },
        track_status: {
          flag: 'CHEQUERED' as const,
          status_message: 'Session Completed',
        },
        drivers,
        race_control: raceControlRaw.slice(-15).reverse().map(rc => ({
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
              wind_direction: latestWeather.wind_direction ?? null,
              rainfall: latestWeather.rainfall,
            }
          : null,
        provider: {
          primary: 'OpenF1 Official Archive',
          mode: 'Historical Telemetry',
          cost: '$0 Free Tier' as const,
        },
      };

      historicalSessionCache.set(key, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.error('Historical Provider Error:', err);
      return null;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return await fetchPromise;
} catch (err) {
  console.error('Historical Provider Error:', err);
  return null;
}
},

  preloadRecentSessions() {
    setTimeout(async () => {
      try {
        const latestMeeting = await openf1Client.getLatestMeeting();
        if (latestMeeting) {
          const sessions = await openf1Client.getMeetingSessions(latestMeeting.meeting_key);
          for (const s of sessions) {
            if (s.session_key && !historicalSessionCache.has(s.session_key)) {
              await openf1HistoricalProvider.getSessionData(s.session_key);
              await new Promise(r => setTimeout(r, 600));
            }
          }
        }
      } catch {
        // Preload fails silently without blocking user
      }
    }, 1500);
  },
};
