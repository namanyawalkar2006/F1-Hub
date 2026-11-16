import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Play, RotateCcw, Award, CheckCircle2 } from 'lucide-react';

export const F1StartGantry: React.FC = () => {
  const [lightsCount, setLightsCount] = useState<number>(0);
  const [isLightsOut, setIsLightsOut] = useState<boolean>(false);
  const [isSequenceRunning, setIsSequenceRunning] = useState<boolean>(false);
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
  const [isFalseStart, setIsFalseStart] = useState<boolean>(false);
  const lightsOutTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timerRef.current.forEach(t => clearTimeout(t));
    timerRef.current = [];
  };

  const startSequence = () => {
    clearAllTimers();
    setLightsCount(0);
    setIsLightsOut(false);
    setIsFalseStart(false);
    setReactionTimeMs(null);
    setIsSequenceRunning(true);
    lightsOutTimeRef.current = null;

    // Light up 1 through 5, one per 1000ms
    for (let i = 1; i <= 5; i++) {
      const t = setTimeout(() => {
        setLightsCount(i);
      }, i * 1000);
      timerRef.current.push(t);
    }

    // Randomized pause between 1.2s and 3.0s after 5th light (authentic FIA timing)
    const randomPause = 1200 + Math.random() * 1800;
    const lightsOutTimer = setTimeout(() => {
      setLightsCount(0);
      setIsLightsOut(true);
      lightsOutTimeRef.current = Date.now();
    }, 5000 + randomPause);
    timerRef.current.push(lightsOutTimer);
  };

  const handleTap = () => {
    if (!isSequenceRunning) {
      startSequence();
      return;
    }

    if (!isLightsOut) {
      // False start / Jump start!
      clearAllTimers();
      setIsFalseStart(true);
      setIsSequenceRunning(false);
      setLightsCount(5);
      return;
    }

    if (lightsOutTimeRef.current && reactionTimeMs === null) {
      const diff = Date.now() - lightsOutTimeRef.current;
      setReactionTimeMs(diff);
      setIsSequenceRunning(false);
    }
  };

  useEffect(() => {
    // Run initial animation once
    startSequence();
    return () => clearAllTimers();
  }, []);

  const getReactionVerdict = (ms: number) => {
    if (ms < 180) return { label: 'ALIEN REFLEXES! (F1 Champion Speed)', color: 'text-purple-400' };
    if (ms < 240) return { label: 'WORLD CHAMPION LEVEL (0.2s Benchmark)', color: 'text-emerald-400' };
    if (ms < 320) return { label: 'EXCELLENT START (Grand Prix Driver)', color: 'text-emerald-300' };
    if (ms < 420) return { label: 'SOLID REACTION (Paddock Approved)', color: 'text-amber-300' };
    return { label: 'SLOW OFF THE LINE (Lost 2 Positions)', color: 'text-rose-400' };
  };

  return (
    <div className="bg-gradient-to-br from-[#0c0c10] via-[#111118] to-[#09090c] border border-neutral-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden group">
      {/* Background carbon texture glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,21,20,0.15),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-neutral-800 relative z-10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-500 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">
            FIA Starting Lights Gantry
          </h3>
          <span className="text-[10px] font-timing font-extrabold px-2 py-0.5 rounded bg-red-950/60 border border-red-600/40 text-red-400">
            F1 BROADCAST
          </span>
        </div>

        <div className="text-[11px] text-neutral-400 font-medium font-timing">
          Click or Tap below to test launch reaction time
        </div>
      </div>

      {/* Main Interactive Gantry Stage */}
      <div
        onClick={handleTap}
        className="cursor-pointer select-none py-6 px-3 sm:px-8 rounded-xl bg-black/90 border border-neutral-800 hover:border-red-500/40 transition-all flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Starting Gantry Frame */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-5 mb-5 p-3 sm:p-4 rounded-xl bg-neutral-950 border border-neutral-800 shadow-inner">
          {[1, 2, 3, 4, 5].map((col) => {
            const isColumnLit = lightsCount >= col && !isLightsOut;
            return (
              <div
                key={col}
                className="flex flex-col items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-neutral-900 border border-neutral-800 shadow-md"
              >
                {/* Upper Red Lamp */}
                <div
                  className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full transition-all duration-100 ${
                    isColumnLit
                      ? 'bg-red-600 shadow-[0_0_18px_rgba(212,21,20,1),0_0_35px_rgba(212,21,20,0.7)] border-2 border-red-300'
                      : 'bg-neutral-950 border border-neutral-800'
                  }`}
                />
                {/* Lower Red Lamp */}
                <div
                  className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full transition-all duration-100 ${
                    isColumnLit
                      ? 'bg-red-600 shadow-[0_0_18px_rgba(212,21,20,1),0_0_35px_rgba(212,21,20,0.7)] border-2 border-red-300'
                      : 'bg-neutral-950 border border-neutral-800'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Status Message / Lights Out Banner */}
        <div className="min-h-[56px] flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {isFalseStart ? (
              <motion.div
                key="false-start"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-rose-500 font-black uppercase text-base sm:text-xl tracking-wider flex items-center gap-2 font-racing"
              >
                <span>⚠️ FALSE START! 5-SECOND TIME PENALTY</span>
              </motion.div>
            ) : isLightsOut && reactionTimeMs === null ? (
              <motion.div
                key="lights-out"
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="text-emerald-400 font-black uppercase text-lg sm:text-2xl tracking-widest font-racing drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]"
              >
                LIGHTS OUT AND AWAY WE GO! 🏁
              </motion.div>
            ) : reactionTimeMs !== null ? (
              <motion.div
                key="result"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-black font-timing text-white">
                    {reactionTimeMs} ms
                  </span>
                  <span className="text-xs text-neutral-400 font-timing">
                    ({(reactionTimeMs / 1000).toFixed(3)}s)
                  </span>
                </div>
                <span className={`text-xs font-black uppercase tracking-wider ${getReactionVerdict(reactionTimeMs).color}`}>
                  {getReactionVerdict(reactionTimeMs).label}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 font-timing"
              >
                {lightsCount === 0
                  ? 'Click anywhere to begin 5-light starting sequence'
                  : `Light ${lightsCount} of 5 active... Prepare for launch!`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Controls */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startSequence();
            }}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
            <span>Restart Sequence</span>
          </button>
        </div>
      </div>
    </div>
  );
};
