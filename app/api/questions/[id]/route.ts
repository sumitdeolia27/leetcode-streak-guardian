import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyQuestion from '@/models/DailyQuestion';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { getQuestionSlug } from '@/lib/questionUtils';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const updateData: { completed?: boolean; title?: string; url?: string; topic?: string; slug?: string } = {};

    if (typeof body.completed === 'boolean') updateData.completed = body.completed;
    if (typeof body.title === 'string') updateData.title = body.title.trim();
    if (typeof body.url === 'string') updateData.url = body.url.trim();
    if (typeof body.topic === 'string') updateData.topic = body.topic.trim();
    if (updateData.title || updateData.url) {
      updateData.slug = getQuestionSlug({
        title: updateData.title || '',
        url: updateData.url,
      });
    }

    const question = await DailyQuestion.findOneAndUpdate(
      { _id: params.id, userId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const question = await DailyQuestion.findOneAndDelete({ _id: params.id, userId });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
