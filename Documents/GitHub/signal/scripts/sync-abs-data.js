/**
 * Fetch demographic data from the ABS Data API and populate the demographics
 * and time_series tables. Run after seed-boundaries.js.
 *
 * Usage: npm run db:sync
 *
 * ABS Data API docs: https://api.data.abs.gov.au/
 *
 * IMPORTANT: The ABS Census 2021 dataflow IDs below need to be verified
 * against the live API. To list available dataflows:
 *   curl https://api.data.abs.gov.au/dataflow/ABS | jq '.[]'
 *
 * This script uses the ABS API's SDMX-JSON format. If a dataflow is
 * unavailable or the structure changes, check the ABS API changelog at:
 *   https://www.abs.gov.au/about/data-services/application-programming-interfaces-apis
 */
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
const ABS_BASE = 'https://api.data.abs.gov.au';

// ─── ABS API helpers ─────────────────────────────────────────────────────────

async function fetchSdmx(dataflowId, filter = 'all', params = {}) {
  const qs = new URLSearchParams({
    dimensionAtObservation: 'AllDimensions',
    detail: 'Full',
    ...params,
  });
  const url = `${ABS_BASE}/data/${dataflowId}/${filter}?${qs}`;
  console.log(`  Fetching ${url}`);
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.sdmx.data+json;version=1.0.0' },
  });
  if (!res.ok) throw new Error(`ABS API ${res.status} for ${dataflowId}`);
  return res.json();
}

/**
 * Parse SDMX-JSON into a flat array of { [dimId]: value } objects.
 * Each observation key is "dim0:dim1:...:dimN" indices.
 */
function parseSdmx(sdmx) {
  const dims = sdmx.structure.dimensions.observation;
  const observations = sdmx.dataSets?.[0]?.observations || {};

  return Object.entries(observations).map(([key, obs]) => {
    const indices = key.split(':').map(Number);
    const row = { _value: obs[0] };
    indices.forEach((idx, d) => {
      row[dims[d].id] = dims[d].values[idx]?.id;
    });
    return row;
  });
}

// ─── Fetch functions per Census table ────────────────────────────────────────

/**
 * T01: Population counts by SA level.
 * Relevant measure: Total persons (Tot_P_P)
 * ASGS dimension: geography code
 */
async function fetchPopulationData() {
  // NOTE: Verify dataflow ID and measure codes at https://api.data.abs.gov.au
  // Possible IDs: ABS_CENSUS2021_T01, C21_T01, CENSUS_2021_T01
  const sdmx = await fetchSdmx('ABS_CENSUS2021_T01');
  return parseSdmx(sdmx);
}

/**
 * T02: Median and average household statistics.
 * Includes: Median_tot_hhd_inc_weekly, Average_household_size
 */
async function fetchMediansData() {
  const sdmx = await fetchSdmx('ABS_CENSUS2021_T02');
  return parseSdmx(sdmx);
}

/**
 * T33: Family and household composition.
 * Used to derive: households_with_children_pct
 */
async function fetchHouseholdCompositionData() {
  const sdmx = await fetchSdmx('ABS_CENSUS2021_T33');
  return parseSdmx(sdmx);
}

/**
 * T36: Dwelling internet connection.
 * Used for: internet_access_pct (competition proxy)
 */
async function fetchInternetData() {
  const sdmx = await fetchSdmx('ABS_CENSUS2021_T36');
  return parseSdmx(sdmx);
}

// ─── Database upsert ─────────────────────────────────────────────────────────

/**
 * Merge all fetched data into the demographics table.
 * Each source populates different columns; we use ON CONFLICT DO UPDATE
 * to accumulate values from multiple API calls.
 *
 * Adjust the column mappings below to match actual SDMX dimension/measure IDs
 * returned by the ABS API.
 */
async function upsertDemographics(regionId, year, fields) {
  await sql`
    INSERT INTO demographics (
      region_id, census_year,
      population, dwelling_count,
      median_household_income_aud, households_with_children_pct,
      avg_household_size, internet_access_pct
    ) VALUES (
      ${regionId}, ${year},
      ${fields.population ?? null},
      ${fields.dwellingCount ?? null},
      ${fields.medianIncome ?? null},
      ${fields.childrenPct ?? null},
      ${fields.avgHouseholdSize ?? null},
      ${fields.internetPct ?? null}
    )
    ON CONFLICT (region_id, census_year) DO UPDATE SET
      population                   = COALESCE(EXCLUDED.population, demographics.population),
      dwelling_count               = COALESCE(EXCLUDED.dwelling_count, demographics.dwelling_count),
      median_household_income_aud  = COALESCE(EXCLUDED.median_household_income_aud, demographics.median_household_income_aud),
      households_with_children_pct = COALESCE(EXCLUDED.households_with_children_pct, demographics.households_with_children_pct),
      avg_household_size           = COALESCE(EXCLUDED.avg_household_size, demographics.avg_household_size),
      internet_access_pct          = COALESCE(EXCLUDED.internet_access_pct, demographics.internet_access_pct),
      updated_at                   = NOW()`;
}

