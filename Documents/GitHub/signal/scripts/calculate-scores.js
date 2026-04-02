/**
 * Compute Broadband Opportunity Scores for all regions and upsert into scores table.
 * Usage: npm run db:scores
 *
 * Run after npm run db:sync.
 */
import 'dotenv/config';
import postgres from 'postgres';
import {
  computeScore,
  DEFAULT_WEIGHTS,
} from '../server/services/scores.js';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function run() {
  console.log('Calculating opportunity scores...\n');

  // Fetch all demographics with time-series growth rates
  const rows = await sql`
    SELECT
      d.region_id,
      d.population,
      d.median_household_income_aud,
      d.households_with_children_pct,
      d.avg_household_size,
      d.internet_access_pct,
      d.population_density_per_sqkm,
      -- Compute growth from time_series (2016→2021 population)
      ts_new.value  AS pop_2021,
      ts_old.value  AS pop_2016
    FROM demographics d
    LEFT JOIN time_series ts_new
      ON ts_new.region_id = d.region_id
      AND ts_new.metric_name = 'population'
      AND ts_new.year = 2021
    LEFT JOIN time_series ts_old
      ON ts_old.region_id = d.region_id
      AND ts_old.metric_name = 'population'
      AND ts_old.year = 2016
    WHERE d.census_year = 2021`;

  console.log(`  ${rows.length} regions to score`);

  let processed = 0;
  const BATCH = 100;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    for (const row of batch) {
      let growthRatePct = null;
      if (row.pop_2016 > 0 && row.pop_2021 != null) {
        growthRatePct = ((row.pop_2021 - row.pop_2016) / row.pop_2016) * 100;
      }

      const demographics = {
        median_household_income_aud: row.median_household_income_aud,
        households_with_children_pct: row.households_with_children_pct,
        internet_access_pct: row.internet_access_pct,
        population_density_per_sqkm: row.population_density_per_sqkm,
        growth_rate_pct: growthRatePct,
      };

      const score = computeScore(demographics, DEFAULT_WEIGHTS);

      await sql`
        INSERT INTO scores (
          region_id, opportunity_score,
          income_component, children_component, growth_component,
          competition_component, density_component,
          score_version, calculated_at
        ) VALUES (
          ${row.region_id}, ${score.opportunity_score},
          ${score.income_component}, ${score.children_component}, ${score.growth_component},
          ${score.competition_component}, ${score.density_component},
          'v1', NOW()
        )
        ON CONFLICT (region_id, score_version) DO UPDATE SET
          opportunity_score     = EXCLUDED.opportunity_score,
          income_component      = EXCLUDED.income_component,
          children_component    = EXCLUDED.children_component,
          growth_component      = EXCLUDED.growth_component,
          competition_component = EXCLUDED.competition_component,
          density_component     = EXCLUDED.density_component,
          calculated_at         = NOW()`;

      processed++;
    }

    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length} scored`);
  }

  // Summary stats
  const stats = await sql`
    SELECT
      COUNT(*) AS total,
      ROUND(AVG(opportunity_score), 1) AS avg_score,
      MAX(opportunity_score) AS max_score,
      MIN(opportunity_score) AS min_score
    FROM scores WHERE score_version = 'v1'`;

  console.log('\nScore summary:');
  console.table(stats);
  console.log('\nDone. Scores are live.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
