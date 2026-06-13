import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import { getQuestionBankGroup } from '@/lib/questionBank';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { toISTDate } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const groupId = String(body.groupId || '').trim();
    const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.targetDate || ''))
      ? String(body.targetDate)
      : toISTDate();
    const count = Math.max(1, Math.min(50, Number(body.count || 3)));
    const group = getQuestionBankGroup(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Question bank group not found' }, { status: 404 });
    }

    await connectDB();
    const selected = group.questions.slice(0, count);
    const created = await DailyQuestion.insertMany(
      selected.map((question) => ({
        userId,
        title: question.title,
        url: question.url,
        topic: question.topic,
        slug: question.slug,
        targetDate,
        completed: false,
      }))
    );

    return NextResponse.json({ success: true, questions: created }, { status: 201 });
  } catch (error) {
    console.error('Question bank generation failed:', error);
    return NextResponse.json({ error: 'Question bank generation failed' }, { status: 500 });
  }
}
