import React from 'react';
import { Thermometer, Wind, Droplets, CloudRain } from 'lucide-react';

interface WeatherData {
  air_temperature: number | null;
  track_temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  rainfall: number | null;
}

interface TrackWeatherProps {
  weather: WeatherData | null;
}

export const TrackWeather: React.FC<TrackWeatherProps> = ({ weather }) => {
  if (!weather) {
    return (
      <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-xl p-4">
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-neutral-800">
          <Thermometer className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Track Conditions
          </h3>
        </div>
        <div className="text-xs text-neutral-500 py-4 text-center">
          Weather telemetry unavailable
        </div>
      </div>
    );
  }

  const isRain = weather.rainfall !== null && weather.rainfall > 0;

  return (
    <div className="bg-[#0f0f13] border border-neutral-800/80 rounded-xl p-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Track Conditions
          </h3>
        </div>
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
            isRain
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}
        >
          {isRain ? 'Wet Track' : 'Dry Track'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Track Temp */}
        <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span>Track Temp</span>
          </div>
          <div className="text-base font-bold font-timing text-neutral-100">
            {weather.track_temperature !== null ? `${weather.track_temperature.toFixed(1)}°C` : '—'}
          </div>
        </div>

        {/* Air Temp */}
        <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Air Temp</span>
          </div>
          <div className="text-base font-bold font-timing text-neutral-100">
            {weather.air_temperature !== null ? `${weather.air_temperature.toFixed(1)}°C` : '—'}
          </div>
        </div>

        {/* Humidity */}
        <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Humidity</span>
          </div>
          <div className="text-base font-bold font-timing text-neutral-100">
            {weather.humidity !== null ? `${weather.humidity.toFixed(0)}%` : '—'}
          </div>
        </div>

        {/* Wind */}
        <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            <span>Wind Speed</span>
          </div>
          <div className="text-base font-bold font-timing text-neutral-100">
            {weather.wind_speed !== null ? `${weather.wind_speed.toFixed(1)} m/s` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
