/**
 * Mapbox layer configurations for choropleth rendering.
 * Three layers share a single GeoJSON source:
 *   1. fill — choropleth colour by opportunity score
 *   2. border — subtle region outlines
 *   3. highlight — selected region overlay
 */

export const SOURCE_ID = 'signal-choropleth';

export const FILL_LAYER = {
  id: 'signal-fill',
  type: 'fill',
  source: SOURCE_ID,
};

export const BORDER_LAYER = {
  id: 'signal-border',
  type: 'line',
  source: SOURCE_ID,
};

export const HIGHLIGHT_LAYER = {
  id: 'signal-highlight',
  type: 'fill',
  source: SOURCE_ID,
};
