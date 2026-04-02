/**
 * Fetches SA4 boundaries from the ABS ArcGIS REST service at build time.
 * Saves to public/sa4.geojson — used by the choropleth when no database is configured.
 *
 * Runs automatically as part of the Vercel build (see vercel.json buildCommand).
 * Also run locally with: node scripts/prebuild-boundaries.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '..', 'public', 'sa4.geojson');

// Verified ABS ArcGIS endpoint for ASGS 2021 SA4 boundaries
const SA4_URL =
  'https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/SA4/FeatureServer/0/query' +
  '?where=1%3D1' +
  '&outFields=sa4_code_2021%2Csa4_name_2021%2Cstate_name_2021' +
  '&geometryPrecision=2' +      // 2 decimal places ≈ 1km precision
  '&maxAllowableOffset=0.01' +  // generalise geometry to ~1km tolerance
  '&returnGeometry=true' +
  '&f=geojson';

const STATE_CODES = {
  'New South Wales': 'NSW', Victoria: 'VIC', Queensland: 'QLD',
  'South Australia': 'SA', 'Western Australia': 'WA', Tasmania: 'TAS',
  'Northern Territory': 'NT', 'Australian Capital Territory': 'ACT',
  'Other Territories': 'OT',
};

function mockScore(code) {
  let hash = 0;
  for (const ch of String(code)) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash % 70) + 15;
}

async function run() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  if (fs.existsSync(OUT_FILE) && fs.statSync(OUT_FILE).size > 50000) {
    console.log('public/sa4.geojson already exists — skipping fetch.');
    return;
  }

  console.log('Fetching SA4 boundaries from ABS ArcGIS…');
  const res = await fetch(SA4_URL, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`ABS responded with HTTP ${res.status}`);

  const geojson = await res.json();
  if (!geojson.features?.length) throw new Error('No features returned from ABS');

  console.log(`  Received ${geojson.features.length} SA4 regions`);

  // Normalise properties and add mock scores
  geojson.features = geojson.features.map((f) => {
    const p = f.properties;
    const code = String(p.sa4_code_2021 || '');
    const name = p.sa4_name_2021 || 'Unknown';
    const stateCode = STATE_CODES[p.state_name_2021] || '';
    const score = mockScore(code);

    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        id: code,
        name,
        type: 'sa4',
        state_code: stateCode,
        opportunity_score: score,
        population: 50000 + mockScore(code + 'p') * 3000,
        median_household_income_aud: 1200 + mockScore(code + 'i') * 15,
        households_with_children_pct: 20 + mockScore(code + 'c') * 0.5,
        internet_access_pct: 60 + mockScore(code + 'n') * 0.35,
        population_density_per_sqkm: mockScore(code + 'd') * 12,
        income_component: mockScore(code + 'ic'),
        children_component: mockScore(code + 'cc'),
        growth_component: mockScore(code + 'gc'),
        competition_component: mockScore(code + 'co'),
        density_component: mockScore(code + 'dc'),
      },
    };
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(geojson));
  const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`Saved public/sa4.geojson (${kb}KB)`);
}

run().catch((err) => {
  console.error('prebuild-boundaries failed:', err.message);
  process.exit(1);
});