async function upsertTimeSeries(regionId, metricName, year, value, source) {
  await sql`
    INSERT INTO time_series (region_id, metric_name, year, value, source)
    VALUES (${regionId}, ${metricName}, ${year}, ${value}, ${source})
    ON CONFLICT (region_id, metric_name, year) DO UPDATE SET
      value = EXCLUDED.value, source = EXCLUDED.source`;
}

// ─── Density update (computed from regions table) ────────────────────────────

async function updateDensity() {
  console.log('  Updating population density from area...');
  await sql`
    UPDATE demographics d
    SET population_density_per_sqkm = d.population::NUMERIC / NULLIF(r.area_sqkm, 0)
    FROM regions r
    WHERE d.region_id = r.id
      AND d.population IS NOT NULL
      AND r.area_sqkm > 0`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('Syncing ABS Census 2021 data...\n');
  console.log('NOTE: SDMX dimension/measure names below are placeholders.');
  console.log('      Verify against: https://api.data.abs.gov.au/dataflow/ABS\n');

  // Step 1: Fetch all data
  let popData, mediansData, householdData, internetData;

  try {
    popData = await fetchPopulationData();
    console.log(`  Population: ${popData.length} observations`);
  } catch (e) {
    console.error('  Population fetch failed:', e.message);
  }

  try {
    mediansData = await fetchMediansData();
    console.log(`  Medians: ${mediansData.length} observations`);
  } catch (e) {
    console.error('  Medians fetch failed:', e.message);
  }

  try {
    householdData = await fetchHouseholdCompositionData();
    console.log(`  Household composition: ${householdData.length} observations`);
  } catch (e) {
    console.error('  Household composition fetch failed:', e.message);
  }

  try {
    internetData = await fetchInternetData();
    console.log(`  Internet access: ${internetData.length} observations`);
  } catch (e) {
    console.error('  Internet access fetch failed:', e.message);
  }

  // Step 2: Get all known region IDs
  const regions = await sql`SELECT id FROM regions`;
  const regionIds = new Set(regions.map((r) => r.id));
  console.log(`\n  ${regionIds.size} regions in database`);

  // Step 3: Map and upsert
  // NOTE: Replace 'REGION_CODE', 'TOT_P_P', etc. with actual dimension IDs
  // from the SDMX response structure.

  if (popData) {
    console.log('\n  Upserting population data...');
    let n = 0;
    for (const obs of popData) {
      // ADJUST: obs.ASGS_CODE_2021 → actual geography dimension ID
      const regionId = obs['ASGS_CODE_2021'] || obs['REGION'];
      if (!regionId || !regionIds.has(regionId)) continue;
      // ADJUST: obs.TOT_P_P → actual measure code for total persons
      const population = obs._value ?? obs['TOT_P_P'];
      if (population == null) continue;
      await upsertDemographics(regionId, 2021, { population: Math.round(population) });
      await upsertTimeSeries(regionId, 'population', 2021, population, 'abs_census_2021');
      n++;
    }
    console.log(`  → ${n} population records upserted`);
  }

  if (mediansData) {
    console.log('\n  Upserting median income + household size...');
    let n = 0;
    for (const obs of mediansData) {
      const regionId = obs['ASGS_CODE_2021'] || obs['REGION'];
      if (!regionId || !regionIds.has(regionId)) continue;
      // ADJUST measure codes to match actual SDMX response
      const medianIncome = obs['MEDIAN_TOT_HHD_INC_WEEKLY'] ?? obs._value;
      const avgHouseholdSize = obs['AVG_HHD_SIZE'];
      if (medianIncome == null && avgHouseholdSize == null) continue;
      await upsertDemographics(regionId, 2021, {
        medianIncome: medianIncome ? Math.round(medianIncome) : null,
        avgHouseholdSize: avgHouseholdSize ? parseFloat(avgHouseholdSize) : null,
      });
      n++;
    }
    console.log(`  → ${n} income records upserted`);
  }

  if (internetData) {
    console.log('\n  Upserting internet access...');
    let n = 0;
    for (const obs of internetData) {
      const regionId = obs['ASGS_CODE_2021'] || obs['REGION'];
      if (!regionId || !regionIds.has(regionId)) continue;
      // ADJUST: calculate pct from total dwellings with internet / total dwellings
      const internetPct = obs['INTERNET_ACCESS_PCT'] ?? obs._value;
      if (internetPct == null) continue;
      await upsertDemographics(regionId, 2021, {
        internetPct: parseFloat(internetPct),
      });
      n++;
    }
    console.log(`  → ${n} internet access records upserted`);
  }

  // Step 4: Compute density
  await updateDensity();

  console.log('\nSync complete. Run npm run db:scores to calculate opportunity scores.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
