import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Clock } from 'lucide-react';
import { LastRaceData } from '../../types';
import { getTeamColor } from '../../utils/f1State';

interface QualifyingItem {
  driver_id: string;
  constructor_id: string;
  position: number;
  driver_number: number;
  driver_code: string;
  full_name: string;
  team_name: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
}

interface QualifyingData {
  season: string;
  round: string;
  raceName: string;
  circuitName: string;
  location: string;
  country: string;
  date: string;
  results: QualifyingItem[];
}

interface ResultsViewProps {
  onSelectDriver: (driverRef: string) => void;
  onSelectConstructor: (constructorRef: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ onSelectDriver, onSelectConstructor }) => {
  const [activeTab, setActiveTab] = useState<'RACE' | 'QUALIFYING'>('RACE');
  const [raceData, setRaceData] = useState<LastRaceData | null>(null);
  const [qualifyingData, setQualifyingData] = useState<QualifyingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/results').then(r => r.ok ? r.json() : null),
      fetch('/api/results/qualifying').then(r => r.ok ? r.json() : null),
    ])
      .then(([race, qual]) => {
        if (race) setRaceData(race);
        if (qual) setQualifyingData(qual);
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
            <span>Latest Grand Prix Results</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            {raceData?.raceName || 'Grand Prix Results'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {raceData?.circuitName} • {raceData?.location}, {raceData?.country} • {raceData?.date}
          </p>
        </div>

        {/* Tab Switcher with Motion Pill */}
        <div className="inline-flex p-1 rounded-xl bg-neutral-900 border border-neutral-800 self-start sm:self-auto relative">
          <button
            onClick={() => setActiveTab('RACE')}
            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'RACE' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {activeTab === 'RACE' && (
              <motion.div
                layoutId="activeResultsTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-red-600 rounded-lg -z-10 shadow-md shadow-red-600/30"
              />
            )}
            Race
          </button>
          <button
            onClick={() => setActiveTab('QUALIFYING')}
            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'QUALIFYING' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {activeTab === 'QUALIFYING' && (
              <motion.div
                layoutId="activeResultsTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-red-600 rounded-lg -z-10 shadow-md shadow-red-600/30"
              />
            )}
            Qualifying
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Loading official results...</p>
        </div>
      ) : activeTab === 'RACE' ? (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {raceData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {raceData.results.slice(0, 3).map((r) => {
                const teamColor = getTeamColor(r.team_name);
                return (
                  <div
                    key={r.driver_number}
                    className={`bg-[#0f0f13] border rounded-xl p-5 relative overflow-hidden ${
                      r.position === 1
                        ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                        : 'border-neutral-800/80'
                    }`}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: teamColor }}
                    />
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`font-timing font-extrabold text-2xl ${
                          r.position === 1
                            ? 'text-amber-400'
                            : r.position === 2
                            ? 'text-slate-300'
                            : 'text-amber-600'
                        }`}
                      >
                        P{r.position}
                      </span>
                      <span className="text-xs font-bold font-timing text-neutral-400">
                        +{r.points} PTS
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectDriver(r.driver_code || r.driver_id)}
                      className="mb-0.5 block cursor-pointer text-left text-lg font-bold text-white hover:text-red-300"
                    >
                      {r.full_name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectConstructor(r.constructor_id || r.team_name)}
                      className="mb-3 block cursor-pointer text-left text-xs text-neutral-400 hover:text-white"
                    >
                      {r.team_name}
                    </button>

                    <div className="pt-3 border-t border-neutral-900 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Time / Gap:</span>
                      <span className="font-timing text-neutral-200 font-medium">
                        {r.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Classification Table */}
          <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4 w-16">Pos</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4 text-center hidden sm:table-cell">Grid</th>
                    <th className="py-3 px-4 text-center hidden sm:table-cell">Laps</th>
                    <th className="py-3 px-4 text-right">Time / Gap</th>
                    <th className="py-3 px-4 text-right">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/50">
                  {raceData?.results.map((r) => {
                    const teamColor = getTeamColor(r.team_name);
                    const isFastestLap = r.fastest_lap?.rank === 1;

                    return (
                      <tr
                        key={r.driver_number}
                        className="hover:bg-neutral-900/40 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`font-timing font-bold text-sm ${
                              r.position === 1
                                ? 'text-amber-400 font-extrabold'
                                : r.position === 2
                                ? 'text-slate-300'
                                : r.position === 3
                                ? 'text-amber-600'
                                : 'text-neutral-300'
                            }`}
                          >
                            {r.position}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-1 h-6 rounded-full flex-shrink-0"
                              style={{ backgroundColor: teamColor }}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onSelectDriver(r.driver_code || r.driver_id)}
                                className="cursor-pointer font-bold text-sm text-neutral-100 hover:text-red-300"
                              >
                                {r.full_name}
                              </button>
                              {isFastestLap && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                  title="Fastest Lap of the Race"
                                >
                                  <Zap className="w-2.5 h-2.5 text-purple-400" />
                                  FL
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-xs text-neutral-300">
                          <button
                            type="button"
                            onClick={() => onSelectConstructor(r.constructor_id || r.team_name)}
                            className="cursor-pointer hover:text-white"
                          >
                            {r.team_name}
                          </button>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-center text-xs font-timing text-neutral-400 hidden sm:table-cell">
                          {r.grid > 0 ? r.grid : 'Pit'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-center text-xs font-timing text-neutral-400 hidden sm:table-cell">
                          {r.laps}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right text-xs font-timing text-neutral-200">
                          {r.time}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <span className="font-timing font-bold text-sm text-neutral-100">
                            {r.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Qualifying Table */
        <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4 w-16">Pos</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-right">Q1</th>
                  <th className="py-3 px-4 text-right">Q2</th>
                  <th className="py-3 px-4 text-right">Q3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50">
                {qualifyingData?.results.map((q) => {
                  const teamColor = getTeamColor(q.team_name);
                  return (
                    <tr
                      key={q.driver_number}
                      className="hover:bg-neutral-900/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-timing font-bold text-sm ${
                            q.position === 1
                              ? 'text-amber-400 font-extrabold'
                              : 'text-neutral-300'
                          }`}
                        >
                          {q.position}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-6 rounded-full flex-shrink-0"
                            style={{ backgroundColor: teamColor }}
                          />
                          <button
                            type="button"
                            onClick={() => onSelectDriver(q.driver_code || q.driver_id)}
                            className="cursor-pointer font-bold text-sm text-neutral-100 hover:text-red-300"
                          >
                            {q.full_name}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs text-neutral-300">
                        <button
                          type="button"
                          onClick={() => onSelectConstructor(q.constructor_id || q.team_name)}
                          className="cursor-pointer hover:text-white"
                        >
                          {q.team_name}
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-timing text-xs text-neutral-400">
                        {q.q1 || '—'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-timing text-xs text-neutral-400">
                        {q.q2 || '—'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-timing text-xs text-neutral-200 font-medium">
                        {q.q3 || '—'}
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
