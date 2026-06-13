import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyQuestion from '@/models/DailyQuestion';
import {
  getLeetCodeSubmissions,
  hasSubmittedToday,
  getCurrentStreak,
  getRecentAcceptedSubmissions,
} from '@/lib/leetcode';
import { sendDailyQuestionAlert, sendTelegramAlert } from '@/lib/telegram';
import { dateInTimezoneFromUnix, getQuestionSlug } from '@/lib/questionUtils';

function alertIntervalMs(user: any) {
  const frequency = user.alertFrequency || '1';
  if (frequency === 'urgent') {
    return 10 * 1000;
  }
  return (Number(frequency) || 1) * 60 * 1000;
}

function canSendAlert(user: any, now: Date) {
  if (!user.lastAlertSent) return true;
  const diffMs = now.getTime() - new Date(user.lastAlertSent).getTime();
  return diffMs >= alertIntervalMs(user);
}

async function autoCompletePlannedQuestions(user: any, questions: any[], targetDate: string) {
  const pendingQuestions = questions.filter((question) => !question.completed);
  if (!pendingQuestions.length) return pendingQuestions;

  const recent = await getRecentAcceptedSubmissions(user.leetcodeUsername, 100);
  const solvedSlugs = new Set(
    recent
      .filter((submission) => dateInTimezoneFromUnix(submission.timestamp, user.timezone) === targetDate)
      .map((submission) => submission.titleSlug)
  );

  const completedIds = pendingQuestions
    .filter((question) => solvedSlugs.has(getQuestionSlug(question)))
    .map((question) => question._id);

  if (completedIds.length) {
    await DailyQuestion.updateMany(
      { _id: { $in: completedIds }, userId: user._id },
      { completed: true }
    );
  }

  return pendingQuestions.filter((question) =>
    !completedIds.some((id) => String(id) === String(question._id))
  );
}

export async function runStreakCheck() {
  await connectDB();

  const now = new Date();
  const todayDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const istTime = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const users = await User.find({
    isActive: true,
    alertTime: { $lte: istTime },
  });

  console.log(`[cron] Checking ${users.length} users at ${istTime} IST`);

  const results: Array<{
    user: string;
    status: string;
    error?: string;
  }> = [];

  for (const user of users) {
    try {
      const plannedQuestions = await DailyQuestion.find({
        userId: user._id,
        targetDate: todayDate,
      }).sort({ createdAt: 1 });
      const pendingQuestions = await autoCompletePlannedQuestions(user, plannedQuestions, todayDate);

      if (plannedQuestions.length > 0) {
        if (pendingQuestions.length > 0) {
          if (!user.telegramChatId) {
            results.push({
              user: user.leetcodeUsername,
              status: 'missing_telegram_chat_id',
            });
            continue;
          }

            if (!canSendAlert(user, now)) {
            results.push({
              user: user.leetcodeUsername,
              status: 'waiting_for_next_alert_interval',
            });
            continue;
          }

          await sendDailyQuestionAlert(user.telegramChatId, user.leetcodeUsername, pendingQuestions);

          await User.findByIdAndUpdate(user._id, {
            lastAlertSent: new Date(),
          });

          results.push({
            user: user.leetcodeUsername,
            status: 'planned_questions_alert_sent',
          });
          console.log(`[alert] Planned question alert sent to ${user.leetcodeUsername}`);
        } else {
          results.push({
            user: user.leetcodeUsername,
            status: 'planned_questions_completed',
          });
        }
        continue;
      }

      const lcData = await getLeetCodeSubmissions(user.leetcodeUsername);

      if (!lcData) {
        results.push({
          user: user.leetcodeUsername,
          status: 'profile_not_found',
        });
        continue;
      }

      const streak = getCurrentStreak(lcData.submissionCalendar, user.timezone);
      await User.findByIdAndUpdate(user._id, { currentStreak: streak });

      const submitted = hasSubmittedToday(lcData.submissionCalendar, user.timezone);

      if (!submitted) {
        if (!user.telegramChatId) {
          results.push({
            user: user.leetcodeUsername,
            status: 'missing_telegram_chat_id',
          });
          continue;
        }

        if (!canSendAlert(user, now)) {
          results.push({
            user: user.leetcodeUsername,
            status: 'waiting_for_next_alert_interval',
          });
          continue;
        }

        await sendTelegramAlert(user.telegramChatId, user.leetcodeUsername);

        await User.findByIdAndUpdate(user._id, {
          lastAlertSent: new Date(),
        });

        results.push({
          user: user.leetcodeUsername,
          status: 'alert_sent',
        });
        console.log(`[alert] Telegram alert sent to ${user.leetcodeUsername}`);
      } else {
        results.push({
          user: user.leetcodeUsername,
          status: 'already_submitted',
        });
        console.log(`[ok] ${user.leetcodeUsername} already solved today`);
      }
    } catch (err: any) {
      results.push({
        user: user.leetcodeUsername,
        status: 'error',
        error: err.message,
      });
      console.error(`[error] Error checking ${user.leetcodeUsername}:`, err.message);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    istTime,
    checked: users.length,
    results,
  };
}
