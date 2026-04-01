import { Hono } from 'hono';
import { sql } from '../services/db.js';
import { reweightScore } from '../services/scores.js';

const app = new Hono();

/**
 * GET /api/comparison?ids=id1,id2,id3&weights=income:0.4,children:0.2,...
 *
 * Returns 2–5 regions with full metrics. Optional custom weights recalculate
 * the opportunity score without touching the DB.
 */
app.get('/', async (c) => {
  const idsParam = c.req.query('ids');
  if (!idsParam) return c.json({ error: 'ids parameter required' }, 400);

  const ids = idsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (ids.length < 2) {
    return c.json({ error: 'At least 2 ids required' }, 400);
  }

  // Parse optional custom weights: income:0.4,children:0.2,...
  let customWeights = null;
  const weightsParam = c.req.query('weights');
  if (weightsParam) {
    customWeights = {};
    for (const pair of weightsParam.split(',')) {
      const [k, v] = pair.split(':');
      if (k && v) customWeights[k.trim()] = parseFloat(v);
    }
  }

  const rows = await sql`
    SELECT
      r.id, r.name, r.type, r.state_code, r.area_sqkm,
      r.centroid_lat, r.centroid_lng,
      d.population, d.median_household_income_aud,
      d.households_with_children_pct, d.avg_household_size,
      d.internet_access_pct, d.population_density_per_sqkm,
      s.opportunity_score, s.income_component, s.children_component,
      s.growth_component, s.competition_component, s.density_component,
      s.calculated_at
    FROM regions r
    LEFT JOIN demographics d ON d.region_id = r.id AND d.census_year = 2021
    LEFT JOIN scores s ON s.region_id = r.id AND s.score_version = 'v1'
    WHERE r.id = ANY(${ids})`;

  const timeSeries = await sql`
    SELECT region_id, metric_name, year, value
    FROM time_series
    WHERE region_id = ANY(${ids})
    ORDER BY region_id, metric_name, year`;

  const tsByRegion = {};
  for (const row of timeSeries) {
    if (!tsByRegion[row.region_id]) tsByRegion[row.region_id] = [];
    tsByRegion[row.region_id].push(row);
  }

  const regions = rows.map((r) => {
    const components = {
      income_component: r.income_component ?? 0,
      children_component: r.children_component ?? 0,
      growth_component: r.growth_component ?? 0,
      competition_component: r.competition_component ?? 0,
      density_component: r.density_component ?? 0,
    };

    const score = customWeights
      ? reweightScore(components, customWeights)
      : r.opportunity_score ?? 0;

    return {
      region: {
        id: r.id,
        name: r.name,
        type: r.type,
        state_code: r.state_code,
        area_sqkm: r.area_sqkm,
      },
      demographics: {
        population: r.population,
        median_household_income_aud: r.median_household_income_aud,
        households_with_children_pct: r.households_with_children_pct,
        avg_household_size: r.avg_household_size,
        internet_access_pct: r.internet_access_pct,
        population_density_per_sqkm: r.population_density_per_sqkm,
      },
      score: { ...components, opportunity_score: score },
      timeSeries: tsByRegion[r.id] || [],
    };
  });

  // Preserve requested order
  regions.sort((a, b) => ids.indexOf(a.region.id) - ids.indexOf(b.region.id));

  c.header('Cache-Control', 'public, max-age=300');
  return c.json({ regions });
});

export default app;
