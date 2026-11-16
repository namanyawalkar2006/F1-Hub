import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flag } from 'lucide-react';
import { DriverStanding, ConstructorStanding } from '../../types';
import { getTeamColor } from '../../utils/f1State';

interface StandingsViewProps {
  initialTab?: 'DRIVERS' | 'CONSTRUCTORS';
  onSelectDriver: (driverRef: string) => void;
  onSelectConstructor: (constructorRef: string) => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  initialTab = 'DRIVERS',
  onSelectDriver,
  onSelectConstructor,
}) => {
  const [activeTab, setActiveTab] = useState<'DRIVERS' | 'CONSTRUCTORS'>(initialTab);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [season, setSeason] = useState('2026');

  useEffect(() => {
    fetch('/api/standings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDrivers(data.drivers || []);
          setConstructors(data.constructors || []);
          if (data.season) setSeason(data.season);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 mb-1">
            <Trophy className="w-4 h-4" />
            <span>{season} World Championship</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Official Standings
          </h1>
        </div>

        {/* Tab Switcher with Motion Pill */}
        <div className="inline-flex p-1 rounded-xl bg-neutral-900 border border-neutral-800 self-start sm:self-auto relative">
          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'DRIVERS' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {activeTab === 'DRIVERS' && (
              <motion.div
                layoutId="activeStandingsTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-red-600 rounded-lg -z-10 shadow-md shadow-red-600/30"
              />
            )}
            Drivers
          </button>
          <button
            onClick={() => setActiveTab('CONSTRUCTORS')}
            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'CONSTRUCTORS' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {activeTab === 'CONSTRUCTORS' && (
              <motion.div
                layoutId="activeStandingsTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-red-600 rounded-lg -z-10 shadow-md shadow-red-600/30"
              />
            )}
            Constructors
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Loading official championship standings...</p>
        </div>
      ) : activeTab === 'DRIVERS' ? (
        /* Driver Standings Table */
        <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4 w-16">Pos</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">Wins</th>
                  <th className="py-3 px-4 text-right">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50">
                {drivers.map((d) => {
                  const teamColor = getTeamColor(d.team_name);
                  return (
                    <tr
                      key={d.driver_number || d.position}
                      className="hover:bg-neutral-900/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-timing font-bold text-sm ${
                            d.position === 1
                              ? 'text-amber-400 font-extrabold'
                              : d.position === 2
                              ? 'text-slate-300'
                              : d.position === 3
                              ? 'text-amber-600'
                              : 'text-neutral-300'
                          }`}
                        >
                          {d.position}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-6 rounded-full flex-shrink-0"
                            style={{ backgroundColor: teamColor }}
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => onSelectDriver(d.driver_code || d.driver_id)}
                              aria-label={`View ${d.full_name} driver profile`}
                              className="font-bold text-sm text-neutral-100 hover:text-red-300 transition-colors cursor-pointer"
                            >
                              {d.full_name}
                            </button>
                            <span className="text-xs font-timing text-neutral-500 ml-2">
                              {d.driver_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs text-neutral-300">
                        <button
                          type="button"
                          onClick={() => onSelectConstructor(d.constructor_id || d.team_name)}
                          aria-label={`View ${d.team_name} constructor profile`}
                          className="cursor-pointer hover:text-white"
                        >
                          {d.team_name}
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center text-xs font-timing text-neutral-400 hidden sm:table-cell">
                        {d.wins}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <span className="font-timing font-bold text-sm text-neutral-100">
                          {d.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Constructor Standings Table */
        <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4 w-16">Pos</th>
                  <th className="py-3 px-4">Constructor</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">Wins</th>
                  <th className="py-3 px-4 text-right">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50">
                {constructors.map((c) => {
                  const teamColor = getTeamColor(c.team_name);
                  return (
                    <tr
                      key={c.team_name}
                      className="hover:bg-neutral-900/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-timing font-bold text-sm ${
                            c.position === 1
                              ? 'text-amber-400 font-extrabold'
                              : c.position === 2
                              ? 'text-slate-300'
                              : c.position === 3
                              ? 'text-amber-600'
                              : 'text-neutral-300'
                          }`}
                        >
                          {c.position}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1.5 h-6 rounded-full flex-shrink-0"
                            style={{ backgroundColor: teamColor }}
                          />
                          <button
                            type="button"
                            onClick={() => onSelectConstructor(c.constructor_id || c.team_name)}
                            aria-label={`View ${c.team_name} constructor profile`}
                            className="cursor-pointer font-bold text-sm text-neutral-100 hover:text-red-300"
                          >
                            {c.team_name}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center text-xs font-timing text-neutral-400 hidden sm:table-cell">
                        {c.wins}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <span className="font-timing font-bold text-sm text-neutral-100">
                          {c.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
