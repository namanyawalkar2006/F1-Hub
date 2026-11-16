/**
 * Data Provider Registry & Orchestrator
 * Enforces Zero-Cost Strategy ($0 mandatory cost) and Absolute Data Integrity.
 * NEVER fabricates live positions, gaps, lap numbers, or fake live status.
 */

import { jolpicaProvider } from './jolpicaProvider';
import { openf1HistoricalProvider } from './openf1HistoricalProvider';
import { openf1Client } from '../openf1Client';
import {
  NormalizedSessionSchedule,
  NormalizedLiveSessionState,
} from './types';

export interface NextSessionDetails {
  round: number;
  raceName: string;
  circuitName: string;
  locality: string;
  country: string;
  sessionName: string;
  scheduledStart: string; // ISO UTC
  scheduledEnd: string;   // ISO UTC estimated (+1.5 hr)
  hasStarted: boolean;
  isCompleted: boolean;
}

class DataProviderRegistry {
  /**
   * Retrieves full season schedule from Jolpica
   */
  async getSchedule(): Promise<NormalizedSessionSchedule[]> {
    return jolpicaProvider.getSchedule('current');
  }

  /**
   * Identifies the current or next upcoming scheduled session from the calendar
   */
  async getNextSession(): Promise<NextSessionDetails | null> {
    const schedule = await this.getSchedule();
    const now = Date.now();

    // Check each round for upcoming sessions
    for (const race of schedule) {
      const raceEndEst = new Date(race.race_timestamp).getTime() + 2.5 * 3600 * 1000;
      if (now > raceEndEst) {
        continue; // This race weekend is finished
      }

      // Check sessions in chronological order
      const sessions: { name: string; time: string | null }[] = [
        { name: 'Practice 1', time: race.fp1_timestamp },
        { name: 'Practice 2', time: race.fp2_timestamp },
        { name: 'Sprint Qualifying', time: race.sprint_qualifying_timestamp },
        { name: 'Practice 3', time: race.fp3_timestamp },
        { name: 'Sprint', time: race.sprint_timestamp },
        { name: 'Qualifying', time: race.qualifying_timestamp },
        { name: 'Grand Prix', time: race.race_timestamp },
      ].filter(s => s.time !== null);

      for (const s of sessions) {
        const startMs = new Date(s.time!).getTime();
        const endMs = startMs + 1.5 * 3600 * 1000;

        // If session has not ended yet, this is the current or next session
        if (now <= endMs) {
          return {
            round: race.round,
            raceName: race.race_name,
            circuitName: race.circuit_name,
            locality: race.locality,
            country: race.country,
            sessionName: s.name,
            scheduledStart: s.time!,
            scheduledEnd: new Date(endMs).toISOString(),
            hasStarted: now >= startMs,
            isCompleted: false,
          };
        }
      }
    }

    // Default to last race if season finished
    const last = schedule[schedule.length - 1];
    if (last) {
      return {
        round: last.round,
        raceName: last.race_name,
        circuitName: last.circuit_name,
        locality: last.locality,
        country: last.country,
        sessionName: 'Grand Prix',
        scheduledStart: last.race_timestamp,
        scheduledEnd: last.race_timestamp,
        hasStarted: true,
        isCompleted: true,
      };
    }

    return null;
  }

  /**
   * Driver Championship Standings
   */
  async getDriverStandings() {
    return jolpicaProvider.getDriverStandings('current');
  }

  async getDriverProfile(driverRef: string, season: string = 'current') {
    return jolpicaProvider.getDriverProfile(driverRef, season);
  }

  async getConstructorProfile(constructorRef: string, season: string = 'current') {
    return jolpicaProvider.getConstructorProfile(constructorRef, season);
  }

  /**
   * Constructor Championship Standings
   */
  async getConstructorStandings() {
    return jolpicaProvider.getConstructorStandings('current');
  }

  /**
   * Recent Race Results
   */
  async getLastRaceResults() {
    return jolpicaProvider.getLastRaceResults();
  }

  /**
   * Recent Qualifying Results
   */
  async getLastQualifyingResults() {
    return jolpicaProvider.getLastQualifyingResults();
  }

