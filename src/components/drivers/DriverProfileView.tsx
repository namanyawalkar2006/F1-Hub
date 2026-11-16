import React, { useEffect, useState } from 'react';
import { ArrowLeft, Flag, Gauge, Medal, Trophy, UserRound, Zap } from 'lucide-react';
import { DriverProfile } from '../../types';
import { getTeamColor } from '../../utils/f1State';
import { NavView } from '../common/Header';

interface DriverProfileViewProps {
  driverRef: string;
  onNavigate: (view: NavView) => void;
  onSelectConstructor: (constructorRef: string) => void;
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

export const DriverProfileView: React.FC<DriverProfileViewProps> = ({
  driverRef,
  onNavigate,
  onSelectConstructor,
}) => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');
    setProfile(null);
    setImageFailed(false);

    fetch(`/api/drivers/${encodeURIComponent(driverRef)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || 'Driver profile could not be loaded.');
        }
        return response.json() as Promise<DriverProfile>;
      })
      .then((data) => setProfile(data))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Driver profile could not be loaded.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [driverRef]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-neutral-800 bg-[#0f0f13] p-12 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading verified season data...</p>
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
          <p className="font-bold text-white">Driver profile unavailable</p>
          <p className="mt-2 text-sm text-neutral-400">{error || 'No verified profile data was returned.'}</p>
        </div>
      </div>
    );
  }

  const teamColor = getTeamColor(profile.driver.team_name);
  const initials = profile.driver.full_name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
  const profileImage = !imageFailed && profile.headshot_url;

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8">
      <button
        type="button"
        onClick={() => onNavigate('STANDINGS')}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Championship standings
      </button>

      <section
        className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#0c0c10] shadow-2xl"
        style={{ '--driver-team-color': teamColor } as React.CSSProperties}
      >
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: teamColor }} />
        <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: teamColor }} />
        <div className="relative grid min-h-[300px] items-center gap-6 p-6 sm:p-9 md:grid-cols-[1fr_auto] md:p-12">
          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="rounded border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-red-300">
                {profile.season} season
              </span>
              <span className="text-neutral-500">Through round {profile.round}</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="font-timing text-4xl font-black text-white/20 sm:text-6xl">
                {profile.driver.driver_number || '—'}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => onSelectConstructor(profile.driver.constructor_id || profile.driver.team_name)}
                  className="cursor-pointer text-xs font-black uppercase tracking-[0.22em] hover:brightness-125"
                  style={{ color: teamColor }}
                >
                  {profile.driver.team_name}
                </button>
                <h1 className="mt-1 font-racing text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl">
                  {profile.driver.full_name}
                </h1>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-neutral-400">
              <span>{profile.driver.driver_code}</span>
              {profile.driver.nationality && <span>{profile.driver.nationality}</span>}
              <button
                type="button"
                onClick={() => onSelectConstructor(profile.driver.constructor_id || profile.driver.team_name)}
                className="inline-flex cursor-pointer items-center gap-1.5 hover:text-white"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: teamColor }} />
                {profile.driver.team_name}
              </button>
            </div>
          </div>

          <div className="relative mx-auto flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900/80 md:mr-2 md:h-60 md:w-60">
            {profileImage ? (
              <img
                src={profile.headshot_url || undefined}
                alt={`${profile.driver.full_name} headshot`}
                fetchPriority="high"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ color: teamColor }}>
                {initials ? (
                  <span className="font-racing text-6xl font-black">{initials}</span>
                ) : (
                  <UserRound className="h-20 w-20" />
                )}
              </div>
            )}
            <span className="absolute bottom-3 right-3 rounded-md border border-white/10 bg-black/80 px-2 py-1 font-timing text-xs font-bold text-white">
              #{profile.driver.driver_number || '—'}
            </span>
          </div>
        </div>
        {profile.headshot_url && !imageFailed && (
          <p className="absolute bottom-3 right-4 text-[9px] text-neutral-600">Headshot via OpenF1</p>
        )}
      </section>

      <section aria-label="Season statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Championship" value={`P${profile.stats.championship_position}`} detail="Drivers' standings" />
        <StatCard label="Points" value={profile.stats.points} detail="Season total" />
        <StatCard label="Wins" value={profile.stats.wins} detail="Grand Prix victories" />
        <StatCard label="Podiums" value={profile.stats.podiums} detail="Race finishes, P1–P3" />
        <StatCard label="Poles" value={profile.stats.poles} detail="Qualifying P1" />
        <StatCard label="Fastest laps" value={profile.stats.fastest_laps} detail="Recorded race laps" />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#0c0c10] p-4">
          <Flag className="h-5 w-5 text-red-400" />
          <div><p className="font-timing text-xl font-black text-white">{profile.stats.race_starts}</p><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Grand Prix starts</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#0c0c10] p-4">
          <Medal className="h-5 w-5 text-amber-400" />
          <div><p className="font-timing text-xl font-black text-white">{profile.stats.sprint_wins}</p><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sprint wins</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#0c0c10] p-4">
          <Gauge className="h-5 w-5 text-cyan-400" />
          <div><p className="font-timing text-xl font-black text-white">{profile.stats.sprint_points}</p><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sprint points</p></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0f0f13] shadow-xl">
        <div className="flex flex-col gap-2 border-b border-neutral-800 p-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
              <Trophy className="h-4 w-4" />
              Season report
            </div>
            <h2 className="font-racing text-2xl font-black uppercase text-white">Race-by-race form</h2>
          </div>
          <p className="text-[10px] text-neutral-500">Results and points are shown only when published by the data provider.</p>
        </div>

        {profile.races.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            {profile.data_sections.race_results
              ? 'No race classifications have been published for this driver yet.'
              : 'Race classifications are currently unavailable from the data provider.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-neutral-900/60 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Round / Grand Prix</th>
                  <th className="px-4 py-3 text-center">Grid</th>
                  <th className="px-4 py-3 text-center">Finish</th>
                  <th className="px-4 py-3">Qualifying</th>
                  <th className="px-4 py-3">Fastest lap</th>
                  <th className="px-4 py-3">Sprint</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/80">
                {profile.races.map((race) => (
                  <tr key={race.round} className="transition-colors hover:bg-white/[0.025]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-timing text-xs text-neutral-600">{String(race.round).padStart(2, '0')}</span>
                        <div>
                          <p className="text-xs font-bold text-neutral-200">{race.race_name || 'Grand Prix'}</p>
                          <p className="mt-0.5 text-[10px] text-neutral-500">{race.circuit_name}{race.date ? ` · ${race.date}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-timing text-xs text-neutral-400">{race.grid || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-timing text-xs font-bold ${
                        race.position === '1' ? 'text-amber-400' :
                        race.position === '2' ? 'text-slate-300' :
                        race.position === '3' ? 'text-amber-600' :
                        race.position ? 'text-neutral-200' : 'text-neutral-500'
                      }`}>
                        {race.position && /^\d+$/.test(race.position)
                          ? `P${race.position}`
                          : race.status || race.position || '—'}
                      </span>
                      {race.position && /^\d+$/.test(race.position) && race.status && race.status !== 'Finished' && (
                        <span className="ml-1 text-[9px] text-neutral-600">· {race.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-timing text-[10px] text-neutral-400">
                      {race.qualifying ? `P${race.qualifying.position ?? '—'} · ${race.qualifying.q3 || race.qualifying.q2 || race.qualifying.q1 || '—'}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-timing text-[10px] text-purple-300">{race.fastest_lap || '—'}</td>
                    <td className="px-4 py-3 font-timing text-[10px] text-neutral-400">
                      {race.sprint ? `P${race.sprint.position ?? '—'} · ${race.sprint.points} pts` : '—'}
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
          <span className="inline-flex items-center gap-1.5"><Zap className="h-3 w-3 text-emerald-500" /> Verified data</span>
        </div>
      </section>
    </div>
  );
};
