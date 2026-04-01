import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import regionsRoute from '../server/routes/regions.js';
import choroplethRoute from '../server/routes/choropleth.js';
import comparisonRoute from '../server/routes/comparison.js';
import insightsRoute from '../server/routes/insights.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/api/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.route('/api/regions', regionsRoute);
app.route('/api/choropleth', choroplethRoute);
app.route('/api/comparison', comparisonRoute);
app.route('/api/insights', insightsRoute);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error', detail: err.message }, 500);
});

export default app;
