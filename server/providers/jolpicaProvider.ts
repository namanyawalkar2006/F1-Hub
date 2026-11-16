/**
 * Jolpica F1 Provider (Primary Free Data Source)
 * Free, non-commercial community-supported F1 data endpoint ($0 cost).
 * Provides schedules, standings, race and qualifying results.
 */

import {
  NormalizedSessionSchedule,
  NormalizedDriverStanding,
  NormalizedConstructorStanding,
  NormalizedRaceResult,
  NormalizedQualifyingResult,
} from './types';
import { getConstructorPowerUnit } from './constructorPowerUnits';

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

async function fetchJolpica<T>(endpoint: string, ttlMs = 60000): Promise<T | null> {
  const url = `${JOLPICA_BASE}${endpoint}`;
  const now = Date.now();
  const cached = cache.get(url);

  if (cached && (now - cached.timestamp < cached.ttlMs)) {
    return cached.data as T;
  }

  const existingRequest = inFlightRequests.get(url);
  if (existingRequest) {
    return existingRequest as Promise<T | null>;
  }

  const request = (async (): Promise<T | null> => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (process.env.JOLPICA_API_KEY?.trim()) {
      headers['X-API-Key'] = process.env.JOLPICA_API_KEY.trim();
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });

      if (!res.ok) {
        console.warn(`[Jolpica] ${endpoint} returned HTTP ${res.status}`);
        return cached ? cached.data as T : null;
      }

      const json = await res.json() as T;
      cache.set(url, { data: json, timestamp: Date.now(), ttlMs });
      return json;
    } catch (error) {
      console.warn(`[Jolpica] ${endpoint} request failed; ${cached ? 'serving stale cache' : 'no cache is available'}.`, error);
      return cached ? cached.data as T : null;
    } finally {
      clearTimeout(timer);
    }
  })();

  inFlightRequests.set(url, request);
  try {
    return await request;
  } finally {
    inFlightRequests.delete(url);
  }
}

