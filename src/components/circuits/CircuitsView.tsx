import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, X, ChevronRight, Zap } from 'lucide-react';
import { CIRCUITS_DATA } from '../../data/circuitsData';
import { F1Circuit } from '../../types';

const FLAG_EMOJI_BY_CODE: Record<string, string> = {
  BRN: '🇧🇭',
  SAU: '🇸🇦',
  AUS: '🇦🇺',
  JPN: '🇯🇵',
  CHN: '🇨🇳',
  USA: '🇺🇸',
  ITA: '🇮🇹',
  MCO: '🇲🇨',
  CAN: '🇨🇦',
  ESP: '🇪🇸',
  AUT: '🇦🇹',
  GBR: '🇬🇧',
  HUN: '🇭🇺',
  BEL: '🇧🇪',
  NLD: '🇳🇱',
  AZE: '🇦🇿',
  SGP: '🇸🇬',
  MEX: '🇲🇽',
  BRA: '🇧🇷',
  QAT: '🇶🇦',
  UAE: '🇦🇪',
};

const CountryFlag: React.FC<{ circuit: F1Circuit; size: 'card' | 'detail' }> = ({
  circuit,
  size,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || circuit.countryCode === 'USA' || circuit.countryCode === 'UAE') {
    return (
      <span
        role="img"
        aria-label={`${circuit.country} flag`}
        className={`circuit-country-flag circuit-country-flag-${size}`}
      >
        {FLAG_EMOJI_BY_CODE[circuit.countryCode] ?? '🏁'}
      </span>
    );
  }

  return (
    <img
      src={circuit.flagUrl}
      alt={`${circuit.country} flag`}
      width={size === 'card' ? 20 : 28}
      height={size === 'card' ? 12 : 16}
      loading="lazy"
      decoding="async"
      className={`circuit-country-flag circuit-country-flag-${size}`}
      onError={() => setHasError(true)}
    />
  );
};

