import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import User from '@/models/User';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { sendDailyQuestionAlert, sendTelegramAlert } from '@/lib/telegram';
import { toISTDate } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.telegramChatId) {
      return NextResponse.json({ error: 'Telegram chat ID is missing' }, { status: 400 });
    }

    const today = toISTDate();
    const pendingQuestions = await DailyQuestion.find({
      userId: user._id,
      targetDate: today,
      completed: false,
    }).sort({ createdAt: 1 });

    const messageId = pendingQuestions.length
      ? await sendDailyQuestionAlert(user.telegramChatId, user.leetcodeUsername, pendingQuestions)
      : await sendTelegramAlert(user.telegramChatId, user.leetcodeUsername);

    return NextResponse.json({
      success: true,
      messageId,
      type: pendingQuestions.length ? 'planned_questions' : 'streak',
      pendingCount: pendingQuestions.length,
    });
  } catch (error: any) {
    console.error('Reminder test failed:', error);
    return NextResponse.json(
      { error: error.message || 'Reminder test failed' },
      { status: 500 }
    );
  }
}
