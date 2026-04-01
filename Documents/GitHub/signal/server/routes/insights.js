import { Hono } from 'hono';
import { sql } from '../services/db.js';
import { streamInsights } from '../services/claude.js';

const app = new Hono();

/**
 * GET /api/insights/:regionId
 *
 * Server-Sent Events stream of Claude AI analysis for the region.
 * Events:
 *   event: delta  data: {"text":"..."}
 *   event: done   data: {}
 *   event: error  data: {"message":"..."}
 */
app.get('/:regionId', async (c) => {
  const { regionId } = c.req.param();

  const [region] = await sql`
    SELECT id, name, type, state_code FROM regions WHERE id = ${regionId}`;
  if (!region) return c.json({ error: 'Region not found' }, 404);

  const [demographics] = await sql`
    SELECT * FROM demographics WHERE region_id = ${regionId}
    ORDER BY census_year DESC LIMIT 1`;

  const [score] = await sql`
    SELECT * FROM scores WHERE region_id = ${regionId} AND score_version = 'v1' LIMIT 1`;

  // Compute growth rate from time series
  const popSeries = await sql`
    SELECT year, value FROM time_series
    WHERE region_id = ${regionId} AND metric_name = 'population'
    ORDER BY year`;

  let growthRatePct = null;
  if (popSeries.length >= 2) {
    const oldest = popSeries[0].value;
    const newest = popSeries[popSeries.length - 1].value;
    if (oldest > 0) growthRatePct = ((newest - oldest) / oldest) * 100;
  }

  const demographicsWithGrowth = demographics
    ? { ...demographics, growth_rate_pct: growthRatePct }
    : {};

  const scoreData = score || {
    opportunity_score: 0,
    income_component: 0,
    children_component: 0,
    growth_component: 0,
    competition_component: 0,
    density_component: 0,
  };

  // Stream SSE response
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');
  c.header('X-Accel-Buffering', 'no');

  return c.body(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const emit = (event, data) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          for await (const chunk of streamInsights(
            region,
            demographicsWithGrowth,
            scoreData
          )) {
            emit('delta', { text: chunk });
          }
          emit('done', {});
        } catch (err) {
          console.error('Insights stream error:', err);
          emit('error', { message: err.message });
        } finally {
          controller.close();
        }
      },
    })
  );
});

export default app;
