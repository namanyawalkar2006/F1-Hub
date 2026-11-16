import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gauge, Zap, Radio, ChevronRight, Activity } from 'lucide-react';

export const F1TelemetryHUD: React.FC = () => {
  const [rpm, setRpm] = useState<number>(11400);
  const [gear, setGear] = useState<number>(7);
  const [speed, setSpeed] = useState<number>(318);
  const [throttle, setThrottle] = useState<number>(98);
  const [brake, setBrake] = useState<number>(0);
  const [drsActive, setDrsActive] = useState<boolean>(true);

  // Dynamic rev & telemetry simulation for that genuine F1 TV broadcast vibe
  useEffect(() => {
    let currentGear = 7;
    let currentSpeed = 312;
    let currentRpm = 11200;

    const interval = setInterval(() => {
      // Fluctuate speed and rpm
      currentRpm += Math.floor(Math.random() * 260) - 80;
      if (currentRpm > 13200) {
        // Shift up or rev limit
        if (currentGear < 8) {
          currentGear += 1;
          currentRpm = 10800;
        } else {
          currentRpm = 13100;
        }
      } else if (currentRpm < 9800 && currentGear > 6) {
        currentGear -= 1;
        currentRpm = 12400;
      }

      currentSpeed = Math.floor(280 + (currentRpm / 13500) * 65);
      setGear(currentGear);
      setRpm(currentRpm);
      setSpeed(currentSpeed);
      setThrottle(Math.min(100, Math.floor(92 + Math.random() * 8)));
      setBrake(Math.random() > 0.85 ? Math.floor(Math.random() * 45) : 0);
      setDrsActive(currentSpeed > 305);
    }, 280);

    return () => clearInterval(interval);
  }, []);

  const rpmPercent = Math.min(100, Math.max(0, ((rpm - 4000) / (13500 - 4000)) * 100));
  const isRevLimiter = rpm > 12800;

  return (
    <div className="bg-gradient-to-br from-[#0c0c10] to-[#121218] border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden glow-f1-red">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-white">
            Broadcast Telemetry HUD
          </span>
          <span className="text-[10px] font-timing font-bold px-2 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-red-400">
            SPEED TRAP LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md border flex items-center gap-1 ${
            drsActive 
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse'
              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
          }`}>
            <Zap className="w-3 h-3" />
            {drsActive ? 'DRS ENABLED' : 'DRS STANDBY'}
          </span>
        </div>
      </div>

      {/* Main Tachometer / Halo Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Speed & Gear Display */}
        <div className="flex items-center justify-center sm:justify-start gap-4 p-3 rounded-xl bg-black/60 border border-neutral-800/80">
          {/* Gear Box */}
          <div className="w-14 h-16 rounded-xl bg-gradient-to-b from-neutral-900 to-black border border-neutral-700 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold font-sans">GEAR</span>
            <span className="text-3xl font-black font-timing text-white leading-none">
              {gear}
            </span>
            {isRevLimiter && (
              <span className="absolute bottom-0 inset-x-0 h-1 bg-purple-500 animate-ping" />
            )}
          </div>

          {/* Speed Km/h */}
          <div>
            <div className="flex items-baseline gap-1.5 font-timing">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {speed}
              </span>
              <span className="text-xs uppercase font-extrabold text-neutral-400">KM/H</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-timing uppercase">
              {Math.round(speed * 0.621371)} MPH • PIT SPEED: 80
            </div>
          </div>
        </div>

        {/* Tachometer RPM LED Bar */}
        <div className="p-3 rounded-xl bg-black/60 border border-neutral-800/80 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-timing">
            <span className="text-neutral-400 font-bold">POWER UNIT RPM</span>
            <span className={`font-black ${isRevLimiter ? 'text-purple-400 animate-pulse' : 'text-neutral-200'}`}>
              {rpm.toLocaleString()} / 13,500
            </span>
          </div>

          {/* Multi-Segment RPM LED Bar */}
          <div className="h-3.5 rounded-lg bg-neutral-900 p-0.5 flex gap-0.5 overflow-hidden border border-neutral-800">
            {Array.from({ length: 24 }).map((_, idx) => {
              const segmentPct = (idx / 24) * 100;
              const isLit = rpmPercent >= segmentPct;
              let color = 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]';
              if (idx >= 16 && idx < 20) color = 'bg-red-500 shadow-[0_0_6px_rgba(212,21,20,0.8)]';
              if (idx >= 20) color = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,1)]';

              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-sm transition-all duration-75 ${
                    isLit ? color : 'bg-neutral-950/80 opacity-30'
                  }`}
                />
              );
            })}
          </div>

          {/* Throttle & Brake Meters */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-timing text-[10px]">
            <div>
              <div className="flex justify-between text-neutral-400 mb-0.5">
                <span>THROTTLE</span>
                <span className="text-emerald-400 font-bold">{throttle}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${throttle}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-neutral-400 mb-0.5">
                <span>BRAKE</span>
                <span className="text-rose-400 font-bold">{brake}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-150"
                  style={{ width: `${brake}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Micro-Sector Splits */}
        <div className="p-3 rounded-xl bg-black/60 border border-neutral-800/80 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-timing font-bold">
            <span className="text-neutral-400 uppercase">SECTOR DELTAS</span>
            <span className="text-purple-400">SESSION FASTEST</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center font-timing">
            <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-500/40">
              <span className="text-[9px] text-purple-300 block font-sans font-bold">SEC 1</span>
              <span className="text-xs font-black text-purple-300">28.140</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-[9px] text-emerald-300 block font-sans font-bold">SEC 2</span>
              <span className="text-xs font-black text-emerald-300">38.650</span>
            </div>
            <div className="p-1.5 rounded-lg bg-yellow-950/40 border border-yellow-500/40">
              <span className="text-[9px] text-yellow-300 block font-sans font-bold">SEC 3</span>
              <span className="text-xs font-black text-yellow-300">24.210</span>
            </div>
          </div>

          <div className="text-[10px] text-neutral-500 text-center font-timing">
            Estimated Lap Time: <span className="text-white font-bold">1:31.000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
