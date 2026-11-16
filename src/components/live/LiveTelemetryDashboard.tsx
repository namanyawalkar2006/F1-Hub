import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Archive, Gauge, Radio } from 'lucide-react';
import { DataFreshnessPolicy, DriverRow } from '../../types';
import { formatLapTime } from '../../utils/f1State';
import { TeamLogo } from '../common/TeamLogo';

interface LiveTelemetryDashboardProps {
  drivers: DriverRow[];
  policy: DataFreshnessPolicy;
  onSelectDriver: (driverRef: string) => void;
}

export const LiveTelemetryDashboard: React.FC<LiveTelemetryDashboardProps> = ({
  drivers,
  policy,
  onSelectDriver,
}) => {
  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const activeDriver = drivers.find((driver) => driver.driver_number === selectedDriverNumber) ?? drivers[0] ?? null;
  const isHistorical = policy === 'HISTORICAL';

  useEffect(() => {
    if (selectedDriverNumber !== null && !drivers.some((driver) => driver.driver_number === selectedDriverNumber)) {
      setSelectedDriverNumber(null);
    }
  }, [drivers, selectedDriverNumber]);

  const rows = activeDriver
    ? [
        ['Position', activeDriver.position === null ? '—' : `P${activeDriver.position}`],
        ['Gap', activeDriver.gap ?? '—'],
        ['Interval', activeDriver.interval ?? '—'],
        ['Last lap', formatLapTime(activeDriver.last_lap_time)],
        ['Best lap', formatLapTime(activeDriver.best_lap_time)],
        ['Tyre', activeDriver.tyre_compound === 'UNKNOWN' ? '—' : activeDriver.tyre_compound],
        ['Tyre age', activeDriver.tyre_age === null ? '—' : `${activeDriver.tyre_age} LAPS`],
        ['Pit stops', String(activeDriver.pit_count)],
      ]
    : [];

  return (
    <section className="overflow-hidden border border-neutral-800 bg-[#0b0b10]">
      <div className="h-0.5 bg-red-600" />
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-neutral-500">
            {isHistorical ? <Archive className="h-3 w-3 text-amber-400" /> : <Radio className="h-3 w-3 text-red-500" />}
            {isHistorical ? 'CAR TELEMETRY · RECORDED DATA' : 'CAR TELEMETRY · SOURCE DATA'}
          </div>
          <h2 className="font-racing text-base font-black uppercase italic tracking-wide text-white">Onboard data</h2>
        </div>
        <Gauge className="h-4 w-4 text-red-500" />
      </div>

      {activeDriver ? (
        <motion.div
          key={activeDriver.driver_number}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="p-4"
        >
          <div className="mb-4 flex items-center gap-3">
            <TeamLogo teamName={activeDriver.team_name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-racing text-lg font-black uppercase italic text-white">
                {activeDriver.full_name}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wider text-neutral-500">
                {activeDriver.team_name} · #{activeDriver.driver_number}
              </p>
            </div>
            <span className="font-racing text-2xl font-black italic text-white">
              {activeDriver.position === null ? '—' : `P${activeDriver.position}`}
            </span>
          </div>

          {drivers.length > 1 && (
            <label className="mb-3 block">
              <span className="sr-only">Select driver for onboard data</span>
              <select
                value={activeDriver.driver_number}
                onChange={(event) => setSelectedDriverNumber(Number(event.target.value))}
                className="w-full rounded border border-neutral-800 bg-black px-2.5 py-2 text-xs text-neutral-200 focus:border-red-500 focus:outline-none"
              >
                {drivers.map((driver) => (
                  <option key={driver.driver_number} value={driver.driver_number}>
                    {driver.name_acronym} · {driver.full_name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-px border border-neutral-800 bg-neutral-800">
            {rows.map(([label, value]) => (
              <div key={label} className="min-w-0 bg-[#0b0b10] px-2.5 py-2">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-neutral-500">{label}</p>
                <p className="mt-1 truncate font-timing text-xs font-bold text-neutral-100">{value}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onSelectDriver(activeDriver.name_acronym === '—' ? String(activeDriver.driver_number) : activeDriver.name_acronym)}
            className="mt-3 w-full border border-neutral-800 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-neutral-400 transition-colors hover:border-red-500/60 hover:text-white"
          >
            Open driver profile
          </button>
        </motion.div>
      ) : (
        <div className="flex min-h-40 items-center justify-center px-6 text-center">
          <p className="max-w-xs text-[11px] leading-relaxed text-neutral-500">
            No onboard timing records were received for this session. Missing values are not estimated.
          </p>
        </div>
      )}
    </section>
  );
};
