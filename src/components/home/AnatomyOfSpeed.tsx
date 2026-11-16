import React, { useState } from 'react';
import { Crosshair, Zap, Wind, ShieldAlert, Disc, Gauge, X, ChevronRight, Layers } from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  label: string;
  x: number; // percentage
  y: number; // percentage
  detail: string;
  telemetry: {
    label: string;
    value: string;
    delta: string;
  }[];
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'drs',
    name: 'DRS: ACTIVATION ZONE',
    label: 'Rear Wing Flap & DRS',
    x: 82,
    y: 32,
    detail: 'Hydraulically actuated rear wing flap reducing aerodynamic drag. Operates in designated DRS detection zones when within 1.000s of leading car.',
    telemetry: [
      { label: 'Delta Speed', value: '+12.4 KM/H', delta: 'Max deployment' },
      { label: 'Aero Drag', value: '-22.5%', delta: 'Open aperture' },
      { label: 'Actuation Time', value: '0.18 SEC', delta: 'Nominal' },
    ],
  },
  {
    id: 'floor',
    name: 'FLOOR (VENTURI TUNNELS)',
    label: 'Venturi Underfloor Tunnels',
    x: 62,
    y: 65,
    detail: 'Underfloor venturi tunnels generate ground-effect downforce through low-pressure suction, minimizing reliance on upper turbulent aerodynamic surfaces.',
    telemetry: [
      { label: 'Underfloor Suction', value: '62.8%', delta: 'Total downforce' },
      { label: 'Ride Height (Front)', value: '18.4 MM', delta: '±0.2mm tolerance' },
      { label: 'Ride Height (Rear)', value: '44.1 MM', delta: 'Dynamic rake' },
    ],
  },
  {
    id: 'front-wing',
    name: 'FRONT WING & ENDPLATES',
    label: 'Front Aerodynamic Element',
    x: 22,
    y: 75,
    detail: 'Multi-element carbon composite front wing with vortex-generating endplates that condition wake airflow cleanly around the front tyre sidewalls.',
    telemetry: [
      { label: 'Front Downforce', value: '1,420 KG', delta: '@ 250 km/h' },
      { label: 'Flap Angle', value: '28.5 DEG', delta: 'High downforce trim' },
      { label: 'Tyre Wake Deflection', value: '88.2%', delta: 'Optimal flow' },
    ],
  },
  {
    id: 'halo',
    name: 'HALO COCKPIT SHIELD',
    label: 'Titanium Cockpit Protection',
    x: 48,
    y: 42,
    detail: 'Grade 5 aerospace titanium survival cell structure capable of supporting 12,000 kg (equivalent to two double-decker buses) with aero fairing.',
    telemetry: [
      { label: 'Load Rating', value: '120 KN', delta: 'FIA 8869-2018' },
      { label: 'Mass', value: '7.0 KG', delta: 'Bare structure' },
      { label: 'Aero Fairing', value: 'Integrated', delta: 'Engine intake flow' },
    ],
  },
  {
    id: 'tyres',
    name: 'PIRELLI 18" COMPOUND',
    label: 'Tread & Thermal Sensor',
    x: 26,
    y: 46,
    detail: 'Low-profile 18-inch Pirelli competition tyre with internal thermal infrared telemetry monitoring carcass and bulk rubber temperature.',
    telemetry: [
      { label: 'Carcass Temp', value: '104.2 °C', delta: 'Optimal window' },
      { label: 'Bulk Pressure', value: '23.5 PSI', delta: 'Cold 21.0' },
      { label: 'Degradation', value: '8.4%', delta: 'Stint lap 14' },
    ],
  },
];

