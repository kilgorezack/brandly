/* global __MAPBOX_TOKEN__ */

export const MAPBOX_TOKEN = __MAPBOX_TOKEN__;

export const API_BASE = '/api';

export const INITIAL_VIEW = {
  longitude: 134.0,
  latitude: -25.7,
  zoom: 4,
};

export const AUSTRALIA_BOUNDS = [
  [112.9, -43.7], // SW
  [153.6, -10.7], // NE
];

export const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

export const SA_LEVELS = ['sa4', 'sa3', 'sa2', 'sa1'];

export const SA_LEVEL_LABELS = {
  sa4: 'SA4',
  sa3: 'SA3',
  sa2: 'SA2',
  sa1: 'SA1',
};

// Opportunity Score weights (must sum to 1.0)
export const DEFAULT_SCORE_WEIGHTS = {
  income: 0.30,
  children: 0.20,
  growth: 0.20,
  competition: 0.20,
  density: 0.10,
};

export const SCORE_WEIGHT_LABELS = {
  income: 'Median Income',
  children: 'Families w/ Children',
  growth: 'Population Growth',
  competition: 'Underserved Market',
  density: 'Density',
};
