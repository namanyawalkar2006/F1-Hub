export function formatOpenF1Interval(value: number | string | null, gapToLeader = false): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return gapToLeader && value === 0 ? 'LEADER' : `+${value.toFixed(3)}`;
  }

  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    const numericValue = Number(trimmed);
    if (Number.isFinite(numericValue)) {
      return gapToLeader && numericValue === 0 ? 'LEADER' : `+${numericValue.toFixed(3)}`;
    }
    return trimmed;
  }

  return null;
}
