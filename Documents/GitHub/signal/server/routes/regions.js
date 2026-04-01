import { Hono } from 'hono';
import { sql } from '../services/db.js';

const app = new Hono();

// GET /api/regions?type=sa4&state=NSW
app.get('/', async (c) => {
  const type = c.req.query('type') || 'sa4';
  const state = c.req.query('state');

  const validTypes = ['state', 'sa4', 'sa3', 'sa2', 'sa1'];
  if (!validTypes.includes(type)) {
    return c.json({ error: 'Invalid type' }, 400);
  }

  const rows = state
    ? await sql`
        SELECT id, name, type, parent_id, state_code, centroid_lat, centroid_lng
        FROM regions
        WHERE type = ${type} AND state_code = ${state.toUpperCase()}
        ORDER BY name`
    : await sql`
        SELECT id, name, type, parent_id, state_code, centroid_lat, centroid_lng
        FROM regions
        WHERE type = ${type}
        ORDER BY name`;

  c.header('Cache-Control', 'public, max-age=86400');
  return c.json({ regions: rows });
});

// GET /api/regions/:id
app.get('/:id', async (c) => {
  const { id } = c.req.param();

  const [region] = await sql`
    SELECT id, name, type, parent_id, state_code, centroid_lat, centroid_lng, area_sqkm
    FROM regions WHERE id = ${id}`;

  if (!region) return c.json({ error: 'Region not found' }, 404);

  const [demographics] = await sql`
    SELECT * FROM demographics WHERE region_id = ${id} ORDER BY census_year DESC LIMIT 1`;

  const [score] = await sql`
    SELECT * FROM scores WHERE region_id = ${id} AND score_version = 'v1' LIMIT 1`;

  // Time series for population sparkline
  const timeSeries = await sql`
    SELECT metric_name, year, value FROM time_series
    WHERE region_id = ${id}
    ORDER BY metric_name, year`;

  // Growth rate derived from time series
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
    demographics: demographics
      ? { ...demographics, growth_rate_pct: growthRatePct }
      : null,
    score: score || null,
    timeSeries,
  });
});

// GET /api/regions/:id/children
app.get('/:id/children', async (c) => {
  const { id } = c.req.param();

  const children = await sql`
    SELECT r.id, r.name, r.type, r.parent_id, r.state_code,
           r.centroid_lat, r.centroid_lng,
           s.opportunity_score
    FROM regions r
    LEFT JOIN scores s ON s.region_id = r.id AND s.score_version = 'v1'
    WHERE r.parent_id = ${id}
    ORDER BY r.name`;

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({ regions: children });
});

// GET /api/regions/:id/geojson
app.get('/:id/geojson', async (c) => {
  const { id } = c.req.param();
  const [row] = (c.req.query('simplified') !== 'false')
    ? await sql`
        SELECT id, name, type, state_code,
               ST_AsGeoJSON(geometry_simplified) as geometry
        FROM regions WHERE id = ${id}`
    : await sql`
        SELECT id, name, type, state_code,
               ST_AsGeoJSON(geometry) as geometry
        FROM regions WHERE id = ${id}`;

  if (!row) return c.json({ error: 'Region not found' }, 404);

  c.header('Cache-Control', 'public, max-age=86400');
  return c.json({
    type: 'Feature',
    geometry: JSON.parse(row.geometry),
    properties: { id: row.id, name: row.name, type: row.type, state_code: row.state_code },
  });
});

export default app;
