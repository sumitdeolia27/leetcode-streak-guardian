import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
    };
  };
};

function getTelegramToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return token;
}

export async function GET(req: NextRequest) {
  try {
    const phoneDigits = (req.nextUrl.searchParams.get('phone') || '').replace(/\D/g, '');

    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number first' }, { status: 400 });
    }

    const token = getTelegramToken();
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const description = String(data.description || 'Could not read Telegram updates');
      const status = description.toLowerCase().includes('webhook') ? 409 : 502;

      return NextResponse.json(
        {
          error:
            status === 409
              ? 'Telegram webhook is active. If the bot did not reply, set the webhook to your deployed /api/telegram/webhook URL.'
              : description,
        },
        { status }
      );
    }

    const updates = Array.isArray(data.result) ? (data.result as TelegramUpdate[]) : [];
    const expectedStart = `/start phone_${phoneDigits}`;
    const matchedUpdate = [...updates].reverse().find((update) => {
      const text = String(update.message?.text || '').trim();
      return text === expectedStart || text.startsWith(`${expectedStart} `);
    });

    const chatId = matchedUpdate?.message?.chat?.id;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID not found yet. Open the bot, tap Start, then click Fill Chat ID.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ chatId });
  } catch (error) {
    console.error('Telegram chat ID lookup failed:', error);
    return NextResponse.json({ error: 'Telegram chat ID lookup failed' }, { status: 500 });
  }
}
