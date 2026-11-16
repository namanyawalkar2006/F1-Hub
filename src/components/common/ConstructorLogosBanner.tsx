import React, { useState } from 'react';
import { ExternalLink, Shield, X } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

const OFFICIAL_TEAMS_URL = 'https://www.formula1.com/en/teams';

const CONSTRUCTORS_LIST = [
  { name: 'Ferrari', fullName: 'Scuderia Ferrari HP', teamUrl: `${OFFICIAL_TEAMS_URL}/ferrari`, powerUnit: 'Ferrari', powerUnitUrl: 'https://www.ferrari.com/en-EN/formula1', color: '#E8002D' },
  { name: 'Mercedes', fullName: 'Mercedes-AMG PETRONAS F1 Team', teamUrl: `${OFFICIAL_TEAMS_URL}/mercedes`, powerUnit: 'Mercedes-AMG', powerUnitUrl: 'https://www.mercedesamgf1.com/', color: '#27F4D2' },
  { name: 'Red Bull', fullName: 'Oracle Red Bull Racing', teamUrl: `${OFFICIAL_TEAMS_URL}/red-bull-racing`, powerUnit: 'Red Bull Ford Powertrains', powerUnitUrl: 'https://www.redbullracing.com/int-en/red-bull-ford-powertrains', color: '#3671C6' },
  { name: 'McLaren', fullName: 'McLaren Formula 1 Team', teamUrl: `${OFFICIAL_TEAMS_URL}/mclaren`, powerUnit: 'Mercedes-AMG', powerUnitUrl: 'https://www.mercedesamgf1.com/', color: '#FF8000' },
  { name: 'Aston Martin', fullName: 'Aston Martin Aramco Formula One Team', teamUrl: `${OFFICIAL_TEAMS_URL}/aston-martin`, powerUnit: 'Honda', powerUnitUrl: 'https://global.honda/en/newsroom/news/2023/c230524eng.html', color: '#229971' },
  { name: 'Alpine', fullName: 'BWT Alpine F1 Team', teamUrl: `${OFFICIAL_TEAMS_URL}/alpine`, powerUnit: 'Mercedes-AMG', powerUnitUrl: 'https://www.mercedesamgf1.com/', color: '#0093CC' },
  { name: 'Williams', fullName: 'Atlassian Williams Racing', teamUrl: `${OFFICIAL_TEAMS_URL}/williams`, powerUnit: 'Mercedes-AMG', powerUnitUrl: 'https://www.mercedesamgf1.com/', color: '#64C4FF' },
  { name: 'Racing Bulls', fullName: 'Visa Cash App Racing Bulls Formula One Team', teamUrl: `${OFFICIAL_TEAMS_URL}/racing-bulls`, powerUnit: 'Red Bull Ford Powertrains', powerUnitUrl: 'https://www.redbullracing.com/int-en/red-bull-ford-powertrains', color: '#6692FF' },
  { name: 'Audi', fullName: 'Audi Revolut F1 Team', teamUrl: `${OFFICIAL_TEAMS_URL}/audi`, powerUnit: 'Audi', powerUnitUrl: 'https://www.audi.com/en/formula-1r-17158', color: '#F50537' },
  { name: 'Cadillac', fullName: 'Cadillac Formula 1 Team', teamUrl: `${OFFICIAL_TEAMS_URL}/cadillac`, powerUnit: 'Ferrari', powerUnitUrl: 'https://www.ferrari.com/en-EN/formula1', color: '#D5D5D5' },
  { name: 'Haas', fullName: 'Haas F1 Team', teamUrl: `${OFFICIAL_TEAMS_URL}/haas`, powerUnit: 'Ferrari', powerUnitUrl: 'https://www.ferrari.com/en-EN/formula1', color: '#B6BABD' },
];

export const ConstructorLogosBanner: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<typeof CONSTRUCTORS_LIST[0] | null>(null);

  return (
    <div className="bg-[#0b0b10] border border-neutral-800/90 rounded-2xl p-4 sm:p-6 mb-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white font-racing">
              Official 2026 Constructors Grid
            </h3>
            <p className="text-[11px] text-neutral-400">
              2026 teams and their power-unit suppliers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">
            11 Constructor Teams
          </span>
        </div>
      </div>

      {/* Grid of Team Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {CONSTRUCTORS_LIST.map((team) => (
          <button
            key={team.name}
            onClick={() => setSelectedTeam(team)}
            className="group p-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-red-500/50 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative overflow-hidden"
          >
            <div className="w-1.5 h-1.5 rounded-full absolute top-2 right-2" style={{ backgroundColor: team.color }} />
            <TeamLogo teamName={team.name} size="md" className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-neutral-300 group-hover:text-white uppercase truncate w-full">
              {team.name}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Constructor Detail Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-speed-blur">
          <div className="bg-[#0f0f15] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <TeamLogo teamName={selectedTeam.name} size="lg" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">
                  Constructor Profile
                </span>
                <h4 className="text-xl font-black text-white uppercase font-racing">
                  {selectedTeam.fullName}
                </h4>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-300 font-timing bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-500">Power Unit Supplier:</span>
                <span className="font-semibold text-white">{selectedTeam.powerUnit}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Telemetry Stripe:</span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTeam.color }} />
                  <span className="text-neutral-300 uppercase">{selectedTeam.color}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px]">
              <a
                href={selectedTeam.teamUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-400 underline decoration-neutral-700 underline-offset-2 hover:text-white"
              >
                Official 2026 team profile <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={selectedTeam.powerUnitUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-400 underline decoration-neutral-700 underline-offset-2 hover:text-white"
              >
                Supplier reference <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <button
              onClick={() => setSelectedTeam(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-600/30"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
