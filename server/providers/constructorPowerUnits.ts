import { ConstructorPowerUnit } from '../../src/types';

const REGULATION_SOURCES = [
  {
    label: 'FIA regulations index',
    url: 'https://www.fia.com/regulation/category/110',
  },
  {
    label: 'Official 2026 team list',
    url: 'https://www.formula1.com/en/teams',
  },
];

const SUPPLIER_BY_CONSTRUCTOR: Record<string, string> = {
  alpine: 'Mercedes-AMG',
  aston_martin: 'Honda',
  audi: 'Audi',
  cadillac: 'Ferrari',
  ferrari: 'Ferrari',
  haas: 'Ferrari',
  mclaren: 'Mercedes-AMG',
  mercedes: 'Mercedes-AMG',
  racing_bulls: 'Red Bull Ford Powertrains',
  red_bull: 'Red Bull Ford Powertrains',
  williams: 'Mercedes-AMG',
};

const SUPPLIER_SOURCE_URL: Record<string, string> = {
  Audi: 'https://www.audi.com/en/formula-1r-17158',
  Ferrari: 'https://www.ferrari.com/en-EN/formula1',
  Honda: 'https://global.honda/en/newsroom/news/2023/c230524eng.html',
  'Mercedes-AMG': 'https://www.mercedesamgf1.com/',
  'Red Bull Ford Powertrains': 'https://www.redbullracing.com/',
};

export function getConstructorPowerUnit(
  season: string,
  constructorId: string,
): ConstructorPowerUnit | null {
  if (season !== '2026') return null;

  const supplier = SUPPLIER_BY_CONSTRUCTOR[constructorId.toLowerCase()];
  if (!supplier) return null;

  return {
    season,
    supplier,
    architecture: '1.6 L turbocharged V6 hybrid',
    combustion_engine: '1.6 L turbocharged V6',
    energy_recovery: 'MGU-K energy recovery; MGU-H removed for 2026',
    electric_power_kw: 350,
    electric_power_hp: 469,
    power_split: 'Approximately 50% combustion / 50% electric at maximum output',
    fuel: '100% sustainable fuel',
    total_power: 'Manufacturer-specific combined peak output is not publicly disclosed',
    sources: [
      ...REGULATION_SOURCES,
      {
        label: `${supplier} manufacturer site`,
        url: SUPPLIER_SOURCE_URL[supplier],
      },
    ],
  };
}
