import { TyreCompound, FreshnessResult } from './utils/f1State';

export type DataFreshnessPolicy = 'LIVE' | 'STALE' | 'HISTORICAL' | 'UNAVAILABLE';

export interface DriverRow {
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
  tyre_compound: TyreCompound;
  tyre_age: number | null;
  stint: number | null;
  pit_status: 'ON_TRACK' | 'IN_PIT' | 'PIT_STOP' | 'OUT' | null;
  pit_count: number;
  position_change: number;
}

export type DriverLiveTiming = DriverRow;


export interface LiveState {
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
  freshness?: FreshnessResult;
  drivers: DriverRow[];
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
    primary: string;
    mode: string;
    cost: string;
  };
}

export interface CalendarMeeting {
  round: number;
  season: string;
  race_name: string;
  circuit_name: string;
  circuit_id: string;
  locality: string;
  country: string;
  lat: number | null;
  long: number | null;
  race_timestamp: string;
  fp1_timestamp: string | null;
  fp2_timestamp: string | null;
  fp3_timestamp: string | null;
  qualifying_timestamp: string | null;
  sprint_timestamp: string | null;
  sprint_qualifying_timestamp: string | null;
}

export interface DriverStanding {
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

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructor_id: string;
  team_name: string;
  nationality: string;
}

export interface RaceResultItem {
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

export interface DriverProfileRace {
  round: number;
  race_name: string;
  date: string;
  circuit_name: string;
  position: string | null;
  status: string;
  grid: number | null;
  points: number;
  race_time: string | null;
  fastest_lap: string | null;
  qualifying: {
    position: number | null;
    q1: string | null;
    q2: string | null;
    q3: string | null;
  } | null;
  sprint: {
    position: string | null;
    points: number;
    status: string;
  } | null;
}

export interface DriverProfileSections {
  race_results: boolean;
  qualifying: boolean;
  sprint_results: boolean;
}

export interface DriverProfile {
  season: string;
  round: string;
  source: string;
  driver: {
    driver_id: string;
    constructor_id: string;
    driver_number: number;
    driver_code: string;
    full_name: string;
    nationality: string;
    team_name: string;
  };
  headshot_url: string | null;
  stats: {
    championship_position: number;
    points: number;
    wins: number;
    podiums: number | null;
    poles: number | null;
    fastest_laps: number | null;
    race_starts: number | null;
    sprint_wins: number | null;
    sprint_points: number | null;
  };
  data_sections: DriverProfileSections;
  races: DriverProfileRace[];
}

export interface ConstructorProfileRaceDriver {
  driver_id: string;
  driver_number: number | null;
  driver_code: string;
  full_name: string;
  position: string | null;
  status: string;
  grid: number | null;
  points: number;
  fastest_lap: string | null;
  qualifying: {
    position: number | null;
    q1: string | null;
    q2: string | null;
    q3: string | null;
  } | null;
  sprint: {
    position: string | null;
    points: number;
  } | null;
}

export interface ConstructorProfileRace {
  round: number;
  race_name: string;
  date: string;
  circuit_name: string;
  points: number;
  wins: number;
  podiums: number;
  sprint_points: number;
  drivers: ConstructorProfileRaceDriver[];
}

export interface ConstructorPowerUnit {
  season: string;
  supplier: string;
  architecture: string;
  combustion_engine: string;
  energy_recovery: string;
  electric_power_kw: number;
  electric_power_hp: number;
  power_split: string;
  fuel: string;
  total_power: string;
  sources: Array<{
    label: string;
    url: string;
  }>;
}

export interface ConstructorProfile {
  season: string;
  round: string;
  source: string;
  constructor: {
    constructor_id: string;
    team_name: string;
    nationality: string;
  };
  engine_supplier: string | null;
  engine_data_note: string;
  power_unit: ConstructorPowerUnit | null;
  stats: {
    championship_position: number;
    points: number;
    wins: number;
    podiums: number | null;
    poles: number | null;
    fastest_laps: number | null;
    race_wins: number | null;
    sprint_wins: number | null;
    sprint_points: number | null;
    drivers: number;
  };
  data_sections: {
    race_results: boolean;
    qualifying: boolean;
    sprint_results: boolean;
  };
  drivers: Array<{
    driver_id: string;
    driver_number: number;
    driver_code: string;
    full_name: string;
    position: number;
    points: number;
    wins: number;
  }>;
  races: ConstructorProfileRace[];
}

export interface LastRaceData {
  season: string;
  round: string;
  raceName: string;
  circuitName: string;
  location: string;
  country: string;
  date: string;
  results: RaceResultItem[];
}

export interface F1Circuit {
  id: string;
  name: string;
  officialName: string;
  grandPrixName: string;
  round: number;
  country: string;
  countryCode: string;
  locality: string;
  flagUrl: string;
  imageUrl: string;
  trackLengthKm: number;
  corners: number;
  drsZones: number;
  raceDistanceKm: number;
  laps: number;
  lapRecord: {
    time: string;
    driver: string;
    year: number;
  };
  firstGrandPrixYear: number;
  circuitType: 'Street' | 'Permanent' | 'Hybrid';
  description: string;
  keyFeatures: string[];
}

