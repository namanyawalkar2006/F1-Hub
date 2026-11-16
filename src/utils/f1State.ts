/**
 * Pure functions and normalization logic for F1 Hub
 * STRICT NO FAKE DATA: Returns '—' for missing values and calculates true freshness.
 */

export type FreshnessStatus = 'LIVE' | 'DELAYED' | 'DATA UNAVAILABLE';

export interface FreshnessResult {
  status: FreshnessStatus;
  ageSeconds: number | null;
  displayText: string;
}

/**
 * Calculates freshness of data given the source timestamp and current timestamp.
 * thresholdSeconds: typically 15 seconds for live F1 feeds.
 */
export function calculateFreshness(
  sourceTimestampIso: string | null | undefined,
  nowIso: string = new Date().toISOString(),
  thresholdSeconds = 15
): FreshnessResult {
  if (!sourceTimestampIso) {
    return {
      status: 'DATA UNAVAILABLE',
      ageSeconds: null,
      displayText: 'LIVE DATA UNAVAILABLE',
    };
  }

  const sourceTime = new Date(sourceTimestampIso).getTime();
  const nowTime = new Date(nowIso).getTime();

  if (isNaN(sourceTime) || isNaN(nowTime)) {
    return {
      status: 'DATA UNAVAILABLE',
      ageSeconds: null,
      displayText: 'DATA UNAVAILABLE',
    };
  }

  const diffMs = nowTime - sourceTime;
  const ageSeconds = Math.max(0, parseFloat((diffMs / 1000).toFixed(1)));

  if (diffMs < 0 || ageSeconds <= thresholdSeconds) {
    return {
      status: 'LIVE',
      ageSeconds,
      displayText: `LIVE • Updated ${ageSeconds}s ago`,
    };
  }

  const dateObj = new Date(sourceTime);
  const timeUtc = dateObj.toUTCString().slice(17, 25);
  return {
    status: 'DELAYED',
    ageSeconds,
    displayText: `DATA DELAYED • Last update: ${timeUtc} UTC`,
  };
}

/**
 * Formats a lap time from seconds or string into standard F1 notation (e.g. 1:17.382)
 * Returns '—' if empty or invalid.
 */
export function formatLapTime(timeInSeconds: number | string | null | undefined): string {
  if (timeInSeconds === null || timeInSeconds === undefined || timeInSeconds === '') {
    return '—';
  }
  const numericTime = typeof timeInSeconds === 'string' ? parseFloat(timeInSeconds) : timeInSeconds;
  if (isNaN(numericTime) || numericTime <= 0) {
    return '—';
  }

  const minutes = Math.floor(numericTime / 60);
  const seconds = numericTime % 60;
  if (minutes > 0) {
    const formattedSecs = seconds.toFixed(3).padStart(6, '0');
    return `${minutes}:${formattedSecs}`;
  }
  return seconds.toFixed(3);
}

/**
 * Formats a gap or interval string (e.g. +1.842 or 'LEADER' or '—')
 */
export function formatGap(gap: number | string | null | undefined, isLeader = false): string {
  if (isLeader) {
    return 'LEADER';
  }
  if (gap === null || gap === undefined || gap === '') {
    return '—';
  }
  if (typeof gap === 'string') {
    const trimmed = gap.trim();
    if (!trimmed || trimmed === '0' || trimmed === '+0.000') return isLeader ? 'LEADER' : '—';
    if (trimmed.startsWith('+')) return trimmed;
    const num = parseFloat(trimmed);
    if (isNaN(num)) return trimmed;
    return `+${num.toFixed(3)}`;
  }
  if (typeof gap === 'number') {
    if (gap === 0) return isLeader ? 'LEADER' : '—';
    return `+${gap.toFixed(3)}`;
  }
  return '—';
}

/**
 * Normalizes tyre compound strings to standardized F1 names
 */
export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';

export function normalizeTyreCompound(compound: string | null | undefined): TyreCompound {
  if (!compound) return 'UNKNOWN';
  const c = compound.trim().toUpperCase();
  if (c.includes('INTER')) return 'INTERMEDIATE';
  if (c.includes('SOFT')) return 'SOFT';
  if (c.includes('MED')) return 'MEDIUM';
  if (c.includes('HARD')) return 'HARD';
  if (c.includes('WET')) return 'WET';
  return 'UNKNOWN';
}

/**
 * Official or canonical F1 team colors hex codes
 */
export const TEAM_COLORS: Record<string, string> = {
  'McLaren': '#F47600',
  'Ferrari': '#E80020',
  'Red Bull Racing': '#3671C6',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Williams': '#64C4FF',
  'Alpine': '#FF87BC',
  'Haas F1 Team': '#B6BABD',
  'Kick Sauber': '#52E252',
  'RB': '#6692FF',
};

export function getTeamColor(teamName: string | null | undefined, defaultColour?: string | null): string {
  if (defaultColour && defaultColour.trim()) {
    const clean = defaultColour.trim().replace(/^#/, '');
    if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      return `#${clean}`;
    }
  }
  if (!teamName) return '#94A3B8';
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (teamName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return '#94A3B8';
}
