import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Default to a dummy URL so it compiles without .env in build time if needed
const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy');
export const db = drizzle(sql);
