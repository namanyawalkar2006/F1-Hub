/**
 * F1 Hub — Normalized Internal Domain Models
 * Decouples F1 Hub from provider-specific schemas (Jolpica, OpenF1, F1API.dev).
 * Strictly guarantees ZERO FAKE DATA.
 */

export type DataFreshnessPolicy = 'LIVE' | 'STALE' | 'HISTORICAL' | 'UNAVAILABLE';

export interface NormalizedSessionSchedule {
  round: number;
  season: string;
  race_name: string;
  circuit_name: string;
  circuit_id: string;
  locality: string;
  country: string;
  lat: number | null;
  long: number | null;
  race_timestamp: string; // ISO UTC
  fp1_timestamp: string | null;
  fp2_timestamp: string | null;
  fp3_timestamp: string | null;
  qualifying_timestamp: string | null;
  sprint_timestamp: string | null;
  sprint_qualifying_timestamp: string | null;
}

export interface NormalizedDriverStanding {
  driver_id: string;
  position: number;
  points: number;
  wins: number;
  driver_number: number;
  driver_code: string;
  given_name: string;
  family_name: string;
  full_name: string;
  nationality: string;
  team_name: string;
  constructor_id: string;
}

export interface NormalizedConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructor_id: string;
  team_name: string;
  nationality: string;
}

export interface NormalizedRaceResult {
  driver_id: string;
  constructor_id: string;
  position: number;
  driver_number: number;
  driver_code: string;
  full_name: string;
  team_name: string;
  grid: number;
  laps: number;
  status: string;
  time: string;
  points: number;
  fastest_lap?: {
    rank: number;
    lap: number;
    time?: string;
    avg_speed?: string;
  } | null;
}

export interface NormalizedQualifyingResult {
  driver_id: string;
  constructor_id: string;
  position: number;
  driver_number: number;
  driver_code: string;
  full_name: string;
  team_name: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
}

export interface NormalizedLiveSessionState {
  policy: DataFreshnessPolicy;
  is_authorized_live_feed: boolean;
  status_banner: string;
  status_message: string;
  last_verified_timestamp: string | null;
  latency_seconds: number | null;
  session: {
    session_key: number | null;
    session_name: string;
    meeting_name: string;
    circuit_name: string;
    country_name: string;
    date_start: string | null;
    date_end: string | null;
    current_lap: number | null;
    total_laps: number | null;
    is_live_schedule: boolean;
  };
  track_status: {
    flag: 'GREEN' | 'YELLOW' | 'RED' | 'VSC' | 'SC' | 'CHEQUERED' | 'CLEAR';
    status_message: string;
  };
  drivers: Array<{
    position: number | null;
    driver_number: number;
    broadcast_name: string;
    name_acronym: string;
    full_name: string;
    team_name: string;
    team_colour: string | null;
    gap: string | null;
    interval: string | null;
    last_lap_time: number | null;
    best_lap_time: number | null;
    sector_1_time: number | null;
    sector_2_time: number | null;
    sector_3_time: number | null;
    tyre_compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
    tyre_age: number | null;
    stint: number | null;
    pit_status: 'ON_TRACK' | 'IN_PIT' | 'PIT_STOP' | 'OUT' | null;
    pit_count: number;
    position_change: number;
  }>;
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
    rainfall: number | null;
  } | null;
  provider: {
    primary: string;
    mode: string;
    cost: '$0 Free Tier';
  };
}
