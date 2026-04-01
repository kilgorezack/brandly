/**
 * Run this once to create the Signal database schema.
 * Usage: npm run db:schema
 *
 * Requires DATABASE_URL in .env pointing to a Neon PostgreSQL database
 * with the PostGIS extension enabled.
 *
 * To enable PostGIS on Neon:
 *   1. Go to your Neon project → Extensions tab
 *   2. Enable "postgis"
 *   OR run: CREATE EXTENSION IF NOT EXISTS postgis;
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Creating schema...');

  await sql`CREATE EXTENSION IF NOT EXISTS postgis`;

  await sql`
    CREATE TABLE IF NOT EXISTS regions (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      type                 TEXT NOT NULL CHECK (type IN ('state','sa4','sa3','sa2','sa1')),
      parent_id            TEXT REFERENCES regions(id),
      state_code           TEXT NOT NULL,
      centroid_lat         DOUBLE PRECISION,
      centroid_lng         DOUBLE PRECISION,
      geometry             GEOMETRY(MultiPolygon, 4326),
      geometry_simplified  GEOMETRY(MultiPolygon, 4326),
      area_sqkm            DOUBLE PRECISION,
      created_at           TIMESTAMPTZ DEFAULT NOW()
    )`;

  await sql`CREATE INDEX IF NOT EXISTS regions_type_idx      ON regions(type)`;
  await sql`CREATE INDEX IF NOT EXISTS regions_parent_idx    ON regions(parent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS regions_state_idx     ON regions(state_code)`;
  await sql`CREATE INDEX IF NOT EXISTS regions_geom_idx      ON regions USING GIST(geometry)`;
  await sql`CREATE INDEX IF NOT EXISTS regions_geom_simp_idx ON regions USING GIST(geometry_simplified)`;

  await sql`
    CREATE TABLE IF NOT EXISTS demographics (
      id                           SERIAL PRIMARY KEY,
      region_id                    TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      census_year                  INTEGER NOT NULL DEFAULT 2021,
      population                   INTEGER,
      dwelling_count               INTEGER,
      median_household_income_aud  INTEGER,
      households_with_children_pct NUMERIC(5,2),
      avg_household_size           NUMERIC(4,2),
      internet_access_pct          NUMERIC(5,2),
      population_density_per_sqkm  NUMERIC(12,4),
      updated_at                   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(region_id, census_year)
    )`;

  await sql`CREATE INDEX IF NOT EXISTS demographics_region_idx ON demographics(region_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS time_series (
      id          SERIAL PRIMARY KEY,
      region_id   TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      metric_name TEXT NOT NULL,
      year        INTEGER NOT NULL,
      value       NUMERIC(14,4),
      source      TEXT,
      UNIQUE(region_id, metric_name, year)
    )`;

  await sql`CREATE INDEX IF NOT EXISTS time_series_region_idx  ON time_series(region_id)`;
  await sql`CREATE INDEX IF NOT EXISTS time_series_metric_idx  ON time_series(metric_name, year)`;

  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id                    SERIAL PRIMARY KEY,
      region_id             TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      opportunity_score     NUMERIC(5,2) NOT NULL,
      income_component      NUMERIC(5,2),
      children_component    NUMERIC(5,2),
      growth_component      NUMERIC(5,2),
      competition_component NUMERIC(5,2),
      density_component     NUMERIC(5,2),
      score_version         TEXT NOT NULL DEFAULT 'v1',
      calculated_at         TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(region_id, score_version)
    )`;

  await sql`CREATE INDEX IF NOT EXISTS scores_region_idx ON scores(region_id)`;
  await sql`CREATE INDEX IF NOT EXISTS scores_score_idx  ON scores(opportunity_score DESC)`;

  console.log('Schema created successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