export const jolpicaProvider = {
  /**
   * Retrieves full season schedule with individual session timestamps (FP1, FP2, FP3, Quali, Race)
   */
  async getSchedule(season: string = 'current'): Promise<NormalizedSessionSchedule[]> {
    const data = await fetchJolpica<any>(`/${season}.json`, 120000);
    const races = data?.MRData?.RaceTable?.Races;
    if (!Array.isArray(races)) return [];

    return races.map((r: any) => {
      // Build ISO UTC timestamp for race start
      const raceTimestamp = r.time ? `${r.date}T${r.time}` : `${r.date}T00:00:00Z`;

      const buildIso = (sessionObj?: { date: string; time?: string }) => {
        if (!sessionObj?.date) return null;
        return sessionObj.time ? `${sessionObj.date}T${sessionObj.time}` : `${sessionObj.date}T00:00:00Z`;
      };

      return {
        round: Number(r.round),
        season: r.season,
        race_name: r.raceName,
        circuit_name: r.Circuit?.circuitName || '—',
        circuit_id: r.Circuit?.circuitId || '',
        locality: r.Circuit?.Location?.locality || '',
        country: r.Circuit?.Location?.country || '',
        lat: r.Circuit?.Location?.lat ? Number(r.Circuit.Location.lat) : null,
        long: r.Circuit?.Location?.long ? Number(r.Circuit.Location.long) : null,
        race_timestamp: raceTimestamp,
        fp1_timestamp: buildIso(r.FirstPractice),
        fp2_timestamp: buildIso(r.SecondPractice),
        fp3_timestamp: buildIso(r.ThirdPractice),
        qualifying_timestamp: buildIso(r.Qualifying),
        sprint_timestamp: buildIso(r.Sprint),
        sprint_qualifying_timestamp: buildIso(r.SprintQualifying),
      };
    });
  },

  /**
   * Driver World Championship Standings
   */
  async getDriverStandings(season: string = 'current'): Promise<{ season: string; round: string; standings: NormalizedDriverStanding[] }> {
    const data = await fetchJolpica<any>(`/${season}/driverStandings.json`, 60000);
    const table = data?.MRData?.StandingsTable;
    const list = table?.StandingsLists?.[0];

    const standings: NormalizedDriverStanding[] = (list?.DriverStandings || []).map((d: any) => ({
      driver_id: d.Driver?.driverId || '',
      position: Number(d.position),
      points: Number(d.points),
      wins: Number(d.wins),
      driver_number: Number(d.Driver?.permanentNumber || d.Driver?.code || 0),
      driver_code: d.Driver?.code || d.Driver?.familyName?.slice(0, 3).toUpperCase() || '—',
      given_name: d.Driver?.givenName || '',
      family_name: d.Driver?.familyName || '',
      full_name: `${d.Driver?.givenName || ''} ${d.Driver?.familyName || ''}`.trim(),
      nationality: d.Driver?.nationality || '',
      team_name: d.Constructors?.[0]?.name || '—',
      constructor_id: d.Constructors?.[0]?.constructorId || '',
    }));

    return {
      season: table?.season || '2026',
      round: list?.round || '18',
      standings,
    };
  },

  /**
   * Constructors Championship Standings
   */
  async getConstructorStandings(season: string = 'current'): Promise<{ season: string; round: string; standings: NormalizedConstructorStanding[] }> {
    const data = await fetchJolpica<any>(`/${season}/constructorStandings.json`, 60000);
    const table = data?.MRData?.StandingsTable;
    const list = table?.StandingsLists?.[0];

    const standings: NormalizedConstructorStanding[] = (list?.ConstructorStandings || []).map((c: any) => ({
      position: Number(c.position),
      points: Number(c.points),
      wins: Number(c.wins),
      constructor_id: c.Constructor?.constructorId || '',
      team_name: c.Constructor?.name || '—',
      nationality: c.Constructor?.nationality || '',
    }));

    return {
      season: table?.season || '2026',
      round: list?.round || '18',
      standings,
    };
  },

  /**
   * Last Race Results
   */
  async getLastRaceResults(): Promise<{
    season: string;
    round: string;
    raceName: string;
    circuitName: string;
    location: string;
    country: string;
    date: string;
    results: NormalizedRaceResult[];
  } | null> {
    const data = await fetchJolpica<any>('/current/last/results.json', 60000);
    const race = data?.MRData?.RaceTable?.Races?.[0];
    if (!race) return null;

    const results: NormalizedRaceResult[] = (race.Results || []).map((r: any) => ({
      driver_id: r.Driver?.driverId || '',
      constructor_id: r.Constructor?.constructorId || '',
      position: Number(r.position),
      driver_number: Number(r.number),
      driver_code: r.Driver?.code || '—',
      full_name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim(),
      team_name: r.Constructor?.name || '—',
      grid: Number(r.grid),
      laps: Number(r.laps),
      status: r.status,
      time: r.Time?.time || r.status,
      points: Number(r.points),
      fastest_lap: r.FastestLap
        ? {
            rank: Number(r.FastestLap.rank),
            lap: Number(r.FastestLap.lap),
            time: r.FastestLap.Time?.time,
            avg_speed: r.FastestLap.AverageSpeed?.speed,
          }
        : null,
    }));

    return {
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      circuitName: race.Circuit?.circuitName,
      location: race.Circuit?.Location?.locality,
      country: race.Circuit?.Location?.country,
      date: race.date,
      results,
    };
  },

  /**
   * Last Qualifying Results
   */
  async getLastQualifyingResults(): Promise<{
    season: string;
    round: string;
    raceName: string;
    circuitName: string;
    location: string;
    country: string;
    date: string;
    results: NormalizedQualifyingResult[];
  } | null> {
    const data = await fetchJolpica<any>('/current/last/qualifying.json', 60000);
    const race = data?.MRData?.RaceTable?.Races?.[0];
    if (!race) return null;

    const results: NormalizedQualifyingResult[] = (race.QualifyingResults || []).map((q: any) => ({
      driver_id: q.Driver?.driverId || '',
      constructor_id: q.Constructor?.constructorId || '',
      position: Number(q.position),
      driver_number: Number(q.number),
      driver_code: q.Driver?.code || '—',
      full_name: `${q.Driver?.givenName || ''} ${q.Driver?.familyName || ''}`.trim(),
      team_name: q.Constructor?.name || '—',
      q1: q.Q1 || null,
      q2: q.Q2 || null,
      q3: q.Q3 || null,
    }));

    return {
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      circuitName: race.Circuit?.circuitName,
      location: race.Circuit?.Location?.locality,
      country: race.Circuit?.Location?.country,
      date: race.date,
      results,
    };
  },

  async getDriverProfile(driverRef: string, season: string = 'current') {
    const standingsData = await this.getDriverStandings(season);
    const normalizedRef = driverRef.trim().toLowerCase();
    const driver = standingsData.standings.find((item) =>
      item.driver_id.toLowerCase() === normalizedRef ||
      item.driver_code.toLowerCase() === normalizedRef ||
      String(item.driver_number) === normalizedRef
    );

    if (!driver?.driver_id) return null;

    const driverPath = encodeURIComponent(driver.driver_id);
    const [raceData, qualifyingData, sprintData] = await Promise.all([
      fetchJolpica<any>(`/${season}/drivers/${driverPath}/results.json?limit=1000`, 120000),
      fetchJolpica<any>(`/${season}/drivers/${driverPath}/qualifying.json?limit=1000`, 120000),
      fetchJolpica<any>(`/${season}/drivers/${driverPath}/sprint.json?limit=1000`, 120000),
    ]);

    const races: any[] = raceData?.MRData?.RaceTable?.Races || [];
    const qualifying: any[] = qualifyingData?.MRData?.RaceTable?.Races || [];
    const sprints: any[] = sprintData?.MRData?.RaceTable?.Races || [];
    const qualifyingByRound = new Map<number, any>(
      qualifying.map((race: any) => [Number(race.round), race.QualifyingResults?.[0]])
    );
    const sprintByRound = new Map<number, any>(
      sprints.map((race: any) => [Number(race.round), race.SprintResults?.[0]])
    );
    const profileRaces = races.flatMap((race: any) => {
      const result = race.Results?.[0];
      if (!result) return [];

      const qualifyingResult = qualifyingByRound.get(Number(race.round));
      const sprintResult = sprintByRound.get(Number(race.round));
      return [{
        round: Number(race.round),
        race_name: race.raceName || '',
        date: race.date || '',
        circuit_name: race.Circuit?.circuitName || '',
        position: result.positionText || result.position || null,
        status: result.status || '',
        grid: Number.isFinite(Number(result.grid)) ? Number(result.grid) : null,
        points: Number(result.points) || 0,
        race_time: result.Time?.time || null,
        fastest_lap: String(result.FastestLap?.rank) === '1' ? result.FastestLap?.Time?.time || null : null,
        qualifying: qualifyingResult ? {
          position: Number(qualifyingResult.position) || null,
          q1: qualifyingResult.Q1 || null,
          q2: qualifyingResult.Q2 || null,
          q3: qualifyingResult.Q3 || null,
        } : null,
        sprint: sprintResult ? {
          position: sprintResult.positionText || sprintResult.position || null,
          points: Number(sprintResult.points) || 0,
          status: sprintResult.status || '',
        } : null,
      }];
    });

    const positionNumber = (position: string | null | undefined) => {
      const parsed = Number(position);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    };

    return {
      season: standingsData.season,
      round: standingsData.round,
      source: 'Jolpica F1',
      driver: {
        driver_id: driver.driver_id,
        constructor_id: driver.constructor_id,
        driver_number: driver.driver_number,
        driver_code: driver.driver_code,
        full_name: driver.full_name,
        nationality: driver.nationality,
        team_name: driver.team_name,
      },
      stats: {
        championship_position: driver.position,
        points: driver.points,
        wins: driver.wins,
        podiums: raceData ? profileRaces.filter((race: any) => {
          const position = positionNumber(race.position);
          return position !== null && position <= 3;
        }).length : null,
        poles: qualifyingData ? profileRaces.filter((race: any) => race.qualifying?.position === 1).length : null,
        fastest_laps: raceData ? profileRaces.filter((race: any) => race.fastest_lap !== null).length : null,
        race_starts: raceData ? profileRaces.filter((race: any) =>
          !['did not start', 'did not qualify', 'did not prequalify', 'withdrawn'].includes(String(race.status).toLowerCase())
        ).length : null,
        sprint_wins: sprintData ? profileRaces.filter((race: any) => positionNumber(race.sprint?.position) === 1).length : null,
        sprint_points: sprintData ? profileRaces.reduce((total: number, race: any) => total + (race.sprint?.points || 0), 0) : null,
      },
      data_sections: {
        race_results: raceData !== null,
        qualifying: qualifyingData !== null,
        sprint_results: sprintData !== null,
      },
      races: profileRaces,
    };
  },

  async getConstructorProfile(constructorRef: string, season: string = 'current') {
    const standingsData = await this.getConstructorStandings(season);
    const normalizedRef = constructorRef.trim().toLowerCase().replace(/\s+/g, ' ');
    const constructor = standingsData.standings.find((item) =>
      item.constructor_id.toLowerCase() === normalizedRef ||
      item.team_name.toLowerCase().replace(/\s+/g, ' ') === normalizedRef
    );

    if (!constructor?.constructor_id) return null;

    const constructorPath = encodeURIComponent(constructor.constructor_id);
    const [raceData, qualifyingData, sprintData, driverStandings] = await Promise.all([
      fetchJolpica<any>(`/${season}/constructors/${constructorPath}/results.json?limit=1000`, 120000),
      fetchJolpica<any>(`/${season}/constructors/${constructorPath}/qualifying.json?limit=1000`, 120000),
      fetchJolpica<any>(`/${season}/constructors/${constructorPath}/sprint.json?limit=1000`, 120000),
      this.getDriverStandings(season),
    ]);

    const races: any[] = raceData?.MRData?.RaceTable?.Races || [];
    const qualifying: any[] = qualifyingData?.MRData?.RaceTable?.Races || [];
    const sprints: any[] = sprintData?.MRData?.RaceTable?.Races || [];
    const qualifyingByRound = new Map<number, any[]>(
      qualifying.map((race: any) => [Number(race.round), race.QualifyingResults || []])
    );
    const sprintByRound = new Map<number, any[]>(
      sprints.map((race: any) => [Number(race.round), race.SprintResults || []])
    );
    const profileRaces = races.flatMap((race: any) => {
      const results = (race.Results || []).filter((result: any) =>
        !result.Constructor?.constructorId || result.Constructor.constructorId === constructor.constructor_id
      );
      if (results.length === 0) return [];

      const qualifyingByNumber = new Map<number, any>(
        (qualifyingByRound.get(Number(race.round)) || []).map((result: any) => [Number(result.number), result])
      );
      const sprintByNumber = new Map<number, any>(
        (sprintByRound.get(Number(race.round)) || []).map((result: any) => [Number(result.number), result])
      );
      const driverResults = results.map((result: any) => {
        const driverNumber = Number(result.number);
        const qualifyingResult = qualifyingByNumber.get(driverNumber);
        const sprintResult = sprintByNumber.get(driverNumber);
        return {
          driver_id: result.Driver?.driverId || '',
          driver_number: Number.isFinite(driverNumber) ? driverNumber : null,
          driver_code: result.Driver?.code || '—',
          full_name: `${result.Driver?.givenName || ''} ${result.Driver?.familyName || ''}`.trim(),
          position: result.positionText || result.position || null,
          status: result.status || '',
          grid: Number.isFinite(Number(result.grid)) ? Number(result.grid) : null,
          points: Number(result.points) || 0,
          fastest_lap: String(result.FastestLap?.rank) === '1' ? result.FastestLap?.Time?.time || null : null,
          qualifying: qualifyingResult ? {
            position: Number(qualifyingResult.position) || null,
            q1: qualifyingResult.Q1 || null,
            q2: qualifyingResult.Q2 || null,
            q3: qualifyingResult.Q3 || null,
          } : null,
          sprint: sprintResult ? {
            position: sprintResult.positionText || sprintResult.position || null,
            points: Number(sprintResult.points) || 0,
          } : null,
        };
      });

      return [{
        round: Number(race.round),
        race_name: race.raceName || '',
        date: race.date || '',
        circuit_name: race.Circuit?.circuitName || '',
        points: driverResults.reduce((total: number, result: any) => total + result.points, 0),
        wins: driverResults.filter((result: any) => String(result.position) === '1').length,
        podiums: driverResults.filter((result: any) => {
          const position = Number(result.position);
          return Number.isInteger(position) && position >= 1 && position <= 3;
        }).length,
        sprint_points: driverResults.reduce((total: number, result: any) => total + (result.sprint?.points || 0), 0),
        drivers: driverResults,
      }];
    });

    const raceResultsAvailable = raceData !== null;
    const qualifyingAvailable = qualifyingData !== null;
    const sprintResultsAvailable = sprintData !== null;
    const sprintWins = profileRaces.reduce((total: number, race: any) =>
      total + race.drivers.filter((driver: any) => String(driver.sprint?.position) === '1').length, 0);
    const sprintPoints = profileRaces.reduce((total: number, race: any) => total + race.sprint_points, 0);
    const drivers = driverStandings.standings
      .filter((driver) => driver.constructor_id === constructor.constructor_id)
      .map((driver) => ({
        driver_id: driver.driver_id,
        driver_number: driver.driver_number,
        driver_code: driver.driver_code,
        full_name: driver.full_name,
        position: driver.position,
        points: driver.points,
        wins: driver.wins,
      }));

    const powerUnit = getConstructorPowerUnit(standingsData.season, constructor.constructor_id);

    return {
      season: standingsData.season,
      round: standingsData.round,
      source: 'Jolpica F1',
      constructor: {
        constructor_id: constructor.constructor_id,
        team_name: constructor.team_name,
        nationality: constructor.nationality,
      },
      engine_supplier: powerUnit?.supplier || null,
      engine_data_note: powerUnit
        ? 'Supplier assignments use publicly available 2026 announcements. Electric horsepower is converted from the FIA 350 kW MGU-K limit; actual deployment varies, and exact combined output is not published.'
        : 'Verified engine-supplier information is unavailable for this season.',
      power_unit: powerUnit,
      stats: {
        championship_position: constructor.position,
        points: constructor.points,
        wins: constructor.wins,
        podiums: raceResultsAvailable
          ? profileRaces.reduce((total: number, race: any) => total + race.podiums, 0)
          : null,
        poles: qualifyingAvailable
          ? profileRaces.reduce((total: number, race: any) =>
              total + race.drivers.filter((driver: any) => driver.qualifying?.position === 1).length, 0)
          : null,
        fastest_laps: raceResultsAvailable
          ? profileRaces.reduce((total: number, race: any) =>
              total + race.drivers.filter((driver: any) => driver.fastest_lap !== null).length, 0)
          : null,
        race_wins: raceResultsAvailable
          ? profileRaces.reduce((total: number, race: any) => total + race.wins, 0)
          : null,
        sprint_wins: sprintResultsAvailable ? sprintWins : null,
        sprint_points: sprintResultsAvailable ? sprintPoints : null,
        drivers: drivers.length,
      },
      data_sections: {
        race_results: raceResultsAvailable,
        qualifying: qualifyingAvailable,
        sprint_results: sprintResultsAvailable,
      },
      drivers,
      races: profileRaces,
    };
  },
};
