import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { COOKIE_NAME, getSessionUserIdFromCookie } from '@/lib/session';
import { publicUser } from '@/lib/userResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Session lookup failed:', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}
