import { API_BASE } from '../config.js';

export async function fetchRegion(id) {
  const res = await fetch(`${API_BASE}/regions/${id}`);
  if (!res.ok) throw new Error(`Region ${id} not found`);
  return res.json();
}

export async function fetchRegions({ type, state } = {}) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (state) params.set('state', state);
  const res = await fetch(`${API_BASE}/regions?${params}`);
  if (!res.ok) throw new Error('Failed to fetch regions');
  return res.json();
}

export async function fetchRegionChildren(id) {
  const res = await fetch(`${API_BASE}/regions/${id}/children`);
  if (!res.ok) throw new Error(`Children fetch failed for ${id}`);
  return res.json();
}
