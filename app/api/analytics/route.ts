import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { toISTDate } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const today = toISTDate();
    const questions = await DailyQuestion.find({ userId }).sort({ targetDate: 1 });
    const completed = questions.filter((question) => question.completed);
    const missed = questions.filter((question) => question.targetDate < today && !question.completed);
    const plannedDates = new Set(questions.map((question) => question.targetDate));
    const topicMap = new Map<string, { topic: string; total: number; completed: number; missed: number }>();

    questions.forEach((question) => {
      const topic = question.topic || 'General';
      const current = topicMap.get(topic) || { topic, total: 0, completed: 0, missed: 0 };
      current.total += 1;
      if (question.completed) current.completed += 1;
      if (question.targetDate < today && !question.completed) current.missed += 1;
      topicMap.set(topic, current);
    });

    const topicStats = Array.from(topicMap.values()).sort((a, b) => b.total - a.total);
    const weakTopics = [...topicStats].sort((a, b) => b.missed - a.missed).slice(0, 3);

    return NextResponse.json({
      totalSolved: completed.length,
      totalPlanned: questions.length,
      missedDays: new Set(missed.map((question) => question.targetDate)).size,
      averageQuestionsPerDay: plannedDates.size ? Number((questions.length / plannedDates.size).toFixed(1)) : 0,
      topicStats,
      weakTopics,
    });
  } catch (error) {
    console.error('Analytics failed:', error);
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}
