import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set — database queries will fail');
}

const sql = neon(process.env.DATABASE_URL || '');

export { sql };

export async function query(strings, ...values) {
  return sql(strings, ...values);
}
