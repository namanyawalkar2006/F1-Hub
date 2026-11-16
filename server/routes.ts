/**
 * Express REST API Routes for F1 Hub
 * ZERO-COST DATA STRATEGY: 100% Free Public APIs (Jolpica & OpenF1 Free Archive)
 * ABSOLUTE DATA INTEGRITY: NEVER fabricates fake positions, fake gaps, or fake countdowns.
 */

import { Router } from 'express';
import { dataProviderRegistry } from './providers/dataProviderRegistry';
import { openf1Client } from './openf1Client';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', service: 'F1 Hub' });
});

// 1. Health, Architecture & Zero-Cost Status
apiRouter.get('/status', async (req, res) => {
  const nextSession = await dataProviderRegistry.getNextSession();
  res.json({
    app: 'F1 Hub',
    status: 'online',
    architecture: 'ZERO-COST DATA STRATEGY ($0 Mandatory Cost)',
    providers: {
      primary: 'Jolpica F1 (Championship, Calendar, Results)',
      secondary: 'OpenF1 Community Tier (Free Historical Telemetry)',
      live_feed: 'UNAVAILABLE ($0 Free Mode)',
    },
    cost: '$0.00 / month',
    data_policy: 'Strict Zero Fake Data',
    next_session: nextSession?.sessionName || null,
    server_time: new Date().toISOString(),
  });
});

// 2. Calendar / Season Schedule
apiRouter.get('/calendar', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  try {
    const schedule = await dataProviderRegistry.getSchedule();
    res.json(schedule || []);
  } catch (err) {
    res.json([]);
  }
});

// 3. Next Scheduled Session & Countdown Info
apiRouter.get('/next-session', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
  try {
    const nextSession = await dataProviderRegistry.getNextSession();
    res.json(nextSession);
  } catch {
    res.json(null);
  }
});

// 4. World Championship Standings (Drivers & Constructors)
apiRouter.get('/standings', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  try {
    const [driversRes, constructorsRes] = await Promise.all([
      dataProviderRegistry.getDriverStandings(),
      dataProviderRegistry.getConstructorStandings(),
    ]);

    res.json({
      season: driversRes?.season || '2026',
      round: driversRes?.round || '1',
      drivers: driversRes?.standings || [],
      constructors: constructorsRes?.standings || [],
      source: 'Jolpica F1 (Free & Open)',
      updated_at: new Date().toISOString(),
    });
  } catch {
    res.json({
      season: '2026',
      round: '1',
      drivers: [],
      constructors: [],
      source: 'Jolpica F1 (Standby)',
      updated_at: new Date().toISOString(),
    });
  }
});

apiRouter.get('/drivers/:driverRef', async (req, res) => {
  const driverRef = req.params.driverRef.trim();
  const requestedSeason = req.query.season;
  const season = typeof requestedSeason === 'string' ? requestedSeason : 'current';
  if (!/^[a-z0-9_-]+$/i.test(driverRef) || (season !== 'current' && !/^\d{4}$/.test(season))) {
    return res.status(400).json({ error: 'Invalid driver or season' });
  }

  try {
    const profile = await dataProviderRegistry.getDriverProfile(driverRef, season);
    if (!profile) {
      return res.status(404).json({ error: 'Driver profile is unavailable for this season' });
    }

    const headshotUrl = await openf1Client.getLatestDriverHeadshot(profile.driver.driver_number);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    res.json({ ...profile, headshot_url: headshotUrl });
  } catch (err) {
    console.error('Failed to load driver profile:', err);
    res.status(500).json({ error: 'Failed to load driver profile' });
  }
});

apiRouter.get('/constructors/:constructorRef', async (req, res) => {
  const constructorRef = req.params.constructorRef.trim();
  const requestedSeason = req.query.season;
  const season = typeof requestedSeason === 'string' ? requestedSeason : 'current';
  if (!/^[a-z0-9 _-]+$/i.test(constructorRef) || (season !== 'current' && !/^\d{4}$/.test(season))) {
    return res.status(400).json({ error: 'Invalid constructor or season' });
  }

  try {
    const profile = await dataProviderRegistry.getConstructorProfile(constructorRef, season);
    if (!profile) {
      return res.status(404).json({ error: 'Constructor profile is unavailable for this season' });
    }

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    res.json(profile);
  } catch (err) {
    console.error('Failed to load constructor profile:', err);
    res.status(500).json({ error: 'Failed to load constructor profile' });
  }
});

// 5. Recent Race Results
apiRouter.get('/results', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  try {
    const results = await dataProviderRegistry.getLastRaceResults();
    if (!results) {
      return res.status(200).json(null);
    }
    res.json(results);
  } catch {
    res.json(null);
  }
});

// 6. Recent Qualifying Results
apiRouter.get('/results/qualifying', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  try {
    const qualifying = await dataProviderRegistry.getLastQualifyingResults();
    if (!qualifying) {
      return res.status(200).json(null);
    }
    res.json(qualifying);
  } catch {
    res.json(null);
  }
});

// 7. Live / Current Session Timing State
apiRouter.get('/live', async (req, res) => {
  try {
    const sessionKey = req.query.session_key ? Number(req.query.session_key) : undefined;
    const state = await dataProviderRegistry.getLiveTimingState(sessionKey);
    res.json(state);
  } catch {
    res.status(500).json({ error: 'Failed to load timing state' });
  }
});

// 8. Select Historical Session for Replay / Analysis
apiRouter.post('/live/select-session', async (req, res) => {
  const { session_key } = req.body;
  const state = await dataProviderRegistry.getLiveTimingState(session_key ? Number(session_key) : undefined);
  res.json(state);
});

// 9. Available Historical Sessions (from OpenF1 Free Archive)
apiRouter.get('/historical-sessions', async (req, res) => {
  try {
    const latestMeeting = await openf1Client.getLatestMeeting();
    let sessions: any[] = [];
    if (latestMeeting) {
      sessions = await openf1Client.getMeetingSessions(latestMeeting.meeting_key);
    }
    res.json(sessions);
  } catch {
    res.json([]);
  }
});
