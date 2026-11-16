import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, ChevronRight, Trophy, Flag, Timer, AlertCircle, Zap } from 'lucide-react';
import { LiveState, DriverStanding, ConstructorStanding, LastRaceData } from '../../types';
import { getTeamColor } from '../../utils/f1State';
import { F1StartGantry } from '../common/F1StartGantry';
import { F1TelemetryHUD } from '../common/F1TelemetryHUD';
import { DriverQuotes } from './DriverQuotes';

interface NextSessionPayload {
  round: number;
  raceName: string;
  circuitName: string;
  locality: string;
  country: string;
  sessionName: string;
  scheduledStart: string;
  scheduledEnd: string;
  hasStarted: boolean;
  isCompleted: boolean;
}

interface HomeViewProps {
  liveState: LiveState | null;
  onNavigate: (view: 'HOME' | 'LIVE' | 'CALENDAR' | 'STANDINGS' | 'RESULTS') => void;
  onSelectDriver: (driverRef: string) => void;
  onSelectConstructor: (constructorRef: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  liveState,
  onNavigate,
  onSelectDriver,
  onSelectConstructor,
}) => {
  const [standings, setStandings] = useState<{ drivers: DriverStanding[]; constructors: ConstructorStanding[] } | null>(null);
  const [lastRace, setLastRace] = useState<LastRaceData | null>(null);
  const [nextSession, setNextSession] = useState<NextSessionPayload | null>(null);
  const [countdownText, setCountdownText] = useState<string>('—');
  const [countdownStatus, setCountdownStatus] = useState<'UPCOMING' | 'UNDERWAY_NO_FEED' | 'LIVE'>('UPCOMING');

  useEffect(() => {
    fetch('/api/next-session')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setNextSession(data);
      })
      .catch(() => {});

    fetch('/api/standings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStandings(data);
      })
      .catch(() => {});

    fetch('/api/results')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setLastRace(data);
      })
      .catch(() => {});
  }, []);

  // Accurate Countdown based exclusively on verified scheduled start timestamp
  useEffect(() => {
    if (!nextSession?.scheduledStart) return;

    const updateTimer = () => {
      const now = Date.now();
      const start = new Date(nextSession.scheduledStart).getTime();
      const end = new Date(nextSession.scheduledEnd).getTime();
      const diff = start - now;

      // Has verified live feed?
      if (liveState?.is_authorized_live_feed) {
        setCountdownStatus('LIVE');
        setCountdownText('LIVE ON TRACK');
        return;
      }

      // Scheduled time passed but no authorized live data feed
      if (diff <= 0) {
        if (now <= end) {
          setCountdownStatus('UNDERWAY_NO_FEED');
          setCountdownText('SESSION IN PROGRESS');
        } else {
          setCountdownStatus('UPCOMING');
          setCountdownText('SESSION COMPLETED');
        }
        return;
      }

      setCountdownStatus('UPCOMING');
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const dStr = days > 0 ? `${days}d ` : '';
      const hStr = `${String(hours).padStart(2, '0')}h `;
      const mStr = `${String(minutes).padStart(2, '0')}m `;
      const sStr = `${String(seconds).padStart(2, '0')}s`;
      setCountdownText(`${dStr}${hStr}${mStr}${sStr}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextSession, liveState]);

  return (
    <>
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 carbon-bg min-h-screen w-full overflow-x-hidden">
      {/* 1. Verified Live Banner (ONLY if authorized live feed actually exists) */}
      {liveState?.is_authorized_live_feed && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-950/90 via-neutral-900 to-neutral-950 border border-red-600/50 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden glow-f1-red"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-xs font-black uppercase tracking-widest text-red-500">
                  LIVE TELEMETRY ACTIVE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                {liveState.session.meeting_name}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium">
                {liveState.session.session_name}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('LIVE')}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-600/40 border border-red-400/30 cursor-pointer w-full sm:w-auto"
            >
              <span>Launch Live Timing</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 2. Scheduled Time Passed Banner */}
      {countdownStatus === 'UNDERWAY_NO_FEED' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/90 border border-neutral-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-red-500">
                SESSION IN PROGRESS
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium mt-0.5">
                {nextSession?.sessionName} at {nextSession?.raceName}. Official track session is active.
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('LIVE')}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider self-start sm:self-auto transition-colors border border-red-500/40 cursor-pointer shadow-md"
          >
            Open Timing Hub →
          </motion.button>
        </motion.div>
      )}

      {/* 3. Next Session Hero Card with Centered Speed-Blur Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2 bg-gradient-to-br from-[#0c0c10] to-[#121218] border border-neutral-800 rounded-2xl p-4 sm:p-6 md:p-10 flex flex-col justify-between relative overflow-hidden glow-f1-red shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500">
                <Timer className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Next Championship Session</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                Round {nextSession?.round || '1'}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                {nextSession?.sessionName || 'Grand Prix Weekend'}
              </div>
              <h1 className="font-racing text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight text-white break-words max-w-full text-center">
                {nextSession?.raceName || 'Formula 1 Grand Prix'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 uppercase tracking-wider font-semibold break-words text-center leading-relaxed mt-3">
                {nextSession?.circuitName} • {nextSession?.locality}, {nextSession?.country}
              </p>
            </div>

            {nextSession?.scheduledStart && (
              <div className="flex items-center gap-3 text-neutral-300 text-xs font-semibold flex-wrap">
                <Calendar className="w-4 h-4 text-red-500" />
                <span>
                  {new Date(nextSession.scheduledStart).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  •{' '}
                  {new Date(nextSession.scheduledStart).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  Local Time
                </span>
              </div>
            )}
          </div>

          {/* Centered Speed-Blur Countdown Clock & F1 Steering Shift Lights */}
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-neutral-800/90 flex flex-col items-center justify-center text-center relative z-10 w-full">
            {/* F1 Steering Wheel Shift Lights Animation */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-3 sm:mb-4 max-w-full overflow-x-auto py-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={`g-${i}`}
                  className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] flex-shrink-0"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={`r-${i}`}
                  className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(212,21,20,0.8)] flex-shrink-0"
                  style={{ animationDelay: `${(i + 5) * 150}ms` }}
                />
              ))}
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={`b-${i}`}
                  className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)] flex-shrink-0"
                  style={{ animationDelay: `${(i + 10) * 150}ms` }}
                />
              ))}
            </div>

            <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-bold mb-2">
              {countdownStatus === 'UNDERWAY_NO_FEED' ? 'Session Underway' : 'Session Countdown'}
            </span>

            {/* Glowing Speed-Blur Numerals with Motion Pulse */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-4xl md:text-6xl font-black font-timing text-white tracking-wider glow-red py-3 sm:py-4 px-3 sm:px-8 rounded-2xl bg-black/75 border border-red-500/40 relative overflow-hidden group shadow-[0_0_40px_rgba(212,21,20,0.25)] max-w-full truncate text-center"
            >
              {/* Scanline light effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
                className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-red-500/15 to-transparent pointer-events-none"
              />
              <span className="relative z-10">{countdownText}</span>
            </motion.div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate('LIVE')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-600/40 border border-red-400/30 cursor-pointer"
              >
                <span>Live Timing Hub</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate('CALENDAR')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-neutral-800 cursor-pointer"
              >
                <span>2026 Calendar</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* 4. Last Race Result & Podium with Motion */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200">
                  Last Grand Prix
                </h3>
              </div>
              <button
                onClick={() => onNavigate('RESULTS')}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Classification</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-xs text-neutral-500 font-medium">
                Round {lastRace?.round || '—'} • {lastRace?.date}
              </span>
              <h4
                style={{
                  fontFamily: 'Verdana',
                  fontSize: '23px',
                  textDecorationLine: 'none',
                  fontStyle: 'italic',
                  color: '#f2dbdb',
                }}
                className="font-black uppercase mt-0.5"
              >
                {lastRace?.raceName || 'Grand Prix'}
              </h4>
              <span className="text-xs text-neutral-400">
                {lastRace?.circuitName}
              </span>
            </div>

            {/* Podium */}
            <div className="space-y-2 mt-4">
              {(Array.isArray(lastRace?.results) ? lastRace.results : []).slice(0, 3).map((r) => {
                const teamColor = getTeamColor(r.team_name);
                return (
                  <motion.div
                    key={r.driver_number}
                    whileHover={{ x: 4, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex items-center justify-between rounded-lg border border-neutral-800/80 bg-neutral-900/80 p-2.5 transition-colors hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-timing font-black text-xs w-5 text-center ${
                          r.position === 1
                            ? 'text-amber-400'
                            : r.position === 2
                            ? 'text-slate-300'
                            : 'text-amber-600'
                        }`}
                      >
                        P{r.position}
                      </span>
                      <div
                        className="w-1 h-5 rounded-full"
                        style={{ backgroundColor: teamColor }}
                      />
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectDriver(r.driver_code || r.driver_id)}
                          className="cursor-pointer text-left text-xs font-bold text-neutral-200 hover:text-red-300"
                        >
                          {r.full_name}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectConstructor(r.constructor_id || r.team_name)}
                          className="block max-w-[130px] cursor-pointer truncate text-left text-[10px] text-neutral-400 hover:text-white"
                        >
                          {r.team_name}
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-timing text-neutral-300">
                        +{r.points} pts
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('RESULTS')}
            className="w-full mt-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer"
          >
            Full Results →
          </motion.button>
        </motion.div>
      </div>

      {/* 5. Authentic Formula 1 Motion Animations (Start Gantry & Telemetry HUD) */}
      <div className="space-y-6">
        <F1StartGantry />
        <F1TelemetryHUD />
      </div>

      {/* 6. Championship Standings Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Standings Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200">
                Drivers' Championship
              </h3>
            </div>
            <button
              onClick={() => onNavigate('STANDINGS')}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Full Standings</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-neutral-900/80">
            {(Array.isArray(standings?.drivers) ? standings.drivers : []).slice(0, 5).map((d) => {
              const color = getTeamColor(d.team_name);
              return (
                <motion.div
                  key={d.driver_number || d.position}
                  whileHover={{ x: 3 }}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-900/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-timing font-bold text-xs text-neutral-400 w-5">
                      {d.position}
                    </span>
                    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectDriver(d.driver_code || d.driver_id)}
                        className="cursor-pointer text-left text-xs font-bold text-neutral-200 hover:text-red-300"
                      >
                        {d.full_name}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectConstructor(d.constructor_id || d.team_name)}
                        className="block cursor-pointer text-left text-[11px] text-neutral-500 hover:text-white"
                      >
                        {d.team_name}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-timing font-bold text-xs text-neutral-100">
                      {d.points} PTS
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Constructors Championship Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200">
                Constructors' Championship
              </h3>
            </div>
            <button
              onClick={() => onNavigate('STANDINGS')}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Full Standings</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-neutral-900/80">
            {(Array.isArray(standings?.constructors) ? standings.constructors : []).slice(0, 5).map((c) => {
              const color = getTeamColor(c.team_name);
              return (
                <motion.div
                  key={c.team_name}
                  whileHover={{ x: 3 }}
                  className="py-2.5 flex items-center justify-between transition-colors hover:bg-neutral-900/30 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-timing font-bold text-xs text-neutral-400 w-5">
                      {c.position}
                    </span>
                    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                    <button
                      type="button"
                      onClick={() => onSelectConstructor(c.constructor_id || c.team_name)}
                      aria-label={`View ${c.team_name} constructor profile`}
                      className="cursor-pointer text-left text-xs font-bold text-neutral-200 hover:text-red-300"
                    >
                      {c.team_name}
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="font-timing font-bold text-xs text-neutral-100">
                      {c.points} PTS
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
      <DriverQuotes />
    </>
  );
};
