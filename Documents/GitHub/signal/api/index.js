import { handle } from '@hono/node-server/vercel';
import app from '../src/worker.js';

export default handle(app);
