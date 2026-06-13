import { runStreakCheck } from '@/lib/streakCheck';

let isRunning = false;
let interval: ReturnType<typeof setInterval> | null = null;
let initialTimer: ReturnType<typeof setTimeout> | null = null;
let checkInProgress = false;

async function runScheduledCheck() {
  if (checkInProgress) {
    console.log('[cron] Previous streak check still running, skipping this tick');
    return;
  }

  checkInProgress = true;
  console.log('[cron] Running streak check...');

  try {
    const data = await runStreakCheck();
    console.log('[cron] Streak check completed:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[cron] Cron job failed:', error);
  } finally {
    checkInProgress = false;
  }
}

export function startCronJobs() {
  if (isRunning) {
    console.log('[cron] Cron jobs already running');
    return;
  }

  isRunning = true;
  initialTimer = setTimeout(runScheduledCheck, 5 * 1000);
  interval = setInterval(runScheduledCheck, 10 * 1000);
  console.log('[cron] Cron jobs started - checking every 10 seconds');
}

export function stopCronJobs() {
  if (initialTimer) {
    clearTimeout(initialTimer);
    initialTimer = null;
  }
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  isRunning = false;
}
