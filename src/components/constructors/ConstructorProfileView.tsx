import React, { useEffect, useState } from 'react';
import { ArrowLeft, Flag, Gauge, Settings2, Trophy, Zap } from 'lucide-react';
import { ConstructorProfile } from '../../types';
import { getTeamColor } from '../../utils/f1State';
import { TeamLogo } from '../common/TeamLogo';
import { NavView } from '../common/Header';

interface ConstructorProfileViewProps {
  constructorRef: string;
  onNavigate: (view: NavView) => void;
  onSelectDriver: (driverRef: string) => void;
}

const StatCard: React.FC<{ label: string; value: string | number | null; detail?: string }> = ({
  label,
  value,
  detail,
}) => (
  <div className="rounded-xl border border-neutral-800 bg-[#0c0c10] p-4 sm:p-5">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">{label}</p>
    <p className="mt-2 font-racing text-2xl font-black text-white sm:text-3xl">{value ?? '—'}</p>
    {detail && <p className="mt-1 text-[11px] text-neutral-500">{detail}</p>}
  </div>
);

export const ConstructorProfileView: React.FC<ConstructorProfileViewProps> = ({
  constructorRef,
  onNavigate,
  onSelectDriver,
}) => {
  const [profile, setProfile] = useState<ConstructorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');
    setProfile(null);

    fetch(`/api/constructors/${encodeURIComponent(constructorRef)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || 'Constructor profile could not be loaded.');
        }
        return response.json() as Promise<ConstructorProfile>;
      })
      .then((data) => setProfile(data))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Constructor profile could not be loaded.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [constructorRef]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-neutral-800 bg-[#0f0f13] p-12 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading verified constructor data...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('STANDINGS')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to standings
        </button>
        <div role="alert" className="rounded-2xl border border-red-900/60 bg-red-950/20 p-8 text-center">
          <p className="font-bold text-white">Constructor profile unavailable</p>
          <p className="mt-2 text-sm text-neutral-400">{error || 'No verified profile data was returned.'}</p>
        </div>
      </div>
    );
  }

  const teamColor = getTeamColor(profile.constructor.team_name);

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8">
      <button
        type="button"
        onClick={() => onNavigate('STANDINGS')}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Constructors' championship
      </button>

      <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#0c0c10] shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: teamColor }} />
        <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: teamColor }} />
        <div className="relative flex min-h-[260px] flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-9 md:p-12">
          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="rounded border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-red-300">
                {profile.season} season
              </span>
              <span className="text-neutral-500">Through round {profile.round}</span>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: teamColor }}>
              Constructor profile
            </p>
            <h1 className="mt-1 font-racing text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-6xl">
              {profile.constructor.team_name}
            </h1>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {profile.constructor.nationality || 'Nationality not listed'}
            </p>
          </div>
          <div className="flex h-28 w-36 items-center justify-center rounded-xl border border-white/10 bg-black/30 p-4 sm:h-36 sm:w-48">
            <TeamLogo teamName={profile.constructor.team_name} size="lg" className="scale-125" />
          </div>
        </div>
      </section>

      <section aria-label="Constructor season statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Championship" value={`P${profile.stats.championship_position}`} detail="Constructors' standings" />
        <StatCard label="Points" value={profile.stats.points} detail="Official season total" />
        <StatCard
          label="Wins"
          value={profile.stats.wins}
          detail={profile.stats.race_wins === null ? 'Championship tally' : `${profile.stats.race_wins} Grand Prix wins`}
        />
        <StatCard label="Podiums" value={profile.stats.podiums} detail="Driver finishes, P1–P3" />
        <StatCard label="Pole positions" value={profile.stats.poles} detail="Qualifying P1" />
        <StatCard label="Fastest laps" value={profile.stats.fastest_laps} detail="Race fastest lap awards" />
        <StatCard label="Sprint wins" value={profile.stats.sprint_wins} detail="Sprint classifications" />
        <StatCard label="Sprint points" value={profile.stats.sprint_points} detail="Included in total points" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-neutral-800 bg-[#0f0f13] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
            <Flag className="h-4 w-4" />
            Season line-up
          </div>
          {profile.drivers.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.drivers.map((driver) => (
                <div key={driver.driver_id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-timing text-xs font-bold text-neutral-500">#{driver.driver_number}</span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectDriver(driver.driver_id)}
                        className="block max-w-full truncate text-left text-sm font-bold text-white hover:text-red-300"
                      >
                        {driver.full_name}
                      </button>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">{driver.driver_code}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-timing text-xs text-neutral-300">{driver.points} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Driver line-up data is unavailable.</p>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-[#0f0f13] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-300">
            <Settings2 className="h-4 w-4" />
            {profile.season} power unit
          </div>
          {profile.power_unit ? (
            <>
              <p className="font-racing text-2xl font-black text-white">{profile.power_unit.supplier}</p>
              <p className="mt-1 text-[11px] text-neutral-400">{profile.power_unit.architecture}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500">Combustion engine</p>
                  <p className="mt-1 text-xs font-bold text-neutral-200">{profile.power_unit.combustion_engine}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500">Electric boost</p>
                  <p className="mt-1 text-xs font-bold text-neutral-200">
                    Up to {profile.power_unit.electric_power_kw} kW / about {profile.power_unit.electric_power_hp} hp
                  </p>
                  <p className="mt-1 text-[9px] text-neutral-500">MGU-K maximum output under 2026 rules</p>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500">Energy recovery</p>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-200">{profile.power_unit.energy_recovery}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500">Fuel</p>
                  <p className="mt-1 text-xs font-bold text-neutral-200">{profile.power_unit.fuel}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-300">Combined power</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-300">{profile.power_unit.total_power}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                  {profile.power_unit.power_split}. The electric horsepower figure is not the complete power-unit output.
                </p>
              </div>
              <div className="mt-4 border-t border-neutral-800 pt-3">
                <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-neutral-600">References</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {profile.power_unit.sources.map((source) => (
                    <a
                      key={source.label}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-neutral-500 underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-white"
                    >
                      {source.label}
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-[9px] text-neutral-600">{profile.engine_data_note}</p>
              </div>
            </>
          ) : (
            <>
              <p className="font-racing text-2xl font-black text-white">{profile.engine_supplier || 'Not reported'}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{profile.engine_data_note}</p>
            </>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0f0f13] shadow-xl">
        <div className="flex flex-col gap-2 border-b border-neutral-800 p-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
              <Trophy className="h-4 w-4" />
              Season report
            </div>
            <h2 className="font-racing text-2xl font-black uppercase text-white">Race-by-race performance</h2>
          </div>
          <p className="text-[10px] text-neutral-500">Only published classifications are included.</p>
        </div>

        {profile.races.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            {profile.data_sections.race_results
              ? 'No race classifications have been published for this constructor yet.'
              : 'Race classifications are currently unavailable from the data provider.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-neutral-900/60 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Round / Grand Prix</th>
                  <th className="px-4 py-3">Drivers' finishes</th>
                  <th className="px-4 py-3 text-center">Podiums</th>
                  <th className="px-4 py-3 text-right">Sprint pts</th>
                  <th className="px-4 py-3 text-right">Race pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/80">
                {profile.races.map((race) => (
                  <tr key={race.round} className="align-top transition-colors hover:bg-white/[0.025]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-timing text-xs text-neutral-600">{String(race.round).padStart(2, '0')}</span>
                        <div>
                          <p className="text-xs font-bold text-neutral-200">{race.race_name || 'Grand Prix'}</p>
                          <p className="mt-0.5 text-[10px] text-neutral-500">{race.circuit_name}{race.date ? ` · ${race.date}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {race.drivers.map((driver) => (
                          <div key={driver.driver_id || driver.driver_number} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => onSelectDriver(driver.driver_id)}
                              className="font-bold text-neutral-200 hover:text-red-300"
                            >
                              {driver.driver_code}
                            </button>
                            <span className="font-timing text-neutral-400">
                              {driver.position && /^\d+$/.test(driver.position) ? `P${driver.position}` : driver.status || driver.position || '—'}
                            </span>
                            {driver.qualifying && <span className="font-timing text-neutral-600">Q{driver.qualifying.position ?? '—'}</span>}
                            {driver.fastest_lap && <Zap className="h-3 w-3 text-purple-400" aria-label="Fastest lap" />}
                            {driver.sprint && <span className="font-timing text-neutral-600">Sprint {driver.sprint.position ?? '—'}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-timing text-xs text-neutral-300">{race.podiums}</td>
                    <td className="px-4 py-3 text-right font-timing text-xs text-neutral-400">
                      {profile.data_sections.sprint_results ? race.sprint_points : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-timing text-xs font-bold text-white">{race.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-neutral-900 px-5 py-3 text-[10px] text-neutral-600">
          <span>Source: {profile.source}</span>
          <span className="inline-flex items-center gap-1.5"><Gauge className="h-3 w-3 text-emerald-500" /> Verified classifications</span>
        </div>
      </section>
    </div>
  );
};
