/**
 * Map an opportunity score (0–100) to a hex colour for the choropleth.
 * Uses a red → amber → green gradient with a slight blue tint at the top.
 */

// Colour stops: [score, r, g, b]
const STOPS = [
  [0,   239, 68,  68],   // red-500
  [25,  249, 115, 22],   // orange-400
  [50,  234, 179, 8],    // yellow-500
  [75,  132, 204, 79],   // lime-400
  [100, 34,  197, 94],   // green-500
];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export function scoreToColor(score) {
  const s = Math.max(0, Math.min(100, score ?? 0));

  for (let i = 0; i < STOPS.length - 1; i++) {
    const [s0, r0, g0, b0] = STOPS[i];
    const [s1, r1, g1, b1] = STOPS[i + 1];
    if (s >= s0 && s <= s1) {
      const t = (s - s0) / (s1 - s0);
      return `rgb(${lerp(r0, r1, t)}, ${lerp(g0, g1, t)}, ${lerp(b0, b1, t)})`;
    }
  }
  return '#22c55e';
}

export function scoreToHex(score) {
  const s = Math.max(0, Math.min(100, score ?? 0));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [s0, r0, g0, b0] = STOPS[i];
    const [s1, r1, g1, b1] = STOPS[i + 1];
    if (s >= s0 && s <= s1) {
      const t = (s - s0) / (s1 - s0);
      const r = lerp(r0, r1, t).toString(16).padStart(2, '0');
      const g = lerp(g0, g1, t).toString(16).padStart(2, '0');
      const b = lerp(b0, b1, t).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  return '#22c55e';
}

/**
 * Mapbox data-driven fill-color expression using opportunity_score property.
 * Used directly in the Layer paint prop.
 */
export const CHOROPLETH_COLOR_EXPRESSION = [
  'interpolate', ['linear'],
  ['coalesce', ['get', 'opportunity_score'], 0],
  0,   '#ef4444',
  25,  '#f97316',
  50,  '#eab308',
  75,  '#84cc4f',
  100, '#22c55e',
];
