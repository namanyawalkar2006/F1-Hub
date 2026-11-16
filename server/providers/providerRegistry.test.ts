import test from 'node:test';
import assert from 'node:assert/strict';
import { dataProviderRegistry } from './dataProviderRegistry';
import { jolpicaProvider } from './jolpicaProvider';
import { openf1HistoricalProvider } from './openf1HistoricalProvider';
import { openf1Client } from '../openf1Client';
import type {
  OpenF1Driver,
  OpenF1Meeting,
  OpenF1Session,
} from '../openf1Client';
import { getConstructorPowerUnit } from './constructorPowerUnits';
import { NormalizedLiveSessionState } from './types';

test('jolpicaProvider fetches real official 2026 season schedule', async () => {
  const schedule = await jolpicaProvider.getSchedule('current');
  assert.ok(Array.isArray(schedule), 'Schedule is an array');
  assert.ok(schedule.length >= 20, 'At least 20 rounds in schedule');
  const first = schedule[0];
  assert.ok(first.round === 1, 'First round is 1');
  assert.ok(first.race_name.length > 0, 'Has race name');
  assert.ok(first.race_timestamp.includes('T'), 'Has valid ISO timestamp');
});

test('jolpicaProvider fetches real official driver standings without faking', async () => {
  const standingsData = await jolpicaProvider.getDriverStandings('current');
  assert.ok(standingsData.standings.length > 0, 'Has standings');
  const p1 = standingsData.standings[0];
  assert.equal(p1.position, 1, 'Leader is position 1');
  assert.ok(p1.points > 0, 'Leader has points');
  assert.ok(p1.full_name.length > 0, 'Leader has name');
});

