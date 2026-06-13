import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { getQuestionSlug } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

type ParsedQuestion = {
  title: string;
  url?: string;
  topic?: string;
};

function todayInIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function normalizeDate(value: unknown) {
  const date = String(value || todayInIST()).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayInIST();
}

function normalizeQuestion(value: unknown): ParsedQuestion | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (/^id\s*,\s*title\s*,/i.test(raw)) return null;

  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const url = parts.find((part) => /^https?:\/\//i.test(part));
  const title = parts.find((part) => !/^https?:\/\//i.test(part)) || raw;

  return {
    title: title.replace(/^[-*\d.)\s]+/, '').trim(),
    url,
  };
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseHeaderedCsvQuestions(text: string): ParsedQuestion[] {
  const rows = text
    .split(/\r?\n/)
    .map(parseCsvLine)
    .filter((row) => row.some((cell) => cell.trim()));

  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const titleIndex = headers.findIndex((header) =>
    ['title', 'problem', 'question', 'name'].includes(header)
  );
  const linkIndex = headers.findIndex((header) =>
    ['link', 'url', 'leetcode link'].includes(header)
  );
  const topicIndex = headers.findIndex((header) =>
    ['topics', 'topic', 'category'].includes(header)
  );

  if (titleIndex === -1) return [];

  return rows
    .slice(1)
    .map((row) => ({
      title: String(row[titleIndex] || '').trim(),
      url: linkIndex >= 0 ? String(row[linkIndex] || '').trim() || undefined : undefined,
      topic: topicIndex >= 0 ? String(row[topicIndex] || '').trim() || undefined : undefined,
    }))
    .filter((question) => Boolean(question.title));
}

function parseQuestionsFromSource(text: string): ParsedQuestion[] {
  if (!text.trim()) return [];

  const csvQuestions = parseHeaderedCsvQuestions(text);
  if (csvQuestions.length) return csvQuestions;

  return text
    .split(/\r?\n/)
    .map(normalizeQuestion)
    .filter(isParsedQuestion);
}

function googleSheetCsvUrl(value: string) {
  if (!value) return '';
  if (/output=csv|format=csv/i.test(value)) return value;
  const match = value.match(/\/spreadsheets\/d\/([^/]+)/);
  return match ? `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv` : value;
}

async function loadSheetText(sheetUrl: string) {
  if (!sheetUrl) return '';

  const response = await fetch(googleSheetCsvUrl(sheetUrl), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Could not import Google Sheet. Make sure the sheet is public.');
  }

  return response.text();
}

function isParsedQuestion(question: ParsedQuestion | null): question is ParsedQuestion {
  return Boolean(question?.title);
}

export async function GET(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const targetDate = normalizeDate(req.nextUrl.searchParams.get('date'));

    const questions = await DailyQuestion.find({ userId, targetDate }).sort({ createdAt: 1 });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const topic = String(body.topic || '').trim();
    const targetDate = normalizeDate(body.targetDate);
    const count = Math.max(1, Math.min(50, Number(body.count || 1)));
    const sourceText = String(body.sourceText || '').trim();
    const sheetUrl = String(body.sheetUrl || '').trim();
    const manualTitle = String(body.title || '').trim();
    const manualUrl = String(body.url || '').trim();
    const importedText = sheetUrl ? await loadSheetText(sheetUrl) : '';
    const parsedQuestions = [
      ...parseQuestionsFromSource(sourceText),
      ...parseQuestionsFromSource(importedText),
    ]
      .slice(0, count);

    if (!parsedQuestions.length && manualTitle) {
      parsedQuestions.push({ title: manualTitle, url: manualUrl || undefined });
    }

    if (!parsedQuestions.length) {
      return NextResponse.json(
        { error: 'Add at least one question title or upload a text/CSV file' },
        { status: 400 }
      );
    }

    const created = await DailyQuestion.insertMany(
      parsedQuestions.map((question) => ({
        userId,
        title: question.title,
        url: question.url,
        slug: getQuestionSlug(question),
        topic: question.topic || topic,
        targetDate,
        completed: false,
      }))
    );

    return NextResponse.json({ success: true, questions: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create questions:', error);
    return NextResponse.json({ error: 'Failed to create questions' }, { status: 500 });
  }
}
