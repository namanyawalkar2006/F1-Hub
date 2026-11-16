import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, RefreshCw, Archive, Radio } from 'lucide-react';
import { LiveState } from '../../types';

interface LiveHeaderProps {
  state: LiveState | null;
  selectedSessionKey: number | null;
  onSelectSession?: (sessionKey: number | null) => void;
  onRefresh?: () => void;
}

interface HistoricalSessionOption {
  session_key: number;
  session_name: string;
  session_type: string;
}

export const LiveHeader: React.FC<LiveHeaderProps> = ({ state, selectedSessionKey, onSelectSession, onRefresh }) => {
  const [sessions, setSessions] = useState<HistoricalSessionOption[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetch('/api/historical-sessions')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setSessions(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const isLive = state?.policy === 'LIVE' && state.is_authorized_live_feed;
  const isHistorical = state?.policy === 'HISTORICAL';
  const session = state?.session;
  const currentKey = selectedSessionKey;
  const verifiedAt = state?.last_verified_timestamp
    ? new Date(state.last_verified_timestamp).toLocaleTimeString('en-GB', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : null;
  const timestampLabel = isHistorical ? 'Recorded data time' : isLive ? 'Live source updated' : 'Last source time';

  return (
    <div className="bg-gradient-to-br from-[#0c0c10] to-[#121218] border border-neutral-800 rounded-2xl p-4 md:p-6 mb-6 shadow-2xl glow-f1-red">
      {/* Top Bar: Policy Pill, Meeting Name, Lap Counter & Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Policy Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-neutral-800 text-xs font-bold uppercase tracking-wider">
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400">● LIVE TIMING</span>
              </>
            ) : isHistorical ? (
              <>
                <Archive className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-400 font-extrabold">HISTORICAL REPLAY</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-300">TIMING STANDBY</span>
              </>
            )}
          </div>

          {/* Grand Prix & Session Name */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white">
              {session?.meeting_name ?? 'Formula 1 Grand Prix'}
            </h1>
            <span className="text-neutral-500 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-red-500">
              {session?.session_name ?? 'Session'}
            </span>
          </div>
        </div>

        {/* Right side: Lap Counter & Refresh */}
        <div className="flex items-center gap-3">
          {/* Lap Counter if recorded */}
          {session?.current_lap && (
            <div className="px-3.5 py-1.5 rounded-lg bg-black/60 border border-neutral-800 font-timing text-sm">
              <span className="text-neutral-400 mr-1.5 uppercase text-xs font-sans font-medium">Lap</span>
              <span className="font-bold text-white">{session.current_lap}</span>
              {session?.total_laps && (
                <span className="text-neutral-500"> / {session.total_laps}</span>
              )}
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            aria-label="Refresh session state"
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh session state"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interactive Quick-Switch Session Buttons */}
      <div className="pt-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mr-1 whitespace-nowrap">
            Select Session:
          </span>

          {/* Default Live/Current Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectSession?.(null)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative cursor-pointer ${
              currentKey === null
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-400/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            ● Live Track
          </motion.button>

          {/* Grand Prix Weekend Sessions (Practice 1, 2, 3, Quali, Race) */}
          {sessions.map((s) => {
            const isSelected = currentKey === s.session_key;
            return (
              <motion.button
                key={s.session_key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectSession?.(s.session_key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-400/40'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>{s.session_name}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sub Bar: Policy Message Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`font-bold uppercase tracking-wider px-2.5 py-1 rounded border text-[11px] ${
              isLive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isHistorical
                ? 'bg-red-950/40 text-red-300 border-red-600/40'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
            }`}
          >
            {state?.status_banner || 'STATUS CHECK'}
          </span>
          <span className="text-neutral-400 text-xs truncate max-w-lg">
            {state?.status_message}
          </span>
        </div>

        {/* Last Verified Timestamp */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-timing">
          <Activity className="w-3.5 h-3.5 text-red-500" />
          <span>
            {verifiedAt ? `${timestampLabel}: ${verifiedAt} UTC` : 'No source timestamp received'}
          </span>
        </div>
      </div>
    </div>
  );
};
