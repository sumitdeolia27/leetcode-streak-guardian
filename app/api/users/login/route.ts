import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword } from '@/lib/auth';
import { verifyFirebaseIdToken } from '@/lib/firebaseVerify';
import { setSessionCookie } from '@/lib/session';
import { publicUser } from '@/lib/userResponse';

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

async function findByIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  return User.findOne({
    $or: [
      { leetcodeUsername: normalized },
      { name: new RegExp(`^${identifier.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    ],
  });
}

function loginResponse(user: any) {
  const response = NextResponse.json({
    success: true,
    user: publicUser(user),
  });
  setSessionCookie(response, user._id.toString());
  return response;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const password = String(body.password || '');
    const mode = String(body.mode || 'identifier');

    let user = null;

    if (mode === 'google') {
      const idToken = String(body.idToken || '');
      if (!idToken) {
        return NextResponse.json(
          { error: 'Google ID token is required' },
          { status: 400 }
        );
      }

      let decoded;
      try {
        decoded = await verifyFirebaseIdToken(idToken);
      } catch {
        return NextResponse.json(
          { error: 'Invalid Google sign-in token' },
          { status: 401 }
        );
      }
      const email = normalizeEmail(decoded.email);

      if (!email) {
        return NextResponse.json(
          { error: 'Verified Google account did not return an email' },
          { status: 400 }
        );
      }

      user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          {
            error: 'Gmail ID not found. Please enter your LeetCode ID to sign up first.',
            code: 'EMAIL_NOT_FOUND_NEEDS_LEETCODE_ID',
          },
          { status: 404 }
        );
      }

      return loginResponse(user);
    }

    if (mode === 'email') {
      const email = normalizeEmail(body.email);
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Gmail ID and password are required' },
          { status: 400 }
        );
      }

      user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          {
            error: 'Gmail ID not found. Please enter your LeetCode ID to sign up first.',
            code: 'EMAIL_NOT_FOUND_NEEDS_LEETCODE_ID',
          },
          { status: 404 }
        );
      }
    } else {
      const identifier = String(body.identifier || '').trim();
      if (!identifier || !password) {
        return NextResponse.json(
          { error: 'LeetCode ID or name and password are required' },
          { status: 400 }
        );
      }

      user = await findByIdentifier(identifier);
      if (!user) {
        return NextResponse.json(
          { error: 'No account found for this LeetCode ID or name' },
          { status: 404 }
        );
      }
    }

    if (!user.passwordHash || !user.passwordSalt) {
      return NextResponse.json(
        { error: 'This older account has no password yet. Please sign up again with your LeetCode ID.' },
        { status: 409 }
      );
    }

    if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return loginResponse(user);
  } catch (error) {
    console.error('Error logging in user:', error);
    return NextResponse.json(
      { error: 'Failed to login. Please try again.' },
      { status: 500 }
    );
  }
}
