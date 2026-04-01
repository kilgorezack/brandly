/**
 * ABS Data API client (api.data.abs.gov.au)
 *
 * The ABS Data API follows SDMX REST conventions. Responses are in SDMX-JSON format.
 * Census 2021 dataflows used by Signal:
 *   - ABS_CENSUS2021_T01: Population and dwellings
 *   - ABS_CENSUS2021_T02: Medians and averages (income, household size)
 *   - ABS_CENSUS2021_T33: Family composition (households with children)
 *   - ABS_CENSUS2021_T36: Dwelling internet connection
 *
 * Geography dimension codes:
 *   SA4: ASGS level code '4', SA3: '3', SA2: '2'
 *
 * Verify dataflow IDs and dimension structures at:
 *   https://api.data.abs.gov.au/dataflow/ABS
 */

const ABS_API_BASE = 'https://api.data.abs.gov.au';

// In-memory cache: key → { data, expiresAt }
const _cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchAbs(path) {
  const cacheKey = path;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = `${ABS_API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.sdmx.data+json;version=1.0.0',
    },
  });

  if (!res.ok) {
    throw new Error(`ABS API ${res.status}: ${url}`);
  }

  const data = await res.json();
  cacheSet(cacheKey, data);
  return data;
}

/**
 * Parse SDMX-JSON observations into a flat array of objects.
 * Returns [{ dimensionValues: [...], value }]
 */
function parseSdmxObservations(sdmx) {
  const dims = sdmx.structure.dimensions.observation;
  const observations = sdmx.dataSets[0]?.observations || {};

  return Object.entries(observations).map(([key, obs]) => {
    const indices = key.split(':').map(Number);
    const dimensionValues = indices.map((idx, d) => dims[d].values[idx].id);
    return { dimensionValues, value: obs[0] };
  });
}

/**
 * Fetch population data for a given ASGS level.
 * @param {'sa4'|'sa3'|'sa2'} level
 * @returns Array of { regionId, population, dwellingCount }
 */
export async function fetchPopulation(level) {
  const asgsLevel = { sa4: '4', sa3: '3', sa2: '2' }[level];
  // T01: Total persons (Tot_P_P) and total dwellings
  // Dataflow: ABS_CENSUS2021_T01 — verify dimension structure at ABS API
  const path = `/data/ABS_CENSUS2021_T01/all?dimensionAtObservation=AllDimensions&detail=Full`;
  const sdmx = await fetchAbs(path);
  const obs = parseSdmxObservations(sdmx);

  // Filter to desired ASGS level and extract relevant counts
  // Dimension structure varies by dataflow — adjust indices as needed
  return obs
    .filter((o) => o.dimensionValues.some((v) => v.startsWith(asgsLevel)))
    .map((o) => ({
      regionId: o.dimensionValues.find((v) => /^\d{3,}/.test(v)),
      value: o.value,
    }));
}

/**
 * Fetch median household income and avg household size.
 * @param {'sa4'|'sa3'|'sa2'} level
 */
export async function fetchIncomeAndHouseholdSize(level) {
  const path = `/data/ABS_CENSUS2021_T02/all?dimensionAtObservation=AllDimensions&detail=Full`;
  const sdmx = await fetchAbs(path);
  return parseSdmxObservations(sdmx);
}

/**
 * Fetch household internet access data.
 * @param {'sa4'|'sa3'|'sa2'} level
 */
export async function fetchInternetAccess(level) {
  const path = `/data/ABS_CENSUS2021_T36/all?dimensionAtObservation=AllDimensions&detail=Full`;
  const sdmx = await fetchAbs(path);
  return parseSdmxObservations(sdmx);
}

/**
 * Fetch family/household composition data (households with children).
 * @param {'sa4'|'sa3'|'sa2'} level
 */
export async function fetchHouseholdComposition(level) {
  const path = `/data/ABS_CENSUS2021_T33/all?dimensionAtObservation=AllDimensions&detail=Full`;
  const sdmx = await fetchAbs(path);
  return parseSdmxObservations(sdmx);
}

/**
 * List all available Census 2021 dataflows.
 * Use this to verify dataflow IDs and dimension structures.
 */
export async function listDataflows() {
  const path = `/dataflow/ABS`;
  return fetchAbs(path);
}
