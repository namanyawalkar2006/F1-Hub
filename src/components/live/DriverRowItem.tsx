import React from 'react';
import { motion } from 'motion/react';
import { DriverRow } from '../../types';
import { formatLapTime, getTeamColor } from '../../utils/f1State';
import { TyreBadge } from './TyreBadge';
import { TeamLogo } from '../common/TeamLogo';

interface DriverRowItemProps {
  driver: DriverRow;
  onSelectDriver: (driverRef: string) => void;
  onSelectConstructor: (constructorRef: string) => void;
}

export const DriverRowItem: React.FC<DriverRowItemProps> = ({
  driver,
  onSelectDriver,
  onSelectConstructor,
}) => {
  const teamColor = getTeamColor(driver.team_name, driver.team_colour);
  const formatSectorTime = (time: number | null) =>
    time !== null && Number.isFinite(time) && time > 0 ? time.toFixed(3) : '—';

  // Position change indicator
  const renderPosChange = () => {
    if (driver.position_change > 0) {
      return (
        <span className="text-[11px] font-bold text-emerald-400 flex items-center" title={`Gained ${driver.position_change} pos`}>
          ▲{driver.position_change}
        </span>
      );
    }
    if (driver.position_change < 0) {
      return (
        <span className="text-[11px] font-bold text-rose-400 flex items-center" title={`Lost ${Math.abs(driver.position_change)} pos`}>
          ▼{Math.abs(driver.position_change)}
        </span>
      );
    }
    return <span className="text-neutral-600 text-xs">—</span>;
  };

  return (
    <motion.tr
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className={`border-b border-neutral-900/80 hover:bg-neutral-900/40 transition-colors ${
        driver.position !== null && driver.position <= 3 ? 'bg-neutral-950/60' : 'bg-transparent'
      }`}
    >
      {/* Position */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className={`font-timing font-bold text-sm w-6 text-center ${
              driver.position === 1
                ? 'text-amber-400 font-extrabold'
                : driver.position === 2
                ? 'text-slate-300'
                : driver.position === 3
                ? 'text-amber-600'
                : 'text-neutral-300'
            }`}
          >
            {driver.position ?? '—'}
          </span>
          <div className="w-5 text-center flex justify-center">
            {renderPosChange()}
          </div>
        </div>
      </td>

      {/* Driver & Team */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {/* Team Color Vertical Stripe */}
          <div
            className="w-1 h-7 rounded-full flex-shrink-0"
            style={{ backgroundColor: teamColor }}
          />
          {/* Authentic Constructor Crest */}
          <TeamLogo teamName={driver.team_name} size="sm" className="hidden sm:inline-flex" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectDriver(driver.name_acronym === '—' ? String(driver.driver_number) : driver.name_acronym)}
                aria-label={`View ${driver.full_name} driver profile`}
                className="cursor-pointer font-racing text-sm font-bold tracking-wider text-neutral-100 hover:text-red-300"
              >
                {driver.name_acronym}
              </button>
              <span className="text-xs font-timing text-neutral-500 font-medium">
                #{driver.driver_number}
              </span>
              {driver.pit_status === 'IN_PIT' && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  PIT
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectConstructor(driver.team_name)}
              aria-label={`View ${driver.team_name} constructor profile`}
              className="max-w-[140px] cursor-pointer truncate text-left text-[11px] text-neutral-400 hover:text-white md:max-w-[200px]"
            >
              {driver.team_name}
            </button>
          </div>
        </div>
      </td>

      {/* Gap */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span
          className={`font-timing text-sm ${
            driver.gap === 'LEADER'
              ? 'text-amber-400 font-semibold'
              : 'text-neutral-200'
          }`}
        >
          {driver.gap ?? '—'}
        </span>
      </td>

      {/* Interval */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden sm:table-cell">
        <span className="font-timing text-sm text-neutral-400">
          {driver.interval ?? '—'}
        </span>
      </td>

      {/* Tyre & Age */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <TyreBadge compound={driver.tyre_compound} age={driver.tyre_age} />
          {driver.stint && driver.stint > 1 && (
            <span className="text-[10px] text-neutral-500 uppercase">
              S{driver.stint}
            </span>
          )}
        </div>
      </td>

      {/* Last Lap */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden md:table-cell">
        <span className="font-timing text-xs text-neutral-300">
          {formatLapTime(driver.last_lap_time)}
        </span>
      </td>

      {/* Sector times */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden md:table-cell">
        <span className="font-timing text-xs text-neutral-300">{formatSectorTime(driver.sector_1_time)}</span>
      </td>
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden md:table-cell">
        <span className="font-timing text-xs text-neutral-300">{formatSectorTime(driver.sector_2_time)}</span>
      </td>
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden md:table-cell">
        <span className="font-timing text-xs text-neutral-300">{formatSectorTime(driver.sector_3_time)}</span>
      </td>

      {/* Pit Stops Count */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap hidden lg:table-cell">
        <span className="font-timing text-xs text-neutral-400">
          {driver.pit_count > 0 ? driver.pit_count : '0'}
        </span>
      </td>
    </motion.tr>
  );
};
