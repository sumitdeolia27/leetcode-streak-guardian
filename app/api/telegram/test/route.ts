import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const { telegramChatId, leetcodeUsername } = await req.json();
    const chatId = String(telegramChatId || '').trim();
    const username = String(leetcodeUsername || 'friend').trim();

    if (!chatId || !/^-?\d+$/.test(chatId)) {
      return NextResponse.json(
        { error: 'Valid Telegram chat ID is required' },
        { status: 400 }
      );
    }

    const messageId = await sendTelegramAlert(chatId, username);
    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error('Telegram test failed:', error);
    return NextResponse.json(
      { error: error.message || 'Telegram test failed' },
      { status: 500 }
    );
  }
}
