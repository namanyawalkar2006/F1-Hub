import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, MapPin, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { CalendarMeeting } from '../../types';

export const CalendarView: React.FC = () => {
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setMeetings(data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const now = Date.now();

  const toggleExpand = (round: number) => {
    setExpandedRound(prev => prev === round ? null : round);
  };

  const formatSessionTime = (isoString: string | null) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Official Schedule</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            2026 Formula 1 Calendar
          </h1>
        </div>
        <div className="text-xs text-neutral-400 font-timing">
          {meetings.length} Grand Prix weekends • Verified by Jolpica F1
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Loading official race calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.map((m, idx) => {
            const raceDate = new Date(m.race_timestamp);
            const raceEndEst = raceDate.getTime() + 2.5 * 3600 * 1000;
            const isCompleted = now > raceEndEst;

            // Grand Prix weekend window: starts ~2 days before race
            const weekendStartEst = raceDate.getTime() - 2.5 * 24 * 3600 * 1000;
            const isThisWeekend = now >= weekendStartEst && now <= raceEndEst;
            const isExpanded = expandedRound === m.round;

            return (
              <motion.div
                key={m.round}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.4) }}
                whileHover={{ y: -3 }}
                className={`bg-[#0c0c10] border rounded-xl p-5 flex flex-col justify-between transition-colors shadow-lg ${
                  isThisWeekend
                    ? 'border-red-500/60 ring-1 ring-red-500/40 glow-f1-red'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  {/* Top Status Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-timing font-bold text-neutral-500">
                      ROUND {m.round}
                    </span>

                    {isThisWeekend ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        This Weekend
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800/60 text-neutral-400 text-[10px] font-semibold uppercase">
                        <CheckCircle className="w-3 h-3 text-neutral-500" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 text-[10px] font-semibold uppercase">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        Upcoming
                      </span>
                    )}
                  </div>

                  {/* Grand Prix Details */}
                  <h3 className="text-lg font-bold text-neutral-100 uppercase mb-1">
                    {m.race_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>
                      {m.circuit_name}, {m.country}
                    </span>
                  </div>
                </div>

                {/* Timing Summary */}
                <div className="mt-4 pt-3 border-t border-neutral-900/90 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Grand Prix:</span>
                    <span className="font-timing text-neutral-200 font-semibold">
                      {raceDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Start Time:</span>
                    <span className="font-timing text-neutral-300 font-medium">
                      {raceDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} (Your Local Time)
                    </span>
                  </div>

                  {/* Session Schedule Disclosure */}
                  <div className="pt-2">
                    <button
                      onClick={() => toggleExpand(m.round)}
                      aria-expanded={isExpanded}
                      aria-controls={`round-sessions-${m.round}`}
                      className="w-full py-1.5 px-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-900 text-[11px] font-semibold text-neutral-400 hover:text-neutral-200 flex items-center justify-between transition-colors"
                    >
                      <span>All Weekend Sessions</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div id={`round-sessions-${m.round}`} className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-900 text-[11px]">
                        {m.fp1_timestamp && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Practice 1:</span>
                            <span className="font-timing text-neutral-300">{formatSessionTime(m.fp1_timestamp)}</span>
                          </div>
                        )}
                        {m.fp2_timestamp && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Practice 2:</span>
                            <span className="font-timing text-neutral-300">{formatSessionTime(m.fp2_timestamp)}</span>
                          </div>
                        )}
                        {m.fp3_timestamp && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Practice 3:</span>
                            <span className="font-timing text-neutral-300">{formatSessionTime(m.fp3_timestamp)}</span>
                          </div>
                        )}
                        {m.sprint_timestamp && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Sprint:</span>
                            <span className="font-timing text-amber-400">{formatSessionTime(m.sprint_timestamp)}</span>
                          </div>
                        )}
                        {m.qualifying_timestamp && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Qualifying:</span>
                            <span className="font-timing text-neutral-300">{formatSessionTime(m.qualifying_timestamp)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-neutral-500 font-bold">Race:</span>
                          <span className="font-timing text-red-400 font-bold">{formatSessionTime(m.race_timestamp)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
