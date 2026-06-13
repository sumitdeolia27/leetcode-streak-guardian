import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const leetcodeUsername = String(body.leetcodeUsername || '').trim().toLowerCase();
    const password = String(body.password || '');
    const confirmPassword = String(body.confirmPassword || '');

    if (!email || !leetcodeUsername || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Gmail ID, LeetCode ID, password, and confirm password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password and confirm password do not match' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email, leetcodeUsername });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found for this Gmail ID and LeetCode ID' },
        { status: 404 }
      );
    }

    const { hash, salt } = hashPassword(password);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
