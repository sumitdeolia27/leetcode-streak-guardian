import { NextRequest, NextResponse } from 'next/server';
import { getLeetCodeSubmissions, hasSubmittedToday, getCurrentStreak } from '@/lib/leetcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const lcData = await getLeetCodeSubmissions(username);

    if (!lcData) {
      return NextResponse.json(
        { error: 'LeetCode user not found' },
        { status: 404 }
      );
    }

    const solvedToday = hasSubmittedToday(lcData.submissionCalendar);
    const currentStreak = getCurrentStreak(lcData.submissionCalendar);

    // Get total solved count
    const totalSolved = lcData.submitStats?.acSubmissionNum?.find(
      (s) => s.difficulty === 'All'
    )?.count || 0;

    return NextResponse.json({
      username: lcData.username,
      solvedToday,
      currentStreak,
      totalSolved,
      stats: lcData.submitStats?.acSubmissionNum || [],
    });
  } catch (error) {
    console.error('Error fetching LeetCode data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LeetCode data' },
      { status: 500 }
    );
  }
}
