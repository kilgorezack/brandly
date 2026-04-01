/**
 * Load ABS ASGS 2021 boundary GeoJSON into the regions table.
 * Usage: npm run db:seed
 *
 * Before running, download the ASGS 2021 boundary GeoJSON files from:
 *   https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files
 *
 * Download (GDA2020 GeoJSON format) and place files at:
 *   data/SA4_2021_AUST_GDA2020.json
 *   data/SA3_2021_AUST_GDA2020.json
 *   data/SA2_2021_AUST_GDA2020.json
 *
 * Note: Files are large (SA2 ~50MB). The data/ directory is .gitignored.
 * Run this script once per environment after downloading the files.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);

// ABS ASGS field name mappings per SA level
const FIELD_MAPS = {
  sa4: {
    id: 'SA4_CODE_2021',
    name: 'SA4_NAME_2021',
    stateCode: 'STE_NAME_2021',
    file: 'SA4_2021_AUST_GDA2020.json',
    type: 'sa4',
  },
  sa3: {
    id: 'SA3_CODE_2021',
    name: 'SA3_NAME_2021',
    stateCode: 'STE_NAME_2021',
    file: 'SA3_2021_AUST_GDA2020.json',
    type: 'sa3',
  },
  sa2: {
    id: 'SA2_CODE_2021',
    name: 'SA2_NAME_2021',
    stateCode: 'STE_NAME_2021',
    file: 'SA2_2021_AUST_GDA2020.json',
    type: 'sa2',
  },
};

// ABS state names → 3-letter codes used by Signal
const STATE_CODES = {
  'New South Wales': 'NSW',
  Victoria: 'VIC',
  Queensland: 'QLD',
  'South Australia': 'SA',
  'Western Australia': 'WA',
  Tasmania: 'TAS',
  'Northern Territory': 'NT',
  'Australian Capital Territory': 'ACT',
  'Other Territories': 'OT',
};

// Parent ID derivation: SA3 code = first 5 chars of SA2 code, etc.
// SA4 code = first 3 chars of SA3 code
function deriveParentId(id, type) {
  if (type === 'sa2') return id.slice(0, 5);   // SA3 code
  if (type === 'sa3') return id.slice(0, 3);   // SA4 code
  return null;
}

async function loadLevel(levelKey) {
  const map = FIELD_MAPS[levelKey];
  const filePath = path.join(__dirname, '..', 'data', map.file);

  if (!fs.existsSync(filePath)) {
    console.warn(`  Skipping ${levelKey}: ${map.file} not found in data/`);
    return 0;
  }

  console.log(`  Loading ${levelKey} from ${map.file}...`);
  const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const features = geojson.features;

  let inserted = 0;
  const BATCH = 50;

  for (let i = 0; i < features.length; i += BATCH) {
    const batch = features.slice(i, i + BATCH);

    for (const feature of batch) {
      const props = feature.properties;
      const id = String(props[map.id]);
      const name = props[map.name];
      const stateFullName = props[map.stateCode] || '';
      const stateCode = STATE_CODES[stateFullName] || stateFullName.slice(0, 3).toUpperCase();
      const parentId = deriveParentId(id, map.type);
      const geomJson = JSON.stringify(feature.geometry);

      try {
        await sql`
          INSERT INTO regions (id, name, type, parent_id, state_code, geometry, geometry_simplified)
          VALUES (
            ${id}, ${name}, ${map.type}, ${parentId}, ${stateCode},
            ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
            ST_SimplifyPreserveTopology(
              ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
              0.001
            )
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            geometry = EXCLUDED.geometry,
            geometry_simplified = EXCLUDED.geometry_simplified`;
        inserted++;
      } catch (err) {
        console.error(`  Error inserting ${id} (${name}):`, err.message);
      }
    }

    console.log(`  ${levelKey}: ${Math.min(i + BATCH, features.length)}/${features.length}`);
  }

  // Update centroids and area after inserting geometry
  await sql`
    UPDATE regions
    SET
      centroid_lat = ST_Y(ST_Centroid(geometry)),
      centroid_lng = ST_X(ST_Centroid(geometry)),
      area_sqkm    = ST_Area(ST_Transform(geometry, 3577)) / 1000000.0
    WHERE type = ${map.type} AND centroid_lat IS NULL`;

  return inserted;
}

async function run() {
  console.log('Seeding ABS ASGS 2021 boundaries...\n');

  // Load SA4 first (no parent dependency), then SA3, then SA2
  for (const level of ['sa4', 'sa3', 'sa2']) {
    const n = await loadLevel(level);
    console.log(`  → ${n} ${level} regions inserted/updated\n`);
  }

  console.log('Done. Run npm run db:sync to load demographics.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
