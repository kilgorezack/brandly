import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_FILE = path.join(__dirname, '..', '..', 'public', 'sa4.geojson');

const app = new Hono();

/**
 * GET /api/choropleth?type=sa4&state=NSW&parent=10101
 *
 * Returns a GeoJSON FeatureCollection with simplified geometry + opportunity
 * score for each region.
 *
 * When DATABASE_URL is set: queries the database (full data).
 * When not set: serves the pre-built static SA4 file with mock scores.
 */
app.get('/', async (c) => {
  const type = c.req.query('type') || 'sa4';
  const state = c.req.query('state');
  const parentId = c.req.query('parent');

  const validTypes = ['state', 'sa4', 'sa3', 'sa2', 'sa1'];
  if (!validTypes.includes(type)) {
    return c.json({ error: 'Invalid type' }, 400);
  }

  // ── No database: serve static pre-built file ──────────────────────────────
  if (!process.env.DATABASE_URL) {
    if (type !== 'sa4') {
      return c.json({ type: 'FeatureCollection', features: [], meta: { mock: true } });
    }

    if (!fs.existsSync(STATIC_FILE)) {
      return c.json({
        type: 'FeatureCollection',
        features: [],
        meta: { error: 'Boundary file not found. Run: node scripts/prebuild-boundaries.js' },
      });
    }

    const raw = fs.readFileSync(STATIC_FILE, 'utf8');
    const geojson = JSON.parse(raw);

    let features = geojson.features;
    if (state) {
      features = features.filter(
        (f) => f.properties.state_code === state.toUpperCase()
      );
    }

    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({ ...geojson, features, meta: { mock: true, count: features.length } });
  }

  // ── Database mode ─────────────────────────────────────────────────────────
  const { sql } = await import('../services/db.js');

  let rows;
  if (parentId) {
    rows = await sql`
      SELECT r.id, r.name, r.type, r.state_code, r.area_sqkm,
             r.centroid_lat, r.centroid_lng,
             d.population, d.median_household_income_aud,
             d.households_with_children_pct, d.internet_access_pct,
             d.population_density_per_sqkm,
             s.opportunity_score, s.income_component, s.children_component,
             s.growth_component, s.competition_component, s.density_component,
             ST_AsGeoJSON(r.geometry_simplified) AS geometry
      FROM regions r
      LEFT JOIN demographics d ON d.region_id = r.id AND d.census_year = 2021
      LEFT JOIN scores s ON s.region_id = r.id AND s.score_version = 'v1'
      WHERE r.type = ${type} AND r.parent_id = ${parentId}
      ORDER BY r.id`;
  } else if (state) {
    rows = await sql`
      SELECT r.id, r.name, r.type, r.state_code, r.area_sqkm,
             r.centroid_lat, r.centroid_lng,
             d.population, d.median_household_income_aud,
             d.households_with_children_pct, d.internet_access_pct,
             d.population_density_per_sqkm,
             s.opportunity_score, s.income_component, s.children_component,
             s.growth_component, s.competition_component, s.density_component,
             ST_AsGeoJSON(r.geometry_simplified) AS geometry
      FROM regions r
      LEFT JOIN demographics d ON d.region_id = r.id AND d.census_year = 2021
      LEFT JOIN scores s ON s.region_id = r.id AND s.score_version = 'v1'
      WHERE r.type = ${type} AND r.state_code = ${state.toUpperCase()}
      ORDER BY r.id`;
  } else {
    rows = await sql`
      SELECT r.id, r.name, r.type, r.state_code, r.area_sqkm,
             r.centroid_lat, r.centroid_lng,
             d.population, d.median_household_income_aud,
             d.households_with_children_pct, d.internet_access_pct,
             d.population_density_per_sqkm,
             s.opportunity_score, s.income_component, s.children_component,
             s.growth_component, s.competition_component, s.density_component,
             ST_AsGeoJSON(r.geometry_simplified) AS geometry
      FROM regions r
      LEFT JOIN demographics d ON d.region_id = r.id AND d.census_year = 2021
      LEFT JOIN scores s ON s.region_id = r.id AND s.score_version = 'v1'
      WHERE r.type = ${type}
      ORDER BY r.id`;
  }

  const features = rows
    .filter((r) => r.geometry)
    .map((r) => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: {
        id: r.id, name: r.name, type: r.type, state_code: r.state_code,
        population: r.population,
        median_household_income_aud: r.median_household_income_aud,
        households_with_children_pct: r.households_with_children_pct,
        internet_access_pct: r.internet_access_pct,
        population_density_per_sqkm: r.population_density_per_sqkm,
        opportunity_score: r.opportunity_score ?? 0,
        income_component: r.income_component ?? 0,
        children_component: r.children_component ?? 0,
        growth_component: r.growth_component ?? 0,
        competition_component: r.competition_component ?? 0,
        density_component: r.density_component ?? 0,
      },
    }));

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({ type: 'FeatureCollection', features, meta: { count: features.length, type } });
});

export default app;
