/**
 * OpenF1 API Client
 * Interacts with OpenF1 REST API with authentication and caching.
 * NEVER fabricates data.
 */

import { tokenManager } from './tokenManager';

const BASE_URL = 'https://api.openf1.org/v1';

// Simple in-memory cache to prevent hitting rate limits
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

async function fetchFromOpenF1<T>(endpoint: string, params: Record<string, string | number> = {}, ttlMs = 2500): Promise<T | null> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, String(val));
    }
  }

  const cacheKey = url.toString();
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();
  if (cached && (now - cached.timestamp < cached.ttlMs)) {
    return cached.data as T;
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    const authHeader = await tokenManager.getAuthorizationHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401 && authHeader) {
        // Stale or invalid token provided; retry once unauthenticated (public free tier)
        const unauthRes = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' },
        });
        if (unauthRes.ok) {
          const json = await unauthRes.json();
          memoryCache.set(cacheKey, { data: json, timestamp: Date.now(), ttlMs });
          return json as T;
        }
      }
      if (response.status === 429) {
        // Rate limit hit on free community tier; retry up to 2 times with backoff
        for (const delay of [750, 1200]) {
          await new Promise(r => setTimeout(r, delay));
          const retryRes = await fetch(url.toString(), { headers });
          if (retryRes.ok) {
            const json = await retryRes.json();
            memoryCache.set(cacheKey, { data: json, timestamp: Date.now(), ttlMs });
            return json as T;
          }
        }
      }
      if (response.status === 404) {
        return null;
      }
      return cached ? (cached.data as T) : null;
    }

    const json = await response.json();
    memoryCache.set(cacheKey, { data: json, timestamp: now, ttlMs });
    return json as T;
  } catch (err) {
    console.error('fetchFromOpenF1 error on', url.toString(), err);
    // Return stale cache if available upon network failure
    if (cached) {
      return cached.data as T;
    }
    return null;
  }
}

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  country_code: string;
  country_flag: string;
  circuit_key: number;
  circuit_short_name: string;
  circuit_image: string;
  circuit_info_url: string;
  gmt_offset: string;
  date_start: string;
  date_end: string;
  year: number;
  is_cancelled: boolean;
}

export interface OpenF1Session {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  country_code: string;
  location: string;
  gmt_offset: string;
  year: number;
  is_cancelled: boolean;
}

export interface OpenF1Driver {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string | null;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  country_code: string | null;
}

export interface OpenF1Position {
  date: string;
  session_key: number;
  meeting_key: number;
  position: number;
  driver_number: number;
}

export interface OpenF1Interval {
  date: string;
  session_key: number;
  meeting_key: number;
  driver_number: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
}

export interface OpenF1Lap {
  date_start: string;
  session_key: number;
  meeting_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
}

export interface OpenF1Stint {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  stint_number: number;
  compound: string;
  tyre_age_at_start: number;
  lap_start: number;
  lap_end: number | null;
}

export interface OpenF1RaceControl {
  date: string;
  session_key: number;
  meeting_key: number;
  category: string;
  flag: string | null;
  scope: string | null;
  sector: number | null;
  qualifying_phase: string | null;
  message: string;
  lap_number: number | null;
}

export interface OpenF1Weather {
  date: string;
  session_key: number;
  meeting_key: number;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: number;
}

export interface OpenF1Pit {
  date: string;
  session_key: number;
  meeting_key: number;
  driver_number: number;
  lap_number: number;
  pit_duration: number | null;
  stop_duration: number | null;
}

