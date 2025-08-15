// app/seed/route.ts 或 app/api/seed/route.ts
export const runtime = 'nodejs';

import bcrypt from 'bcrypt';
import { neon, neonConfig } from '@neondatabase/serverless';
import { invoices, customers, revenue, users } from '@/app/lib/placeholder-data'; // ←依你實際路徑調整

neonConfig.fetchConnectionCache = true; // 可選：重用連線
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!); // 要含 ?sslmode=require

async function ensureExtensions() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  // 如果這個 extension 不可用，可改：
  // await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
}

async function seedUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      -- 若用 pgcrypto：id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await sql`
      INSERT INTO users (id, name, email, password)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${hashed})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedCustomers() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  for (const c of customers) {
    await sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${c.id}, ${c.name}, ${c.email}, ${c.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedInvoices() {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  for (const inv of invoices) {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${inv.customer_id}, ${inv.amount}, ${inv.status}, ${inv.date})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  for (const r of revenue) {
    await sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${r.month}, ${r.revenue})
      ON CONFLICT (month) DO NOTHING;
    `;
  }
}

export async function GET() {
  try {
    await ensureExtensions();
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    return Response.json({ message: 'Database seeded successfully' });
  } catch (e: any) {
    console.error('seed error:', e);
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
