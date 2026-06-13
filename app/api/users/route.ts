import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getLeetCodeSubmissions, getCurrentStreak } from '@/lib/leetcode';
import { hashPassword } from '@/lib/auth';
import { publicUser } from '@/lib/userResponse';

function normalizePhone(value: unknown) {
  return String(value || '').replace(/\s+/g, '');
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeChatId(value: unknown) {
  return String(value || '').trim();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const name = String(body.name || '').trim();
    const phoneNumber = normalizePhone(body.phoneNumber);
    const email = normalizeEmail(body.email);
    const leetcodeUsername = String(body.leetcodeUsername || '').trim().toLowerCase();
    const password = String(body.password || '');
    const confirmPassword = String(body.confirmPassword || '');
    const telegramChatId = normalizeChatId(body.telegramChatId);
    const alertTime = String(body.alertTime || '21:00').trim();

    if (!name || !phoneNumber || !email || !leetcodeUsername || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Name, phone number, Gmail ID, password, confirm password, and LeetCode ID are required' },
        { status: 400 }
      );
    }

    if (!/^\+[0-9]{10,15}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format: +918394855509' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid Gmail ID' }, { status: 400 });
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

    if (telegramChatId && !/^-?\d+$/.test(telegramChatId)) {
      return NextResponse.json(
        { error: 'Telegram chat ID should contain only digits, for example 123456789' },
        { status: 400 }
      );
    }

    const lcData = await getLeetCodeSubmissions(leetcodeUsername);
    if (!lcData) {
      return NextResponse.json(
        { error: 'LeetCode username not found. Make sure your profile is public.' },
        { status: 404 }
      );
    }

    const existingByLeetCode = await User.findOne({ leetcodeUsername });
    if (existingByLeetCode) {
      if (!existingByLeetCode.passwordHash || !existingByLeetCode.passwordSalt) {
        const existingByEmail = await User.findOne({
          email,
          _id: { $ne: existingByLeetCode._id },
        });
        if (existingByEmail) {
          return NextResponse.json(
            { error: 'This Gmail ID is already registered' },
            { status: 409 }
          );
        }

        const { hash, salt } = hashPassword(password);
        const streak = getCurrentStreak(lcData.submissionCalendar);
        const completedUser = await User.findByIdAndUpdate(
          existingByLeetCode._id,
          {
            name,
            phoneNumber,
            email,
            passwordHash: hash,
            passwordSalt: salt,
            telegramChatId: telegramChatId || existingByLeetCode.telegramChatId,
            alertTime,
            alertMethod: 'telegram',
            currentStreak: streak,
            isActive: true,
          },
          { new: true, runValidators: false }
        );

        return NextResponse.json({
          success: true,
          user: publicUser(completedUser),
          completedLegacyAccount: true,
        });
      }

      return NextResponse.json(
        { error: 'This LeetCode ID is already registered' },
        { status: 409 }
      );
    }

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'This Gmail ID is already registered' },
        { status: 409 }
      );
    }

    const streak = getCurrentStreak(lcData.submissionCalendar);
    const { hash, salt } = hashPassword(password);

    const user = await User.create({
      name,
      phoneNumber,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      leetcodeUsername,
      telegramChatId: telegramChatId || undefined,
      alertTime,
      alertMethod: 'telegram',
      currentStreak: streak,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        user: publicUser(user),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering user:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'This account already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register user. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({ isActive: true }).sort({ createdAt: -1 });

    return NextResponse.json({ users: users.map(publicUser) });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
