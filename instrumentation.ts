export async function register() {
  if (process.env.USE_NODE_CRON === 'true') {
    const { startCronJobs } = await import('@/lib/cron');
    startCronJobs();
  }
}