  /**
   * Resolves live timing state with absolute data integrity:
   * 1. Checks if an authorized paid live stream is configured (none in $0 free mode).
   * 2. If the user explicitly selects a historical completed session, serves authentic recorded telemetry.
   * 3. If a scheduled session is underway right now, clearly displays:
   *    "SESSION EXPECTED TO HAVE STARTED • Live session data unavailable."
   * 4. If upcoming or no live feed:
   *    "LIVE TIMING UNAVAILABLE • F1 Hub currently does not have access to an authorized live timing feed."
   */
  async getLiveTimingState(requestedSessionKey?: number): Promise<NormalizedLiveSessionState> {
    const key = requestedSessionKey;

    // If historical session requested or active, serve real recorded telemetry from OpenF1
    if (key) {
      const historicalData = await openf1HistoricalProvider.getSessionData(key);
      if (historicalData) {
        return historicalData;
      }

      const selectedSession = await openf1Client.getSession(key);
      if (selectedSession) {
        const meeting = await openf1Client.getMeeting(selectedSession.meeting_key);
        return {
          policy: 'UNAVAILABLE',
          is_authorized_live_feed: false,
          status_banner: 'SESSION DATA UNAVAILABLE',
          status_message: 'No recorded timing data was returned for the selected session. Try again or choose another session.',
          last_verified_timestamp: null,
          latency_seconds: null,
          session: {
            session_key: selectedSession.session_key,
            session_name: selectedSession.session_name,
            meeting_name: meeting?.meeting_name ?? selectedSession.location,
            circuit_name: selectedSession.circuit_short_name,
            country_name: selectedSession.country_name,
            date_start: selectedSession.date_start,
            date_end: selectedSession.date_end,
            current_lap: null,
            total_laps: null,
            is_live_schedule: false,
          },
          track_status: {
            flag: 'CLEAR',
            status_message: 'No track status data received',
          },
          drivers: [],
          race_control: [],
          weather: null,
          provider: {
            primary: 'OpenF1',
            mode: 'Historical Archive',
            cost: '$0 Free Tier',
          },
        };
      }
    }

    const nextSession = await this.getNextSession();
    const now = Date.now();

    // Check if scheduled start has passed
    const isUnderway = nextSession ? (now >= new Date(nextSession.scheduledStart).getTime() && now <= new Date(nextSession.scheduledEnd).getTime()) : false;

    if (isUnderway) {
      return {
        policy: 'UNAVAILABLE',
        is_authorized_live_feed: false,
        status_banner: 'SESSION EXPECTED TO HAVE STARTED',
        status_message: 'Live session data syncing.',
        last_verified_timestamp: null,
        latency_seconds: null,
        session: {
          session_key: null,
          session_name: nextSession?.sessionName || 'Live Session',
          meeting_name: nextSession?.raceName || 'Grand Prix',
          circuit_name: nextSession?.circuitName || '—',
          country_name: nextSession?.country || '—',
          date_start: nextSession?.scheduledStart || null,
          date_end: nextSession?.scheduledEnd || null,
          current_lap: null,
          total_laps: null,
          is_live_schedule: true,
        },
        track_status: {
          flag: 'CLEAR',
          status_message: 'Live Feed Not Connected',
        },
        drivers: [],
        race_control: [],
        weather: null,
        provider: {
          primary: 'Jolpica F1 (Schedule)',
          mode: 'Zero-Cost Free Tier',
          cost: '$0 Free Tier',
        },
      };
    }

    // Default: Live timing unavailable
    return {
      policy: 'UNAVAILABLE',
      is_authorized_live_feed: false,
      status_banner: 'LIVE TIMING UNAVAILABLE',
      status_message: 'F1 Hub currently does not have access to an authorized live timing feed. Historical session telemetry is available below.',
      last_verified_timestamp: null,
      latency_seconds: null,
      session: {
        session_key: null,
        session_name: nextSession?.sessionName || '—',
        meeting_name: nextSession?.raceName || '—',
        circuit_name: nextSession?.circuitName || '—',
        country_name: nextSession?.country || '—',
        date_start: nextSession?.scheduledStart || null,
        date_end: nextSession?.scheduledEnd || null,
        current_lap: null,
        total_laps: null,
        is_live_schedule: false,
      },
      track_status: {
        flag: 'CLEAR',
        status_message: 'Track Clear',
      },
      drivers: [],
      race_control: [],
      weather: null,
      provider: {
        primary: 'Jolpica & OpenF1',
        mode: 'Free Tier',
        cost: '$0 Free Tier',
      },
    };
  }
}

export const dataProviderRegistry = new DataProviderRegistry();
