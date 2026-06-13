import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import User from '@/models/User';
import { toISTDate } from '@/lib/questionUtils';

async function sendMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || 'Telegram sendMessage failed');
  }
}

function formatQuestionList(questions: any[], onlyPending = false) {
  const filtered = onlyPending ? questions.filter((question) => !question.completed) : questions;

  if (!filtered.length) {
    return onlyPending
      ? 'No pending questions for today.'
      : 'No questions planned for today.';
  }

  return filtered
    .map((question, index) => {
      const status = question.completed ? 'done' : 'pending';
      const url = question.url ? `\n   ${question.url}` : '';
      return `${index + 1}. ${question.title} (${status})${url}`;
    })
    .join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const chatId = update?.message?.chat?.id;
    const text = String(update?.message?.text || '').trim();

    if (chatId && text.startsWith('/start')) {
      const payload = text.split(/\s+/, 2)[1] || '';
      const phoneDigits = payload.startsWith('phone_') ? payload.slice('phone_'.length).replace(/\D/g, '') : '';
      const phoneLine = phoneDigits ? `\nPhone received: +${phoneDigits}` : '';

      await sendMessage(
        chatId,
        `This is your Telegram chat ID: ${chatId}${phoneLine}\n\nUse this ID in LeetCode Streak Guardian.`
      );
    }

    if (chatId && text && !text.startsWith('/start')) {
      await connectDB();
      const user = await User.findOne({ telegramChatId: String(chatId) });

      if (!user) {
        await sendMessage(
          chatId,
          `This is your Telegram chat ID: ${chatId}\n\nAdd it in the dashboard before using commands.`
        );
        return NextResponse.json({ ok: true });
      }

      const today = toISTDate();
      const questions = await DailyQuestion.find({
        userId: user._id,
        targetDate: today,
      }).sort({ createdAt: 1 });
      const command = text.split(/\s+/)[0].split('@')[0].toLowerCase();

      if (command === '/today') {
        await sendMessage(chatId, `Today's pending questions:\n\n${formatQuestionList(questions, true)}`);
      } else if (command === '/plan') {
        await sendMessage(chatId, `Today's full plan:\n\n${formatQuestionList(questions)}`);
      } else if (command === '/done') {
        const index = Number(text.split(/\s+/)[1]) - 1;
        const pendingQuestions = questions.filter((question) => !question.completed);
        const question = pendingQuestions[index];

        if (!question) {
          await sendMessage(chatId, 'Use /done 1, /done 2, etc. based on /today.');
        } else {
          question.completed = true;
          await question.save();
          await sendMessage(chatId, `Marked done: ${question.title}`);
        }
      } else if (command === '/pause') {
        user.isActive = false;
        await user.save();
        await sendMessage(chatId, 'Alerts paused. Turn them on again from the dashboard.');
      } else {
        await sendMessage(
          chatId,
          'Commands:\n/today - pending questions\n/plan - full plan\n/done 1 - mark pending question done\n/pause - pause alerts'
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook failed:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
