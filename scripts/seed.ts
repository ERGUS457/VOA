import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/schema';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function main() {
  console.log('Seeding database...');
  
  // Seed Users
  const adminPass = await bcrypt.hash('admin123', 10);
  const petugasPass = await bcrypt.hash('petugas123', 10);
  
  await db.insert(schema.users).values([
    {
      name: 'Administrator',
      username: 'admin',
      password: adminPass,
      role: 'ADMIN',
    },
    {
      name: 'Petugas Loket 1',
      username: 'petugas1',
      password: petugasPass,
      role: 'PETUGAS',
    }
  ]).onConflictDoNothing({ target: schema.users.username });
  console.log('Users seeded');

  // Seed Tariff Settings (if empty, normally should check first but this is simplified)
  try {
    await db.insert(schema.tariffSettings).values([
      { voaPrice: '500000', serviceFee: '13500' }
    ]);
    console.log('Tariff settings seeded');
  } catch (e) {
    console.log('Tariff settings might already exist');
  }
  
  // Seed VOA Master
  const voas = [];
  for (let i = 1; i <= 5; i++) {
    voas.push({ voaNumber: `VOA-ARUK-00000${i}` });
  }
  
  await db.insert(schema.voaMaster).values(voas).onConflictDoNothing({ target: schema.voaMaster.voaNumber });
  console.log('VOA Master seeded');
  
  console.log('Database seeding completed successfully.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