const CircuitTrackImage: React.FC<{ circuit: F1Circuit; size: 'card' | 'detail' }> = ({
  circuit,
  size,
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      data-circuit-id={circuit.id}
      className={`circuit-track-frame circuit-track-frame-${size}`}
    >
      {hasError ? (
        <div className="circuit-track-fallback" role="img" aria-label={`${circuit.name} track map unavailable`}>
          <svg aria-hidden="true" viewBox="0 0 180 100" className="h-16 w-32">
            <path
              d="M22 51c-9-13 3-27 21-24l20 4c18 3 19-17 37-15l29 4c17 2 20 17 10 28l-14 16c-10 12-29 5-40 1l-20-8c-17-7-25 17-39 14-13-3-15-12-4-20Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          </svg>
          <span>Track map temporarily unavailable</span>
        </div>
      ) : (
        <img
          src={circuit.imageUrl}
          alt={`${circuit.name} circuit layout`}
          width="600"
          height="450"
          loading="lazy"
          decoding="async"
          data-circuit-id={circuit.id}
          className="circuit-track-image"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

export const CircuitsView: React.FC = () => {
  const [selectedCircuit, setSelectedCircuit] = useState<F1Circuit | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'Permanent' | 'Street' | 'Hybrid'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedCircuit) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCircuit(null);
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements?.length) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
    };
  }, [selectedCircuit]);

  const openCircuit = (circuit: F1Circuit, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelectedCircuit(circuit);
  };

  const filteredCircuits = CIRCUITS_DATA.filter((c) => {
    const matchesType = filterType === 'ALL' || c.circuitType === filterType;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.grandPrixName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.locality.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 mb-1">
            <Compass className="w-4 h-4" />
            <span>Championship Venues</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Formula 1 Circuits
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Authentic FIA track dimensions, corner counts, DRS zones, and telemetry lap records for all 24 Grand Prix tracks.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search circuit or country..."
            aria-label="Search circuits or countries"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-3.5 py-2 font-medium focus:outline-none focus:border-red-500/50 w-full sm:w-56"
          />
          <div
            role="group"
            aria-label="Filter circuits by type"
            className="inline-flex p-1 rounded-xl bg-neutral-900 border border-neutral-800 overflow-x-auto max-w-full"
          >
            {(['ALL', 'Permanent', 'Street', 'Hybrid'] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={filterType === type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex-shrink-0 ${
                  filterType === type
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Circuit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCircuits.map((c, idx) => (
          <motion.button
            key={c.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.3) }}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={(event) => openCircuit(c, event.currentTarget)}
            aria-label={`Inspect ${c.name} circuit details`}
            aria-haspopup="dialog"
            className="w-full appearance-none text-left bg-gradient-to-br from-[#0c0c10] to-[#121218] border border-neutral-800/90 hover:border-red-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer group glow-f1-red"
          >
            <div>
              {/* Header: Round & Flag */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-timing font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                  Round {c.round} • {c.circuitType}
                </span>
                <div className="flex items-center gap-2">
                  <CountryFlag circuit={c} size="card" />
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    {c.country}
                  </span>
                </div>
              </div>

              {/* Circuit Name */}
              <h3 className="text-lg font-black text-white uppercase group-hover:text-red-500 transition-colors leading-snug">
                {c.name}
              </h3>
              <p className="text-xs text-neutral-400 font-semibold mb-4">
                {c.grandPrixName} • {c.locality}
              </p>

              {/* Real Track Layout Image */}
              <CircuitTrackImage circuit={c} size="card" />

              {/* Key Specs Pills */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-800/80 text-center font-timing">
                <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                  <span className="text-[10px] uppercase text-neutral-500 font-sans block font-semibold">Length</span>
                  <span className="text-xs font-bold text-neutral-200">{c.trackLengthKm.toFixed(3)} km</span>
                </div>
                <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                  <span className="text-[10px] uppercase text-neutral-500 font-sans block font-semibold">Corners</span>
                  <span className="text-xs font-bold text-neutral-200">{c.corners} Turns</span>
                </div>
                <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                  <span className="text-[10px] uppercase text-neutral-500 font-sans block font-semibold">DRS</span>
                  <span className="text-xs font-bold text-red-400">{c.drsZones} Zones</span>
                </div>
              </div>
            </div>

            {/* Bottom: Lap Record & Action */}
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <div className="truncate max-w-[190px]">
                <span className="text-[10px] text-neutral-500 uppercase block font-sans">Lap Record</span>
                <span className="font-timing font-bold text-neutral-300 text-xs">
                  {c.lapRecord.time} ({c.lapRecord.driver})
                </span>
              </div>
              <span className="text-[11px] font-bold text-red-500 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Inspect <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
      {filteredCircuits.length === 0 && (
        <p role="status" className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-8 text-center text-sm text-neutral-400">
          No circuits match that search. Try another name or country.
        </p>
      )}

      {/* Interactive Circuit Detail Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedCircuit && (
            <motion.div
              key={selectedCircuit.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/85 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="circuit-dialog-title"
              aria-describedby="circuit-dialog-description"
              onClick={(event) => {
                if (event.target === event.currentTarget) setSelectedCircuit(null);
              }}
            >
              <motion.div
                ref={dialogRef}
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25 }}
                className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-neutral-700 bg-[#0c0c10] p-4 shadow-2xl glow-f1-red touch-pan-y sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6 md:p-8"
              >
                <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-3 border-b border-neutral-800/80 bg-[#0c0c10]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6 md:-mx-8 md:-mt-8 md:px-8">
                  <div className="flex min-w-0 items-center gap-3">
                    <CountryFlag key={selectedCircuit.id} circuit={selectedCircuit} size="detail" />
                    <span className="truncate text-xs font-black uppercase tracking-widest text-red-500">
                      Round {selectedCircuit.round} • {selectedCircuit.country}
                    </span>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={() => setSelectedCircuit(null)}
                    aria-label="Close circuit details"
                    className="shrink-0 rounded-full bg-neutral-900 p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

              <h2 id="circuit-dialog-title" className="mb-1 pr-2 text-2xl font-black uppercase tracking-tight text-white sm:pr-0 md:text-4xl">
                {selectedCircuit.name}
              </h2>
              <p id="circuit-dialog-description" className="mb-5 text-sm font-semibold text-neutral-400 sm:mb-6">
                {selectedCircuit.officialName} • {selectedCircuit.locality}
              </p>

              {/* Large Track Image Banner */}
              <div className="relative mb-5 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-black/80 p-3 shadow-inner sm:mb-6 sm:min-h-56 sm:p-6">
                <CircuitTrackImage key={selectedCircuit.id} circuit={selectedCircuit} size="detail" />
                <div className="absolute bottom-3 right-4 px-3 py-1 rounded bg-black/80 border border-neutral-800 text-[10px] font-timing text-neutral-400">
                  Circuit layout
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-timing">
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-sans font-semibold block">Track Length</span>
                  <span className="text-base font-extrabold text-white">{selectedCircuit.trackLengthKm.toFixed(3)} km</span>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-sans font-semibold block">Corners</span>
                  <span className="text-base font-extrabold text-white">{selectedCircuit.corners} Turns</span>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-sans font-semibold block">DRS Zones</span>
                  <span className="text-base font-extrabold text-red-400">{selectedCircuit.drsZones} Zones</span>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-sans font-semibold block">Race Laps</span>
                  <span className="text-base font-extrabold text-white">{selectedCircuit.laps} Laps</span>
                </div>
              </div>

              {/* Extended Details Table */}
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/80 font-timing">
                    <span className="text-neutral-400">Total Race Distance:</span>
                    <span className="text-white font-bold">{selectedCircuit.raceDistanceKm.toFixed(3)} km</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/80 font-timing">
                    <span className="text-neutral-400">All-Time Lap Record:</span>
                    <span className="text-purple-400 font-bold">
                      {selectedCircuit.lapRecord.time}{' '}
                      <span className="text-neutral-400 font-normal">
                        ({selectedCircuit.lapRecord.driver}, {selectedCircuit.lapRecord.year})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/80 font-timing">
                    <span className="text-neutral-400">First Grand Prix Held:</span>
                    <span className="text-white font-bold">{selectedCircuit.firstGrandPrixYear}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 font-timing">
                    <span className="text-neutral-400">Circuit Layout Classification:</span>
                    <span className="text-emerald-400 font-bold">{selectedCircuit.circuitType} Race Track</span>
                  </div>
                </div>

                {/* Circuit Description & Features */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                    Track Profile & Characteristics
                  </h4>
                  <p className="text-neutral-300 leading-relaxed">
                    {selectedCircuit.description}
                  </p>
                </div>

                {/* Key Features */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                    Key Features & Technical Demands
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedCircuit.keyFeatures.map((feat, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-[11px] font-medium flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
