import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { toISTDate } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

export async function GET(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = validDate(req.nextUrl.searchParams.get('start')) || toISTDate();
    const end = validDate(req.nextUrl.searchParams.get('end')) || start;
    const today = toISTDate();

    await connectDB();
    const questions = await DailyQuestion.find({
      userId,
      targetDate: { $gte: start, $lte: end },
    }).sort({ targetDate: 1, createdAt: 1 });

    const byDate = new Map<string, { date: string; planned: number; completed: number; pending: number; missed: number }>();

    questions.forEach((question) => {
      const current = byDate.get(question.targetDate) || {
        date: question.targetDate,
        planned: 0,
        completed: 0,
        pending: 0,
        missed: 0,
      };

      current.planned += 1;
      if (question.completed) current.completed += 1;
      else current.pending += 1;
      if (question.targetDate < today && !question.completed) current.missed += 1;
      byDate.set(question.targetDate, current);
    });

    return NextResponse.json({ days: Array.from(byDate.values()) });
  } catch (error) {
    console.error('Question summary failed:', error);
    return NextResponse.json({ error: 'Question summary failed' }, { status: 500 });
  }
}
