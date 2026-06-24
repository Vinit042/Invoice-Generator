import dotenv from 'dotenv';

dotenv.config();

/**
 * Builds Prisma-compatible MySQL URL from separate env variables.
 */
export function buildDatabaseUrl() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = process.env.MYSQL_PORT || '3306';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD ?? '';
  const database = process.env.MYSQL_DATABASE || 'bgs_invoice';

  const encodedPassword = encodeURIComponent(password);
  const credentials = password ? `${user}:${encodedPassword}` : user;

  return `mysql://${credentials}@${host}:${port}/${database}`;
}

// Prisma requires DATABASE_URL — build it from MYSQL_* vars
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = buildDatabaseUrl();
}

export default process.env;
