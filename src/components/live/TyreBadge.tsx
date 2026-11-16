import React from 'react';
import { TyreCompound } from '../../utils/f1State';

interface TyreBadgeProps {
  compound: TyreCompound;
  age?: number | null;
}

export const TyreBadge: React.FC<TyreBadgeProps> = ({ compound, age }) => {
  const getBadgeStyle = () => {
    switch (compound) {
      case 'SOFT':
        return {
          letter: 'S',
          border: 'border-red-500',
          text: 'text-red-400',
          bg: 'bg-red-500/10',
          name: 'SOFT',
        };
      case 'MEDIUM':
        return {
          letter: 'M',
          border: 'border-yellow-400',
          text: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          name: 'MEDIUM',
        };
      case 'HARD':
        return {
          letter: 'H',
          border: 'border-neutral-200',
          text: 'text-neutral-100',
          bg: 'bg-neutral-200/10',
          name: 'HARD',
        };
      case 'INTERMEDIATE':
        return {
          letter: 'I',
          border: 'border-emerald-500',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          name: 'INTER',
        };
      case 'WET':
        return {
          letter: 'W',
          border: 'border-blue-500',
          text: 'text-blue-400',
          bg: 'bg-blue-500/10',
          name: 'WET',
        };
      default:
        return {
          letter: '—',
          border: 'border-neutral-700',
          text: 'text-neutral-400',
          bg: 'bg-neutral-800/20',
          name: '—',
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className="flex items-center gap-1.5" title={`Tyre: ${style.name}${age ? ` (${age} laps old)` : ''}`}>
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-bold ${style.border} ${style.text} ${style.bg}`}
      >
        {style.letter}
      </span>
      {age !== null && age !== undefined && (
        <span className="text-xs text-neutral-400 font-mono">
          {age}L
        </span>
      )}
    </div>
  );
};
