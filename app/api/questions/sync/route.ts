import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import User from '@/models/User';
import { getRecentAcceptedSubmissions } from '@/lib/leetcode';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { dateInTimezoneFromUnix, getQuestionSlug, toISTDate } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : toISTDate();
}

export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetDate = validDate(body.targetDate || null);

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const questions = await DailyQuestion.find({ userId, targetDate, completed: false });
    const recent = await getRecentAcceptedSubmissions(user.leetcodeUsername, 100);
    const solvedSlugs = new Set(
      recent
        .filter((submission) => dateInTimezoneFromUnix(submission.timestamp, user.timezone) === targetDate)
        .map((submission) => submission.titleSlug)
    );

    const matchedIds = questions
      .filter((question) => solvedSlugs.has(getQuestionSlug(question)))
      .map((question) => question._id);

    if (matchedIds.length) {
      await DailyQuestion.updateMany(
        { _id: { $in: matchedIds }, userId },
        { completed: true }
      );
    }

    const updatedQuestions = await DailyQuestion.find({ userId, targetDate }).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      updated: matchedIds.length,
      questions: updatedQuestions,
    });
  } catch (error) {
    console.error('Question sync failed:', error);
    return NextResponse.json({ error: 'Question sync failed' }, { status: 500 });
  }
}