export const openf1Client = {
  async getLatestSession(): Promise<OpenF1Session | null> {
    const list = await fetchFromOpenF1<OpenF1Session[]>('/sessions', { session_key: 'latest' }, 10000);
    return list && list.length > 0 ? list[0] : null;
  },

  async getSession(sessionKey: number | string): Promise<OpenF1Session | null> {
    const list = await fetchFromOpenF1<OpenF1Session[]>('/sessions', { session_key: sessionKey }, 30000);
    return list && list.length > 0 ? list[0] : null;
  },

  async getLatestMeeting(): Promise<OpenF1Meeting | null> {
    const list = await fetchFromOpenF1<OpenF1Meeting[]>('/meetings', { meeting_key: 'latest' }, 30000);
    return list && list.length > 0 ? list[0] : null;
  },

  async getMeeting(meetingKey: number | string): Promise<OpenF1Meeting | null> {
    const list = await fetchFromOpenF1<OpenF1Meeting[]>('/meetings', { meeting_key: meetingKey }, 30000);
    return list && list.length > 0 ? list[0] : null;
  },

  async getMeetingSessions(meetingKey: number | string): Promise<OpenF1Session[]> {
    const list = await fetchFromOpenF1<OpenF1Session[]>('/sessions', { meeting_key: meetingKey }, 15000);
    return list || [];
  },

  async getMeetings(year: number = new Date().getFullYear()): Promise<OpenF1Meeting[]> {
    const list = await fetchFromOpenF1<OpenF1Meeting[]>('/meetings', { year }, 60000);
    if (!list || list.length === 0) {
      // Fallback to 2026 or 2024
      const fallback = await fetchFromOpenF1<OpenF1Meeting[]>('/meetings', { year: 2026 }, 60000);
      return fallback || [];
    }
    return list;
  },

  async getDrivers(sessionKey: number | string): Promise<OpenF1Driver[]> {
    const list = await fetchFromOpenF1<OpenF1Driver[]>('/drivers', { session_key: sessionKey }, 60000);
    return list || [];
  },

  async getLatestDriverHeadshot(driverNumber: number): Promise<string | null> {
    const list = await fetchFromOpenF1<OpenF1Driver[]>(
      '/drivers',
      { session_key: 'latest', driver_number: driverNumber },
      60 * 60 * 1000
    );
    const headshot = list?.find((driver) => driver.driver_number === driverNumber)?.headshot_url;
    if (!headshot) return null;

    try {
      const url = new URL(headshot);
      if (url.protocol !== 'https:') return null;
      if (url.hostname === 'media.formula1.com') {
        url.pathname = url.pathname.replace(/\.transform\/1col\/image\.png$/, '.transform/4col/image.png');
      }
      return url.toString();
    } catch {
      return null;
    }
  },

  async getPositions(sessionKey: number | string): Promise<OpenF1Position[]> {
    const list = await fetchFromOpenF1<OpenF1Position[]>('/position', { session_key: sessionKey }, 2000);
    return list || [];
  },

  async getIntervals(sessionKey: number | string): Promise<OpenF1Interval[]> {
    const list = await fetchFromOpenF1<OpenF1Interval[]>('/intervals', { session_key: sessionKey }, 2000);
    return list || [];
  },

  async getLaps(sessionKey: number | string): Promise<OpenF1Lap[]> {
    const list = await fetchFromOpenF1<OpenF1Lap[]>('/laps', { session_key: sessionKey }, 5000);
    return list || [];
  },

  async getStints(sessionKey: number | string): Promise<OpenF1Stint[]> {
    const list = await fetchFromOpenF1<OpenF1Stint[]>('/stints', { session_key: sessionKey }, 5000);
    return list || [];
  },

  async getRaceControl(sessionKey: number | string): Promise<OpenF1RaceControl[]> {
    const list = await fetchFromOpenF1<OpenF1RaceControl[]>('/race_control', { session_key: sessionKey }, 3000);
    return list || [];
  },

  async getWeather(sessionKey: number | string): Promise<OpenF1Weather[]> {
    const list = await fetchFromOpenF1<OpenF1Weather[]>('/weather', { session_key: sessionKey }, 5000);
    return list || [];
  },

  async getPits(sessionKey: number | string): Promise<OpenF1Pit[]> {
    const list = await fetchFromOpenF1<OpenF1Pit[]>('/pit', { session_key: sessionKey }, 5000);
    return list || [];
  },
};
