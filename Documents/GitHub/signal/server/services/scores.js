/**
 * Opportunity Score computation.
 *
 * Weights are sourced from src/config.js constants so they can be tuned
 * without touching this logic. The comparison tool can pass custom weights
 * to recompute the weighted sum from stored components.
 */

export const DEFAULT_WEIGHTS = {
  income: 0.30,
  children: 0.20,
  growth: 0.20,
  competition: 0.20,
  density: 0.10,
};

// Normalisation anchors (national Australian range for 2021 Census)
const INCOME_MIN = 600;    // $/week
const INCOME_MAX = 2500;   // $/week
const GROWTH_MIN = -5;     // %
const GROWTH_MAX = 30;     // %

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function incomeComponent(medianWeeklyIncome) {
  if (medianWeeklyIncome == null) return 50; // national average fallback
  return clamp(
    ((medianWeeklyIncome - INCOME_MIN) / (INCOME_MAX - INCOME_MIN)) * 100,
    0,
    100
  );
}

export function childrenComponent(householdsWithChildrenPct) {
  if (householdsWithChildrenPct == null) return 50;
  return clamp(householdsWithChildrenPct, 0, 100);
}

export function growthComponent(growthRatePct) {
  if (growthRatePct == null) return 50;
  return clamp(
    ((growthRatePct - GROWTH_MIN) / (GROWTH_MAX - GROWTH_MIN)) * 100,
    0,
    100
  );
}

export function competitionComponent(internetAccessPct) {
  if (internetAccessPct == null) return 50;
  // Lower internet access = underserved = higher opportunity
  return clamp(100 - internetAccessPct, 0, 100);
}

export function densityComponent(densityPerSqkm) {
  if (densityPerSqkm == null || densityPerSqkm <= 0) return 10;
  // Gaussian curve peaking at ~500 persons/km² (suburban sweet spot)
  const logDensity = Math.log10(Math.max(densityPerSqkm, 0.1));
  const logPeak = Math.log10(500);
  const sigma = 0.8;
  return clamp(
    100 * Math.exp(-Math.pow(logDensity - logPeak, 2) / (2 * sigma * sigma)),
    0,
    100
  );
}

/**
 * Compute the full opportunity score from demographic inputs.
 * @returns {{ opportunity_score, income_component, children_component, growth_component, competition_component, density_component }}
 */
export function computeScore(demographics, weights = DEFAULT_WEIGHTS) {
  const ic = incomeComponent(demographics.median_household_income_aud);
  const cc = childrenComponent(demographics.households_with_children_pct);
  const gc = growthComponent(demographics.growth_rate_pct);
  const comp = competitionComponent(demographics.internet_access_pct);
  const dc = densityComponent(demographics.population_density_per_sqkm);

  const score =
    ic * weights.income +
    cc * weights.children +
    gc * weights.growth +
    comp * weights.competition +
    dc * weights.density;

  return {
    opportunity_score: Math.round(score * 100) / 100,
    income_component: Math.round(ic * 100) / 100,
    children_component: Math.round(cc * 100) / 100,
    growth_component: Math.round(gc * 100) / 100,
    competition_component: Math.round(comp * 100) / 100,
    density_component: Math.round(dc * 100) / 100,
  };
}

/**
 * Recompute a weighted score from pre-computed components with custom weights.
 * Used by the comparison tool's weight adjustment slider.
 */
export function reweightScore(components, weights) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const score =
    components.income_component * w.income +
    components.children_component * w.children +
    components.growth_component * w.growth +
    components.competition_component * w.competition +
    components.density_component * w.density;
  return Math.round(score * 100) / 100;
}