export const AnatomyOfSpeed: React.FC = () => {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(HOTSPOTS[0]);
  const [pulseActive, setPulseActive] = useState(true);

  return (
    <div className="bg-[#0b0b10] border border-neutral-800/90 rounded-2xl p-6 md:p-8 relative overflow-hidden glow-f1-red">
      {/* Background neon grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#D41514_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 mb-1">
            <Crosshair className="w-4 h-4 animate-spin text-red-500" style={{ animationDuration: '8s' }} />
            <span>Anatomy of Speed • Pulsing Interaction</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-racing">
            Aerodynamic Telemetry Radar
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPulseActive(!pulseActive)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-white uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`} />
            <span>Radar Pulses: {pulseActive ? 'Active' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Car Interactive Canvas Area */}
        <div className="lg:col-span-8 relative aspect-[16/9] sm:aspect-[21/10] bg-gradient-to-b from-neutral-950/80 to-black rounded-xl border border-neutral-800/80 overflow-hidden flex items-center justify-center group shadow-2xl">
          {/* Wireframe F1 Car Graphic with Neon Red Accents */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <svg viewBox="0 0 1000 500" className="w-full h-full drop-shadow-[0_0_25px_rgba(212,21,20,0.35)]">
              {/* Speed Lines */}
              <g stroke="rgba(212,21,20,0.15)" strokeWidth="1.5" strokeDasharray="10 20">
                <line x1="50" y1="420" x2="950" y2="420" />
                <line x1="120" y1="440" x2="880" y2="440" />
                <line x1="80" y1="460" x2="920" y2="460" />
              </g>

              {/* Wireframe Chassis Silhouette */}
              {/* Rear Wing */}
              <path d="M 760 140 L 880 140 L 870 210 L 770 210 Z" fill="none" stroke="#D41514" strokeWidth="2.5" />
              <line x1="770" y1="170" x2="870" y2="170" stroke="#D41514" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="810" y1="210" x2="810" y2="280" stroke="#D41514" strokeWidth="3" />

              {/* Main Body Engine Cover & Cockpit */}
              <path
                d="M 180 340 L 280 320 L 390 280 L 460 210 Q 510 180 570 200 L 680 230 L 780 270 L 840 330 L 760 360 L 580 370 L 320 370 Z"
                fill="rgba(212, 21, 20, 0.05)"
                stroke="#D41514"
                strokeWidth="2.5"
              />

              {/* Halo & Cockpit Opening */}
              <ellipse cx="490" cy="220" rx="35" ry="18" fill="none" stroke="#ffffff" strokeWidth="2.5" />
              <path d="M 490 202 L 490 240" stroke="#ffffff" strokeWidth="3" />

              {/* Front Nose & Wing */}
              <path d="M 180 340 L 110 360 L 90 380 L 260 380 L 280 350 Z" fill="none" stroke="#D41514" strokeWidth="2.5" />
              <path d="M 80 380 Q 60 410 130 420 L 320 400 L 310 375 Z" fill="none" stroke="#D41514" strokeWidth="3" />
              {/* Front Endplate */}
              <polygon points="70,360 120,360 100,430 50,430" fill="none" stroke="#D41514" strokeWidth="2" />

              {/* Front Wheel */}
              <ellipse cx="270" cy="360" rx="55" ry="60" fill="#080808" stroke="#D41514" strokeWidth="3.5" />
              <ellipse cx="270" cy="360" rx="32" ry="35" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 4" />
              <circle cx="270" cy="360" r="10" fill="#D41514" />

              {/* Rear Wheel */}
              <ellipse cx="780" cy="340" rx="65" ry="70" fill="#080808" stroke="#D41514" strokeWidth="4" />
              <ellipse cx="780" cy="340" rx="38" ry="42" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 4" />
              <circle cx="780" cy="340" r="12" fill="#D41514" />

              {/* Venturi Underfloor Glow */}
              <path
                d="M 330 380 L 710 375 L 720 395 L 320 395 Z"
                fill="url(#venturiGlow)"
                stroke="#D41514"
                strokeWidth="1.5"
              />

              <defs>
                <linearGradient id="venturiGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D41514" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#D41514" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#D41514" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>

            {/* Clickable Radar Hotspots with Pulsing Rings */}
            {HOTSPOTS.map((spot) => {
              const isSelected = activeHotspot?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  onClick={() => setActiveHotspot(spot)}
                >
                  {/* Pulsing radar waves */}
                  {pulseActive && (
                    <span className="absolute inset-0 w-8 h-8 -left-2 -top-2 rounded-full border border-red-500 animate-radar-pulse pointer-events-none" />
                  )}
                  {pulseActive && (
                    <span className="absolute inset-0 w-12 h-12 -left-4 -top-4 rounded-full border border-red-500/40 animate-radar-pulse pointer-events-none" style={{ animationDelay: '0.8s' }} />
                  )}

                  {/* Hotspot node button */}
                  <button
                    aria-label={spot.name}
                    className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white scale-125 shadow-[0_0_20px_#D41514]'
                        : 'bg-black/90 border-2 border-red-500 text-red-400 hover:scale-110'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>

                  {/* Label tooltip */}
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded bg-black/90 border border-neutral-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all pointer-events-none ${
                      isSelected ? 'opacity-100 text-red-400 border-red-500' : 'opacity-0 group-hover:opacity-100 text-neutral-300'
                    }`}
                  >
                    {spot.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry Detail Inspector Panel */}
        <div className="lg:col-span-4 bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                Aero Hotspot Selected
              </span>
            </div>
            <span className="text-[10px] font-timing font-bold text-neutral-500 px-2 py-0.5 rounded bg-black">
              ACTIVE NODE
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black uppercase text-white font-racing">
              {activeHotspot?.name}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              {activeHotspot?.detail}
            </p>
          </div>

          {/* Real-time Telemetry Stats */}
          <div className="space-y-2 pt-2">
            {activeHotspot?.telemetry.map((t, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-black/60 border border-neutral-800 flex items-center justify-between font-timing"
              >
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">
                    {t.label}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {t.value}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                    {t.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Click any node to shift focus</span>
            <span className="text-red-400 font-bold font-timing">5 NODES ARMED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
