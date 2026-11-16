import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Flag, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RaceControlEvent {
  date: string;
  category: string;
  flag: string | null;
  message: string;
  lap_number: number | null;
}

interface RaceControlFeedProps {
  events: RaceControlEvent[];
}

export const RaceControlFeed: React.FC<RaceControlFeedProps> = ({ events }) => {
  const getFlagBadge = (flag: string | null, message: string) => {
    const upperMsg = (message || '').toUpperCase();
    if (flag === 'RED' || upperMsg.includes('RED FLAG')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
          <Flag className="w-3 h-3 fill-red-500 text-red-500" />
          Red Flag
        </span>
      );
    }
    if (flag === 'YELLOW' || upperMsg.includes('YELLOW')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
          <Flag className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          Yellow
        </span>
      );
    }
    if (upperMsg.includes('SAFETY CAR') || upperMsg.includes('VSC')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          Safety Car
        </span>
      );
    }
    if (flag === 'GREEN' || upperMsg.includes('GREEN')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Green
        </span>
      );
    }
    if (flag === 'CHEQUERED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-200/20 text-neutral-200 border border-neutral-400">
          🏁 Finish
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
        <AlertTriangle className="w-3 h-3" />
        Notice
      </span>
    );
  };

  const formatUtcTime = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-xl p-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Race Control
          </h3>
        </div>
        <span className="text-[11px] text-neutral-500 font-timing">
          {events.length} messages
        </span>
      </div>

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-xs">
            No race-control messages received for this session.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((evt, idx) => (
              <motion.div
                key={`${evt.date}-${idx}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-neutral-900/40 border border-neutral-800/60"
              >
                <div className="flex flex-col items-start gap-1 flex-shrink-0">
                  {getFlagBadge(evt.flag, evt.message)}
                  <span className="text-[10px] font-timing text-neutral-500">
                    {formatUtcTime(evt.date)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {evt.lap_number && (
                      <span className="text-[10px] font-timing font-bold text-neutral-400">
                        L{evt.lap_number}
                      </span>
                    )}
                    <p className="text-neutral-200 text-xs leading-relaxed font-medium">
                      {evt.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
