import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple locations — home dir persists across Hostinger deploys
const envPaths = [
  path.join(__dirname, '..', '.env'),                    // backend/.env (local dev)
  path.join(process.env.HOME || '', '.env_bgs'),          // ~/.env_bgs (Hostinger persistent)
  '/home/u120066322/.env_bgs',                            // absolute fallback
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath, override: true });
  if (!result.error) break;
}

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
