import { NextRequest, NextResponse } from 'next/server';
import { runStreakCheck } from '@/lib/streakCheck';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await runStreakCheck());
  } catch (error) {
    console.error('[error] Cron check failed:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
