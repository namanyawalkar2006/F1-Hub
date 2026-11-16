import React from 'react';
import { Archive, Radio } from 'lucide-react';
import { DataFreshnessPolicy, DriverRow } from '../../types';
import { DriverRowItem } from './DriverRowItem';

interface LiveTimingTableProps {
  drivers: DriverRow[];
  isLoading?: boolean;
  policy: DataFreshnessPolicy;
  onSelectDriver: (driverRef: string) => void;
  onSelectConstructor: (constructorRef: string) => void;
}

export const LiveTimingTable: React.FC<LiveTimingTableProps> = ({
  drivers,
  isLoading = false,
  policy,
  onSelectDriver,
  onSelectConstructor,
}) => {
  const isHistorical = policy === 'HISTORICAL';
  const sourceLabel = isHistorical
    ? 'RECORDED SESSION'
    : policy === 'LIVE'
      ? 'LIVE SOURCE'
      : policy === 'STALE'
        ? 'DELAYED SOURCE'
        : 'WAITING FOR SOURCE';

  return (
    <section className="overflow-hidden border border-neutral-800 bg-[#0b0b10]">
      <div className="h-0.5 bg-red-600" />
      <div className="flex flex-col gap-2 border-b border-neutral-800 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.28em] text-neutral-500">
            {isHistorical ? <Archive className="h-3 w-3 text-amber-400" /> : <Radio className="h-3 w-3 text-red-500" />}
            CLASSIFICATION · {sourceLabel}
          </div>
          <h2 className="font-racing text-lg font-black uppercase italic tracking-wide text-white">Timing tower</h2>
        </div>
        <span className="font-timing text-[10px] uppercase tracking-wider text-neutral-500">
          {isLoading ? 'LOADING SESSION DATA' : `${drivers.length} DRIVER RECORDS`}
        </span>
      </div>

      <div className="px-3 py-1.5 text-[9px] font-timing uppercase tracking-wider text-neutral-500 sm:hidden">
        Swipe horizontally to view sector times and tyre data
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-y border-neutral-800 bg-black/40 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">
              <th className="px-3 py-2.5">Pos</th>
              <th className="px-3 py-2.5">Driver</th>
              <th className="px-3 py-2.5 text-right">Gap</th>
              <th className="px-3 py-2.5 text-right">Int</th>
              <th className="px-3 py-2.5 text-right">Last</th>
              <th className="px-3 py-2.5 text-right">S1</th>
              <th className="px-3 py-2.5 text-right">S2</th>
              <th className="px-3 py-2.5 text-right">S3</th>
              <th className="px-3 py-2.5">Tyre</th>
              <th className="px-3 py-2.5 text-center">Pit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {drivers.length > 0 ? drivers.map((driver) => (
              <DriverRowItem
                key={driver.driver_number}
                driver={driver}
                onSelectDriver={onSelectDriver}
                onSelectConstructor={onSelectConstructor}
              />
            )) : (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    {isLoading ? 'Loading selected session' : 'No timing rows received'}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-500">
                    {isLoading
                      ? 'Waiting for the data provider response.'
                      : 'The selected source has not supplied a classification for this session.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
