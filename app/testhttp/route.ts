// app/seed/route.ts  或 app/api/seed/route.ts
export const runtime = 'nodejs'; // 也可用 'edge'

import { neon, neonConfig } from '@neondatabase/serverless';
neonConfig.fetchConnectionCache = true; // 可選：重用連線，減少延遲

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`select 1 as ok`; // 連線測試
    // 之後把你的建表/插入搬進來；要交易就：
    // await sql.begin(async (tx) => {
    //   await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    //   await tx`CREATE TABLE IF NOT EXISTS ...`;
    //   await tx`INSERT INTO ...`;
    // });

    return Response.json({ ping: rows, message: 'ready' });
  } catch (e: any) {
    console.error('seed error:', e);
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
