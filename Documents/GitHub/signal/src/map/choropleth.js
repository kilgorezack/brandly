import { CHOROPLETH_COLOR_EXPRESSION } from '../utils/scoreColors.js';

export const FILL_PAINT = {
  'fill-color': CHOROPLETH_COLOR_EXPRESSION,
  'fill-opacity': [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    0.9,
    0.72,
  ],
};

export const BORDER_PAINT = {
  'line-color': '#0f1623',
  'line-width': [
    'interpolate', ['linear'], ['zoom'],
    4, 0.4,
    8, 1.2,
    12, 2,
  ],
  'line-opacity': 0.8,
};

export const HIGHLIGHT_PAINT = {
  'fill-color': '#ffffff',
  'fill-opacity': 0.15,
};

export const HIGHLIGHT_LAYOUT = {};
