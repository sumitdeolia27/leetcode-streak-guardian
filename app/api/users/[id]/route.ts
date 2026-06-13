import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { publicUser } from '@/lib/userResponse';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { alertTime, telegramChatId, isActive, alertFrequency } = body;

    const updateData: {
      alertTime?: string;
      telegramChatId?: string;
      isActive?: boolean;
      alertFrequency?: '1' | '5' | '15' | 'urgent';
      alertMethod?: 'telegram';
    } = { alertMethod: 'telegram' };

    if (alertTime) updateData.alertTime = String(alertTime);
    if (telegramChatId) {
      const normalizedChatId = String(telegramChatId).trim();
      if (!/^-?\d+$/.test(normalizedChatId)) {
        return NextResponse.json(
          { error: 'Telegram chat ID should contain only digits, for example 123456789' },
          { status: 400 }
        );
      }
      updateData.telegramChatId = normalizedChatId;
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (['1', '5', '15', 'urgent'].includes(String(alertFrequency))) {
      updateData.alertFrequency = String(alertFrequency) as '1' | '5' | '15' | 'urgent';
    }

    const user = await User.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await User.findByIdAndDelete(params.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
