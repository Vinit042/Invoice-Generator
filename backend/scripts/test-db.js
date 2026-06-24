import '../config/env.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  await prisma.$connect();
  console.log('Database connection: SUCCESS');
  console.log(`Connected to: ${process.env.MYSQL_DATABASE} @ ${process.env.MYSQL_HOST}`);
} catch (error) {
  console.error('Database connection: FAILED');
  console.error(error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