test('jolpicaProvider builds a driver season profile from published results', async () => {
  const originalFetch = globalThis.fetch;
  const responses: Record<string, unknown> = {
    '/2099/driverStandings.json': {
      MRData: {
        StandingsTable: {
          season: '2099',
          StandingsLists: [{
            round: '1',
            DriverStandings: [{
              position: '1',
              points: '26',
              wins: '1',
              Driver: {
                driverId: 'test-driver',
                permanentNumber: '99',
                code: 'TST',
                givenName: 'Test',
                familyName: 'Driver',
                nationality: 'Testian',
              },
              Constructors: [{ name: 'Test Racing', constructorId: 'test' }],
            }],
          }],
        },
      },
    },
    '/2099/drivers/test-driver/results.json': {
      MRData: {
        RaceTable: {
          Races: [{
            round: '1',
            raceName: 'Test Grand Prix',
            date: '2099-03-01',
            Circuit: { circuitName: 'Test Circuit' },
            Results: [{
              position: '1',
              positionText: '1',
              grid: '2',
              points: '25',
              status: 'Finished',
              FastestLap: { rank: '1', Time: { time: '1:02.000' } },
            }],
          }, {
            round: '2',
            raceName: 'Second Test Grand Prix',
            date: '2099-03-08',
            Circuit: { circuitName: 'Second Test Circuit' },
            Results: [{
              position: '2',
              positionText: '2',
              grid: '4',
              points: '18',
              status: 'Finished',
              FastestLap: { rank: '2', Time: { time: '1:03.000' } },
            }],
          }, {
            round: '3',
            raceName: 'Third Test Grand Prix',
            date: '2099-03-15',
            Circuit: { circuitName: 'Third Test Circuit' },
            Results: [{
              position: '0',
              positionText: 'Did not start',
              grid: '8',
              points: '0',
              status: 'Did not start',
            }],
          }],
        },
      },
    },
    '/2099/drivers/test-driver/qualifying.json': {
      MRData: {
        RaceTable: {
          Races: [{
            round: '1',
            QualifyingResults: [{ position: '1', Q1: '1:10.000', Q2: '1:09.000', Q3: '1:08.000' }],
          }],
        },
      },
    },
    '/2099/drivers/test-driver/sprint.json': {
      MRData: { RaceTable: { Races: [] } },
    },
  };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    const response = Object.entries(responses).find(([path]) => url.pathname.endsWith(path))?.[1];
    return new Response(JSON.stringify(response || { MRData: { RaceTable: { Races: [] } } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof globalThis.fetch;

  try {
    const profile = await jolpicaProvider.getDriverProfile('TST', '2099');
    assert.ok(profile);
    assert.equal(profile.driver.driver_id, 'test-driver');
    assert.equal(profile.stats.points, 26);
    assert.equal(profile.stats.podiums, 2);
    assert.equal(profile.stats.poles, 1);
    assert.equal(profile.stats.fastest_laps, 1);
    assert.equal(profile.stats.race_starts, 2);
    assert.equal(profile.races.length, 3);
    assert.equal(profile.races[1].fastest_lap, null);
    assert.equal(profile.races[0].qualifying?.q3, '1:08.000');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('jolpicaProvider builds constructor season stats and driver results', async () => {
  const originalFetch = globalThis.fetch;
  const responses: Record<string, unknown> = {
    '/2098/constructorStandings.json': {
      MRData: {
        StandingsTable: {
          season: '2098',
          StandingsLists: [{
            round: '1',
            ConstructorStandings: [{
              position: '1',
              points: '50',
              wins: '1',
              Constructor: { constructorId: 'test-racing', name: 'Test Racing', nationality: 'Testian' },
            }],
          }],
        },
      },
    },
    '/2098/driverStandings.json': {
      MRData: {
        StandingsTable: {
          season: '2098',
          StandingsLists: [{
            round: '1',
            DriverStandings: [
              {
                position: '1',
                points: '26',
                wins: '1',
                Driver: { driverId: 'test-one', permanentNumber: '10', code: 'ONE', givenName: 'Test', familyName: 'One' },
                Constructors: [{ constructorId: 'test-racing', name: 'Test Racing' }],
              },
              {
                position: '2',
                points: '24',
                wins: '0',
                Driver: { driverId: 'test-two', permanentNumber: '20', code: 'TWO', givenName: 'Test', familyName: 'Two' },
                Constructors: [{ constructorId: 'test-racing', name: 'Test Racing' }],
              },
            ],
          }],
        },
      },
    },
    '/2098/constructors/test-racing/results.json': {
      MRData: {
        RaceTable: {
          Races: [{
            round: '1',
            raceName: 'Test Grand Prix',
            date: '2098-03-01',
            Circuit: { circuitName: 'Test Circuit' },
            Results: [
              {
                number: '10',
                position: '1',
                positionText: '1',
                grid: '1',
                points: '25',
                status: 'Finished',
                Driver: { driverId: 'test-one', permanentNumber: '10', code: 'ONE', givenName: 'Test', familyName: 'One' },
                Constructor: { constructorId: 'test-racing' },
                FastestLap: { rank: '1', Time: { time: '1:02.000' } },
              },
              {
                number: '20',
                position: '3',
                positionText: '3',
                grid: '4',
                points: '15',
                status: 'Finished',
                Driver: { driverId: 'test-two', permanentNumber: '20', code: 'TWO', givenName: 'Test', familyName: 'Two' },
                Constructor: { constructorId: 'test-racing' },
                FastestLap: { rank: '2', Time: { time: '1:03.000' } },
              },
            ],
          }],
        },
      },
    },
    '/2098/constructors/test-racing/qualifying.json': {
      MRData: {
        RaceTable: {
          Races: [{
            round: '1',
            QualifyingResults: [
              { number: '10', position: '1', Q1: '1:10.000', Q2: '1:09.000', Q3: '1:08.000' },
              { number: '20', position: '3', Q1: '1:11.000', Q2: '1:10.000', Q3: '1:09.000' },
            ],
          }],
        },
      },
    },
    '/2098/constructors/test-racing/sprint.json': {
      MRData: {
        RaceTable: {
          Races: [{
            round: '1',
            SprintResults: [
              { number: '10', position: '1', points: '8' },
              { number: '20', position: '4', points: '5' },
            ],
          }],
        },
      },
    },
  };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    const response = Object.entries(responses).find(([path]) => url.pathname.endsWith(path))?.[1];
    return new Response(JSON.stringify(response || { MRData: { RaceTable: { Races: [] } } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof globalThis.fetch;

  try {
    const profile = await jolpicaProvider.getConstructorProfile('test-racing', '2098');
    assert.ok(profile);
    assert.equal(profile.constructor.team_name, 'Test Racing');
    assert.equal(profile.stats.points, 50);
    assert.equal(profile.stats.podiums, 2);
    assert.equal(profile.stats.poles, 1);
    assert.equal(profile.stats.fastest_laps, 1);
    assert.equal(profile.stats.sprint_wins, 1);
    assert.equal(profile.stats.sprint_points, 13);
    assert.equal(profile.stats.drivers, 2);
    assert.equal(profile.engine_supplier, null);
    assert.equal(profile.power_unit, null);
    assert.equal(profile.races[0].points, 40);
    assert.equal(profile.races[0].drivers[0].qualifying?.q3, '1:08.000');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('2026 constructor power-unit data names suppliers and separates rule limits from unpublished output', () => {
  const teamsAndSuppliers = {
    alpine: 'Mercedes-AMG',
    aston_martin: 'Honda',
    audi: 'Audi',
    cadillac: 'Ferrari',
    ferrari: 'Ferrari',
    haas: 'Ferrari',
    mclaren: 'Mercedes-AMG',
    mercedes: 'Mercedes-AMG',
    racing_bulls: 'Red Bull Ford Powertrains',
    red_bull: 'Red Bull Ford Powertrains',
    williams: 'Mercedes-AMG',
  };
  for (const [team, supplier] of Object.entries(teamsAndSuppliers)) {
    assert.equal(getConstructorPowerUnit('2026', team)?.supplier, supplier);
  }
  assert.equal(getConstructorPowerUnit('2026', 'audi')?.electric_power_kw, 350);
  assert.equal(getConstructorPowerUnit('2026', 'audi')?.total_power, 'Manufacturer-specific combined peak output is not publicly disclosed');
  assert.equal(getConstructorPowerUnit('2025', 'mclaren'), null);
  assert.equal(getConstructorPowerUnit('2026', 'unknown-team'), null);
});

test('race replay uses recorded sectors and leaves unavailable car status blank', async () => {
  const sessionKey = 999991;
  const session: OpenF1Session = {
    session_key: sessionKey,
    session_type: 'Race',
    session_name: 'Race',
    date_start: '2026-01-01T10:00:00Z',
    date_end: '2026-01-01T12:00:00Z',
    meeting_key: 99999,
    circuit_key: 1,
    circuit_short_name: 'Test Circuit',
    country_name: 'Test Country',
    country_code: 'TST',
    location: 'Test City',
    gmt_offset: '+00:00',
    year: 2026,
    is_cancelled: false,
  };
  const meeting: OpenF1Meeting = {
    meeting_key: session.meeting_key,
    meeting_name: 'Test Grand Prix',
    meeting_official_name: 'Test Grand Prix',
    location: 'Test City',
    country_name: 'Test Country',
    country_code: 'TST',
    country_flag: '',
    circuit_key: 1,
    circuit_short_name: 'Test Circuit',
    circuit_image: '',
    circuit_info_url: '',
    gmt_offset: '+00:00',
    date_start: session.date_start,
    date_end: session.date_end,
    year: 2026,
    is_cancelled: false,
  };
  const driver: OpenF1Driver = {
    meeting_key: meeting.meeting_key,
    session_key: session.session_key,
    driver_number: 1,
    broadcast_name: 'T DRIVER',
    full_name: 'Test Driver',
    name_acronym: 'TST',
    team_name: 'Test Team',
    team_colour: 'FF0000',
    first_name: 'Test',
    last_name: 'Driver',
    headshot_url: null,
    country_code: null,
  };
  const lappedDriver: OpenF1Driver = {
    ...driver,
    driver_number: 2,
    broadcast_name: 'L DRIVER',
    full_name: 'Lapped Driver',
    name_acronym: 'LAP',
    first_name: 'Lapped',
  };
  const originals = {
    getSession: openf1Client.getSession,
    getMeeting: openf1Client.getMeeting,
    getDrivers: openf1Client.getDrivers,
    getPositions: openf1Client.getPositions,
    getIntervals: openf1Client.getIntervals,
    getLaps: openf1Client.getLaps,
    getStints: openf1Client.getStints,
    getRaceControl: openf1Client.getRaceControl,
    getWeather: openf1Client.getWeather,
    getPits: openf1Client.getPits,
  };

  openf1Client.getSession = async () => session;
  openf1Client.getMeeting = async () => meeting;
  openf1Client.getDrivers = async () => [driver, lappedDriver];
  openf1Client.getPositions = async () => [{
    date: session.date_start,
    session_key: session.session_key,
    meeting_key: meeting.meeting_key,
    position: 1,
    driver_number: driver.driver_number,
  }, {
    date: session.date_start,
    session_key: session.session_key,
    meeting_key: meeting.meeting_key,
    position: 2,
    driver_number: lappedDriver.driver_number,
  }];
  openf1Client.getIntervals = async () => [{
    date: session.date_start,
    session_key: session.session_key,
    meeting_key: meeting.meeting_key,
    driver_number: lappedDriver.driver_number,
    gap_to_leader: '+1 LAP',
    interval: '+1 LAP',
  }];
  openf1Client.getLaps = async () => [{
    date_start: session.date_start,
    session_key: session.session_key,
    meeting_key: meeting.meeting_key,
    driver_number: driver.driver_number,
    lap_number: 1,
    lap_duration: 81.25,
    duration_sector_1: 26.1,
    duration_sector_2: 28.2,
    duration_sector_3: 26.95,
    is_pit_out_lap: false,
  }];
  openf1Client.getStints = async () => [];
  openf1Client.getRaceControl = async () => [];
  openf1Client.getWeather = async () => [];
  openf1Client.getPits = async () => [];

  try {
    const state = await openf1HistoricalProvider.getSessionData(sessionKey);
    assert.ok(state);
    assert.equal(state.session.meeting_name, 'Test Grand Prix');
    assert.equal(state.session.total_laps, 1);
    assert.equal(state.drivers[0].sector_1_time, 26.1);
    assert.equal(state.drivers[0].sector_2_time, 28.2);
    assert.equal(state.drivers[0].sector_3_time, 26.95);
    assert.equal(state.drivers[0].pit_status, null);
    assert.equal(state.drivers[1].gap, '+1 LAP');
    assert.equal(state.drivers[1].interval, '+1 LAP');
  } finally {
    Object.assign(openf1Client, originals);
  }
});

test('dataProviderRegistry resolves live timing state with strict zero-fake data policy', async () => {
  const timingState = await dataProviderRegistry.getLiveTimingState();
  assert.ok(['UNAVAILABLE', 'HISTORICAL', 'LIVE'].includes(timingState.policy));
  assert.equal(timingState.is_authorized_live_feed, false, 'No paid feed assumed');
  // Check that no fabricated drivers are generated when unavailable
  if (timingState.policy === 'UNAVAILABLE') {
    assert.equal(timingState.drivers.length, 0, 'Zero fake drivers when unavailable');
  }
});

test('requested historical sessions do not leak into another live snapshot', async () => {
  const originalGetSessionData = openf1HistoricalProvider.getSessionData;
  const replayState: NormalizedLiveSessionState = {
    policy: 'HISTORICAL',
    is_authorized_live_feed: false,
    status_banner: 'HISTORICAL DATA • SESSION COMPLETED',
    status_message: 'Recorded session telemetry.',
    last_verified_timestamp: '2026-01-01T00:00:00.000Z',
    latency_seconds: null,
    session: {
      session_key: 123,
      session_name: 'Race',
      meeting_name: 'Test Grand Prix',
      circuit_name: 'Test Circuit',
      country_name: 'Test Country',
      date_start: null,
      date_end: null,
      current_lap: null,
      total_laps: null,
      is_live_schedule: false,
    },
    track_status: { flag: 'CLEAR', status_message: 'Track status unavailable' },
    drivers: [],
    race_control: [],
    weather: null,
    provider: { primary: 'OpenF1', mode: 'Historical', cost: '$0 Free Tier' },
  };
  openf1HistoricalProvider.getSessionData = async (sessionKey) =>
    sessionKey === 123 ? replayState : null;

  try {
    const replay = await dataProviderRegistry.getLiveTimingState(123);
    const liveSnapshot = await dataProviderRegistry.getLiveTimingState();

    assert.equal(replay.policy, 'HISTORICAL');
    assert.equal(liveSnapshot.policy, 'UNAVAILABLE');
    assert.equal(liveSnapshot.session.session_key, null);
    assert.equal(liveSnapshot.drivers.length, 0);
  } finally {
    openf1HistoricalProvider.getSessionData = originalGetSessionData;
  }
});
