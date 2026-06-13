const TELEGRAM_API = 'https://api.telegram.org';

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in .env.local');
  }
  return token;
}

export async function sendTelegramAlert(
  chatId: string,
  username: string
): Promise<string> {
  const token = getBotToken();
  const text = [
    'LeetCode Streak Alert!',
    '',
    `Hey ${username}, you have not completed today's LeetCode problem yet.`,
    'Complete it as fast as possible to protect your streak.',
    'https://leetcode.com/problemset/',
  ].join('\n');

  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description || 'Telegram message failed');
  }

  return String(data.result.message_id);
}

export async function sendDailyQuestionAlert(
  chatId: string,
  username: string,
  questions: Array<{ title: string; url?: string; topic?: string }>
): Promise<string> {
  const token = getBotToken();
  const questionLines = questions
    .slice(0, 10)
    .map((question, index) => {
      const topic = question.topic ? ` [${question.topic}]` : '';
      const url = question.url ? `\n   ${question.url}` : '';
      return `${index + 1}. ${question.title}${topic}${url}`;
    })
    .join('\n');

  const text = [
    'DSA Plan Reminder!',
    '',
    `Hey ${username}, these questions are still pending for today:`,
    questionLines,
    '',
    'Complete them as fast as possible and mark them done in the dashboard.',
  ].join('\n');

  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description || 'Telegram message failed');
  }

  return String(data.result.message_id);
}
