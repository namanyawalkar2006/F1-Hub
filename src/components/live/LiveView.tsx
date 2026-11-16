import React from 'react';
import { Archive, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { LiveState } from '../../types';
import { getTeamColor, formatLapTime } from '../../utils/f1State';
import { LiveHeader } from './LiveHeader';
import { LiveTelemetryDashboard } from './LiveTelemetryDashboard';
import { LiveTimingTable } from './LiveTimingTable';
import { RaceControlFeed } from './RaceControlFeed';
import { TrackWeather } from './TrackWeather';

interface LiveViewProps {
  state: LiveState | null;
  isLoading?: boolean;
  loadError?: string | null;
  selectedSessionKey: number | null;
  onSelectSession?: (sessionKey: number | null) => void;
  onSelectDriver: (driverRef: string) => void;
  onSelectConstructor: (constructorRef: string) => void;
  onRefresh?: () => void;
}

const TrackPositionPanel: React.FC<{ state: LiveState | null }> = ({ state }) => {
  const drivers = state?.drivers ?? [];
  const hasPositions = drivers.some((driver) => driver.position !== null);
  const positionsAreCurrent = state?.policy === 'LIVE' && state.is_authorized_live_feed;

  return (
    <section className="overflow-hidden border border-neutral-800 bg-[#0b0b10]">
      <div className="h-0.5 bg-red-600" />
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div>
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.25em] text-neutral-500">
            {state?.session.circuit_name || 'CIRCUIT'} · {hasPositions ? 'TIMING ORDER' : 'WAITING FOR SOURCE'}
          </div>
          <h2 className="font-racing text-base font-black uppercase italic tracking-wide text-white">Track position</h2>
        </div>
        <MapPin className="h-4 w-4 text-red-500" />
      </div>

      <div className="min-h-40 p-4">
        {hasPositions ? (
          <>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {drivers.filter((driver) => driver.position !== null).map((driver) => (
                <div
                  key={driver.driver_number}
                  title={`P${driver.position} · ${driver.full_name}`}
                  className="flex min-w-0 items-center gap-1.5 border border-neutral-800 bg-black/50 px-1.5 py-2"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: driver.team_colour ? `#${driver.team_colour.replace(/^#/, '')}` : '#737373' }} />
                  <span className="truncate font-timing text-[9px] text-neutral-300">
                    {driver.position} {driver.name_acronym}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[9px] uppercase tracking-wider text-neutral-600">
              {positionsAreCurrent ? 'Live classification · GPS coordinates not supplied' : 'Recorded classification · not a GPS track map'}
            </p>
          </>
        ) : (
          <div className="flex min-h-32 items-center justify-center text-center">
            <p className="max-w-xs text-[10px] leading-relaxed text-neutral-500">
              The selected data source has not provided car position records. No markers are estimated.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export const LiveView: React.FC<LiveViewProps> = ({
  state,
  isLoading = false,
  loadError,
  selectedSessionKey,
  onSelectSession,
  onSelectDriver,
  onSelectConstructor,
  onRefresh,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const drivers = state?.drivers ?? [];
  const isHistorical = state?.policy === 'HISTORICAL';
  const leader = drivers.find((driver) => driver.position === 1) ?? null;
  const fastestLapDriver = drivers
    .filter((driver) => driver.best_lap_time !== null && driver.best_lap_time > 0)
    .sort((a, b) => (a.best_lap_time ?? Number.MAX_SAFE_INTEGER) - (b.best_lap_time ?? Number.MAX_SAFE_INTEGER))[0] ?? null;
  const currentLap = state?.session.current_lap ?? null;
  const totalLaps = state?.session.total_laps ?? null;
  const lapsRemaining = !isHistorical && currentLap !== null && totalLaps !== null
    ? Math.max(0, totalLaps - currentLap)
    : null;
  const hasTrackStatus = Boolean(state && state.policy !== 'UNAVAILABLE' && drivers.length > 0);

  const summaryItems = [
    {
      label: 'Race leader',
      value: leader?.name_acronym ?? '—',
      detail: leader ? `${leader.full_name} · ${leader.team_name}` : 'No classified leader',
      color: 'text-white',
    },
    {
      label: 'Fastest lap',
      value: fastestLapDriver ? formatLapTime(fastestLapDriver.best_lap_time) : '—',
      detail: fastestLapDriver ? `${fastestLapDriver.name_acronym} · ${fastestLapDriver.team_name}` : 'No lap time received',
      color: 'text-amber-300',
    },
    {
      label: isHistorical ? 'Laps recorded' : 'Laps remaining',
      value: isHistorical
        ? currentLap !== null ? String(currentLap) : '—'
        : lapsRemaining !== null ? String(lapsRemaining) : '—',
      detail: isHistorical
        ? 'Completed laps present in source'
        : currentLap !== null && totalLaps !== null ? `Lap ${currentLap} of ${totalLaps}` : 'Lap count not supplied',
      color: 'text-white',
    },
    {
      label: 'Track status',
      value: hasTrackStatus ? state?.track_status.status_message ?? '—' : '—',
      detail: hasTrackStatus ? state?.track_status.flag ?? 'Source status' : 'No track status received',
      color: 'text-emerald-300',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6">
      <LiveHeader
        state={state}
        selectedSessionKey={selectedSessionKey}
        onSelectSession={onSelectSession}
        onRefresh={onRefresh}
      />

      {loadError && (
        <p role="alert" className="border border-red-900/70 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          Could not refresh session data: {loadError}
        </p>
      )}

      <section aria-label="Race summary" className="grid grid-cols-2 border border-neutral-800 bg-[#0b0b10] sm:grid-cols-4">
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: prefersReducedMotion ? 0 : index * 0.04 }}
            className="min-w-0 border-b border-r border-neutral-800 p-3 last:border-r-0 sm:p-4"
          >
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.22em] text-neutral-500 sm:text-[9px]">
              {item.label}
            </p>
            <p className={`truncate font-racing text-lg font-black italic sm:text-xl ${item.color}`}>{item.value}</p>
            <p className="mt-1 truncate text-[9px] text-neutral-500">{item.detail}</p>
          </motion.div>
        ))}
      </section>

      {isHistorical && (
        <div className="flex items-center gap-2 border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-[10px] uppercase tracking-wider text-amber-200">
          <Archive className="h-3.5 w-3.5" />
          Recorded session data · not a live broadcast
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveTimingTable
            drivers={drivers}
            isLoading={isLoading}
            policy={state?.policy ?? 'UNAVAILABLE'}
            onSelectDriver={onSelectDriver}
            onSelectConstructor={onSelectConstructor}
          />
        </div>

        <aside className="space-y-4">
          <TrackPositionPanel state={state} />
          <LiveTelemetryDashboard
            drivers={drivers}
            policy={state?.policy ?? 'UNAVAILABLE'}
            onSelectDriver={onSelectDriver}
          />
          <TrackWeather weather={state?.weather ?? null} />
          <RaceControlFeed events={state?.race_control ?? []} />
        </aside>
      </div>

    </div>
  );
};
