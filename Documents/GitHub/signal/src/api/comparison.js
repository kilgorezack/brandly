import { API_BASE } from '../config.js';

export async function fetchComparison(ids, weights) {
  const params = new URLSearchParams({ ids: ids.join(',') });
  if (weights) {
    params.set(
      'weights',
      Object.entries(weights)
        .map(([k, v]) => `${k}:${v}`)
        .join(',')
    );
  }
  const res = await fetch(`${API_BASE}/comparison?${params}`);
  if (!res.ok) throw new Error('Comparison fetch failed');
  return res.json();
}
