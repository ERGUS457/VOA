import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`DROP TABLE IF EXISTS "User" CASCADE`;
    await sql`DROP TABLE IF EXISTS "AuditLog" CASCADE`;
    await sql`DROP TABLE IF EXISTS "Setting" CASCADE`;
    await sql`DROP TABLE IF EXISTS "VoaMaster" CASCADE`;
    await sql`DROP TABLE IF EXISTS "VoaTransaction" CASCADE`;
    console.log('Old tables dropped successfully');
  } catch (e) {
    console.error('Error dropping tables', e);
  }
}
main();
