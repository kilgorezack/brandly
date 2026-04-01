import { API_BASE } from '../config.js';

const _cache = new Map();

export async function fetchChoropleth({ type = 'sa4', state, parent } = {}) {
  const params = new URLSearchParams({ type });
  if (state) params.set('state', state);
  if (parent) params.set('parent', parent);

  const key = params.toString();
  if (_cache.has(key)) return _cache.get(key);

  const res = await fetch(`${API_BASE}/choropleth?${params}`);
  if (!res.ok) throw new Error(`Choropleth fetch failed: ${res.status}`);
  const data = await res.json();

  _cache.set(key, data);
  return data;
}
