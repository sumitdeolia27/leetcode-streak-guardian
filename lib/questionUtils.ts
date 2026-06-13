export interface PlannedQuestionLike {
  title: string;
  url?: string;
  slug?: string;
}

export function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugFromUrl(url?: string) {
  if (!url) return '';
  const match = url.match(/leetcode\.com\/problems\/([^/?#]+)/i);
  return match?.[1]?.toLowerCase() || '';
}

export function getQuestionSlug(question: PlannedQuestionLike) {
  return question.slug || slugFromUrl(question.url) || slugFromTitle(question.title);
}

export function dateInTimezoneFromUnix(timestamp: string | number, timezone = 'Asia/Kolkata') {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-CA', {
    timeZone: timezone,
  });
}

export function toISTDate(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function startOfWeek(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);
  return current;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
