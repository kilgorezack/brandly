/**
 * Formatters for Australian-context metric display.
 */

export function formatPopulation(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-AU');
}

export function formatIncome(weeklyAud) {
  if (weeklyAud == null) return '—';
  return `$${weeklyAud.toLocaleString('en-AU')}/wk`;
}

export function formatPercent(value, decimals = 1) {
  if (value == null) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatDensity(perSqkm) {
  if (perSqkm == null) return '—';
  return `${Math.round(perSqkm).toLocaleString('en-AU')} /km²`;
}

export function formatArea(sqkm) {
  if (sqkm == null) return '—';
  if (sqkm >= 1_000_000) return `${(sqkm / 1_000_000).toFixed(1)}M km²`;
  if (sqkm >= 1_000) return `${Math.round(sqkm / 1_000).toLocaleString('en-AU')}K km²`;
  return `${Math.round(sqkm).toLocaleString('en-AU')} km²`;
}

export function formatGrowth(pct) {
  if (pct == null) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${Number(pct).toFixed(1)}%`;
}

export function formatScore(score) {
  if (score == null) return '—';
  return Math.round(score).toString();
}

export function formatHouseholdSize(avg) {
  if (avg == null) return '—';
  return Number(avg).toFixed(1);
}

export const SA_TYPE_LABELS = {
  state: 'State/Territory',
  sa4: 'Statistical Area Level 4',
  sa3: 'Statistical Area Level 3',
  sa2: 'Statistical Area Level 2',
  sa1: 'Statistical Area Level 1',
};
