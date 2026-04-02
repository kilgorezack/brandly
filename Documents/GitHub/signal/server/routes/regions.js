import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_FILE = path.join(__dirname, '..', '..', 'public', 'sa4.geojson');

const app = new Hono();

// Load static SA4 data once for mock mode
let _staticFeatures = null;
function getStaticFeatures() {
  if (_staticFeatures) return _staticFeatures;
  if (!fs.existsSync(STATIC_FILE)) return [];
  const raw = fs.readFileSync(STATIC_FILE, 'utf8');
  _staticFeatures = JSON.parse(raw).features || [];
  return _staticFeatures;
}

// GET /api/regions?type=sa4&state=NSW
app.get('/', async (c) => {
  const type = c.req.query('type') || 'sa4';
  const state = c.req.query('state');

  if (!process.env.DATABASE_URL) {
    if (type !== 'sa4') return c.json({ regions: [] });
    let features = getStaticFeatures();
    if (state) features = features.filter((f) => f.properties.state_code === state.toUpperCase());
    const regions = features.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      type: 'sa4',
      state_code: f.properties.state_code,
    }));
    c.header('Cache-Control', 'public, max-age=86400');
    return c.json({ regions });
  }

  const { sql } = await import('../services/db.js');
  const validTypes = ['state', 'sa4', 'sa3', 'sa2', 'sa1'];
  if (!validTypes.includes(type)) return c.json({ error: 'Invalid type' }, 400);

  const rows = state
    ? await sql`SELECT id, name, type, parent_id, state_code, centroid_lat, centroid_lng
                FROM regions WHERE type = ${type} AND state_code = ${state.toUpperCase()} ORDER BY name`
    : await sql`SELECT id, name, type, parent_id, state_code, centroid_lat, centroid_lng
                FROM regions WHERE type = ${type} ORDER BY name`;

  c.header('Cache-Control', 'public, max-age=86400');
  return c.json({ regions: rows });
});

// GET /api/regions/:id
app.get('/:id', async (c) => {
  const { id } = c.req.param();

  if (!process.env.DATABASE_URL) {
    const feature = getStaticFeatures().find((f) => f.properties.id === id);
    if (!feature) return c.json({ error: 'Region not found' }, 404);
    const p = feature.properties;
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({
      region: { id: p.id, name: p.name, type: 'sa4', state_code: p.state_code },
      demographics: {
        population: p.population,
        median_household_income_aud: p.median_household_income_aud,
        households_with_children_pct: p.households_with_children_pct,
        avg_household_size: 2.6,
        internet_access_pct: p.internet_access_pct,
        population_density_per_sqkm: p.population_density_per_sqkm,
        growth_rate_pct: null,
      },
      score: {
        opportunity_score: p.opportunity_score,
        income_component: p.income_component,
        children_component: p.children_component,
        growth_component: p.growth_component,
        competition_component: p.competition_component,
        density_component: p.density_component,
      },
      timeSeries: [],
    });
  }

  const { sql } = await import('../services/db.js');
  const [region] = await sql`
    SELECT id, name, type, parent_id, state_code, centroid_lat, centroid_lng, area_sqkm
    FROM regions WHERE id = ${id}`;
  if (!region) return c.json({ error: 'Region not found' }, 404);

  const [demographics] = await sql`
    SELECT * FROM demographics WHERE region_id = ${id} ORDER BY census_year DESC LIMIT 1`;
  const [score] = await sql`
    SELECT * FROM scores WHERE region_id = ${id} AND score_version = 'v1' LIMIT 1`;
  const timeSeries = await sql`
    SELECT metric_name, year, value FROM time_series
    WHERE region_id = ${id} ORDER BY metric_name, year`;

  const popSeries = timeSeries.filter((r) => r.metric_name === 'population');
  let growthRatePct = null;
  if (popSeries.length >= 2) {
    const sorted = popSeries.sort((a, b) => a.year - b.year);
    const oldest = sorted[0].value;
    const newest = sorted[sorted.length - 1].value;
    if (oldest > 0) growthRatePct = ((newest - oldest) / oldest) * 100;
  }

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({
    region,
    demographics: demographics ? { ...demographics, growth_rate_pct: growthRatePct } : null,
    score: score || null,
    timeSeries,
  });
});

// GET /api/regions/:id/children
app.get('/:id/children', async (c) => {
  const { id } = c.req.param();
  if (!process.env.DATABASE_URL) return c.json({ regions: [] });

  const { sql } = await import('../services/db.js');
  const children = await sql`
    SELECT r.id, r.name, r.type, r.parent_id, r.state_code,
           r.centroid_lat, r.centroid_lng, s.opportunity_score
    FROM regions r
    LEFT JOIN scores s ON s.region_id = r.id AND s.score_version = 'v1'
    WHERE r.parent_id = ${id} ORDER BY r.name`;

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({ regions: children });
});

// GET /api/regions/:id/geojson
app.get('/:id/geojson', async (c) => {
  const { id } = c.req.param();

  if (!process.env.DATABASE_URL) {
    const feature = getStaticFeatures().find((f) => f.properties.id === id);
    if (!feature) return c.json({ error: 'Region not found' }, 404);
    c.header('Cache-Control', 'public, max-age=86400');
    return c.json(feature);
  }

  const { sql } = await import('../services/db.js');
  const [row] = (c.req.query('simplified') !== 'false')
    ? await sql`SELECT id, name, type, state_code, ST_AsGeoJSON(geometry_simplified) as geometry FROM regions WHERE id = ${id}`
    : await sql`SELECT id, name, type, state_code, ST_AsGeoJSON(geometry) as geometry FROM regions WHERE id = ${id}`;

  if (!row) return c.json({ error: 'Region not found' }, 404);
  c.header('Cache-Control', 'public, max-age=86400');
  return c.json({
    type: 'Feature',
    geometry: JSON.parse(row.geometry),
    properties: { id: row.id, name: row.name, type: row.type, state_code: row.state_code },
  });
});

export default app;
