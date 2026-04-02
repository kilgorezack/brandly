import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set — database queries will fail');
}

const sql = postgres(process.env.DATABASE_URL || '', {
  ssl: 'require',
  max: 1, // keep connections low for serverless
});

export { sql };
