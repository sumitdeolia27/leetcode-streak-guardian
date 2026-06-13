import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import { getQuestionBankGroup } from '@/lib/questionBank';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { addDays, startOfWeek } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

type ScheduleItem = {
  day: number;
  groupId: string;
  count: number;
};

export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const schedule = Array.isArray(body.schedule) ? (body.schedule as ScheduleItem[]) : [];
    const weekStart = String(body.weekStart || '').match(/^\d{4}-\d{2}-\d{2}$/)
      ? new Date(`${body.weekStart}T12:00:00`)
      : startOfWeek();

    const docs = schedule.flatMap((item) => {
      const group = getQuestionBankGroup(String(item.groupId || ''));
      if (!group) return [];

      const targetDate = addDays(weekStart, Number(item.day || 0)).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      const count = Math.max(0, Math.min(50, Number(item.count || 0)));

      return group.questions.slice(0, count).map((question) => ({
        userId,
        title: question.title,
        url: question.url,
        topic: question.topic,
        slug: question.slug,
        targetDate,
        completed: false,
      }));
    });

    if (!docs.length) {
      return NextResponse.json({ error: 'Choose at least one weekday topic and count' }, { status: 400 });
    }

    await connectDB();
    const created = await DailyQuestion.insertMany(docs);

    return NextResponse.json({ success: true, created: created.length }, { status: 201 });
  } catch (error) {
    console.error('Weekly plan generation failed:', error);
    return NextResponse.json({ error: 'Weekly plan generation failed' }, { status: 500 });
  }
}
