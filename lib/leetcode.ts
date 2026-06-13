const LEETCODE_API = 'https://leetcode.com/graphql';

export interface LeetCodeUser {
  username: string;
  submissionCalendar: string;
  submitStats: {
    acSubmissionNum: {
      difficulty: string;
      count: number;
      submissions: number;
    }[];
  };
}

export interface RecentAcceptedSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

export async function getLeetCodeSubmissions(username: string): Promise<LeetCodeUser | null> {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        submissionCalendar
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`LeetCode API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data?.matchedUser || null;
  } catch (error) {
    console.error('Error fetching LeetCode data:', error);
    return null;
  }
}

export async function getRecentAcceptedSubmissions(
  username: string,
  limit = 100
): Promise<RecentAcceptedSubmission[]> {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query,
        variables: { username, limit },
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`LeetCode recent submissions returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.data?.recentAcSubmissionList || [];
  } catch (error) {
    console.error('Error fetching recent LeetCode submissions:', error);
    return [];
  }
}

export function hasSubmittedToday(
  submissionCalendar: string,
  timezone: string = 'Asia/Kolkata'
): boolean {
  const calendar: Record<string, number> = JSON.parse(submissionCalendar || '{}');

  // Get today's start in user's timezone
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
  const todayStart = new Date(todayStr + 'T00:00:00Z');
  const todayTimestamp = Math.floor(todayStart.getTime() / 1000);

  // Also check UTC midnight
  const todayUTC = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000);

  // Check both timestamps (LeetCode can use either)
  return (
    (calendar[todayTimestamp.toString()] || 0) > 0 ||
    (calendar[todayUTC.toString()] || 0) > 0
  );
}

export function getCurrentStreak(
  submissionCalendar: string,
  timezone: string = 'Asia/Kolkata'
): number {
  const calendar: Record<string, number> = JSON.parse(submissionCalendar || '{}');

  // Convert all timestamps to dates and sort descending
  const dates = Object.entries(calendar)
    .filter(([_, count]) => count > 0)
    .map(([ts]) => {
      const date = new Date(parseInt(ts) * 1000);
      return date.toLocaleDateString('en-CA', { timeZone: timezone });
    })
    .filter((v, i, a) => a.indexOf(v) === i) // unique dates
    .sort()
    .reverse();

  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: timezone });

  // Streak must start from today or yesterday
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let expectedDate = dates[0] === today ? today : yesterday;

  for (const date of dates) {
    if (date === expectedDate) {
      streak++;
      // Go back one day
      const d = new Date(expectedDate + 'T12:00:00Z');
      d.setDate(d.getDate() - 1);
      expectedDate = d.toLocaleDateString('en-CA', { timeZone: timezone });
    } else if (date < expectedDate) {
      break;
    }
  }

  return streak;
}
