import { NextResponse } from 'next/server';
import { QUESTION_BANK_GROUPS } from '@/lib/questionBank';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ groups: QUESTION_BANK_GROUPS });
}
