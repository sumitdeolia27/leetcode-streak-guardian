'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UserCard from '@/components/UserCard';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import TimePicker12 from '@/components/TimePicker12';

interface LoggedInUser {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  leetcodeUsername: string;
  telegramChatId: string;
  alertTime: string;
  alertFrequency: '1' | '5' | '15' | 'urgent';
  alertMethod: 'telegram';
  isActive: boolean;
  currentStreak: number;
}

interface DailyQuestion {
  _id: string;
  title: string;
  url?: string;
  topic?: string;
  targetDate: string;
  completed: boolean;
}

interface QuestionBankGroup {
  id: string;
  label: string;
  type: 'topic' | 'preset';
  questions: Array<{ title: string; topic: string; url: string; slug: string }>;
}

interface CalendarDay {
  date: string;
  planned: number;
  completed: number;
  pending: number;
  missed: number;
}

interface Analytics {
  totalSolved: number;
  totalPlanned: number;
  missedDays: number;
  averageQuestionsPerDay: number;
  topicStats: Array<{ topic: string; total: number; completed: number; missed: number }>;
  weakTopics: Array<{ topic: string; total: number; completed: number; missed: number }>;
}

function todayInIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  current.setDate(current.getDate() - day + (day === 0 ? -6 : 1));
  return current;
}

function toInputDate(date: Date) {
  return date.toLocaleDateString('en-CA');
}

function formatCalendarDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime12(value: string) {
  const [hourRaw, minuteRaw = '00'] = value.split(':');
  const hour24 = Number(hourRaw);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minuteRaw.padStart(2, '0')} ${period}`;
}

const weekdayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Dashboard() {
  const [loginMode, setLoginMode] = useState<'identifier' | 'email'>('identifier');
  const [identifierLogin, setIdentifierLogin] = useState({
    identifier: '',
    password: '',
  });
  const [emailLogin, setEmailLogin] = useState({
    email: '',
    password: '',
  });
  const [resetForm, setResetForm] = useState({
    email: '',
    leetcodeUsername: '',
    password: '',
    confirmPassword: '',
  });
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [settings, setSettings] = useState({
    telegramChatId: '',
    alertTime: '21:00',
    alertFrequency: '1' as '1' | '5' | '15' | 'urgent',
    isActive: true,
  });
  const [planForm, setPlanForm] = useState({
    targetDate: todayInIST(),
    topic: '',
    bankGroupId: 'arrays',
    count: 3,
    title: '',
    url: '',
    sourceText: '',
    sheetUrl: '',
  });
  const [weekStart, setWeekStart] = useState(toInputDate(startOfWeek()));
  const [weeklyPlan, setWeeklyPlan] = useState(
    weekdayLabels.map((_, index) => ({ day: index, groupId: index < 3 ? ['arrays', 'dp', 'graph'][index] : '', count: index < 3 ? 2 : 0 }))
  );
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankGroup[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingReminder, setTestingReminder] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [needsLeetCodeId, setNeedsLeetCodeId] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setSettings({
            telegramChatId: '',
            alertTime: data.user.alertTime,
            alertFrequency: data.user.alertFrequency || '1',
            isActive: data.user.isActive,
          });
        }
      } catch {
        // No active session is fine.
      }
    }

    loadSession();
    loadQuestionBank();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadQuestions(planForm.targetDate);
    loadSummary();
    loadAnalytics();
  }, [user, planForm.targetDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    loadSummary();
  }, [user, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyLoggedInUser = (nextUser: LoggedInUser, text: string) => {
    setUser(nextUser);
    setSettings({
      telegramChatId: '',
      alertTime: nextUser.alertTime,
      alertFrequency: nextUser.alertFrequency || '1',
      isActive: nextUser.isActive,
    });
    setMessage({ type: 'success', text });
    window.dispatchEvent(new Event('auth-changed'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsLeetCodeId(false);
    setMessage({ type: '', text: '' });

    try {
      const payload =
        loginMode === 'email'
          ? {
              mode: 'email',
              email: emailLogin.email.trim().toLowerCase(),
              password: emailLogin.password,
            }
          : {
              mode: 'identifier',
              identifier: identifierLogin.identifier.trim(),
              password: identifierLogin.password,
            };

      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_FOUND_NEEDS_LEETCODE_ID') {
          setNeedsLeetCodeId(true);
        }
        setMessage({ type: 'error', text: data.error || 'Login failed' });
        return;
      }

      applyLoggedInUser(data.user, 'Logged in. You can manage Telegram alerts now.');
    } catch {
      setMessage({ type: 'error', text: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setNeedsLeetCodeId(false);
    setMessage({ type: '', text: '' });

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const email = credential.user.email;
      const idToken = await credential.user.getIdToken();

      if (!email) {
        setMessage({ type: 'error', text: 'Google account did not return an email.' });
        return;
      }

      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'google',
          idToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_FOUND_NEEDS_LEETCODE_ID') {
          setNeedsLeetCodeId(true);
          setEmailLogin({ email, password: '' });
          setLoginMode('email');
        }
        setMessage({ type: 'error', text: data.error || 'Google login failed' });
        return;
      }

      applyLoggedInUser(data.user, 'Logged in with Google.');
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        setMessage({ type: 'error', text: 'Google login was cancelled.' });
      } else {
        setMessage({ type: 'error', text: 'Google login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetForm.email.trim().toLowerCase(),
          leetcodeUsername: resetForm.leetcodeUsername.trim().toLowerCase(),
          password: resetForm.password,
          confirmPassword: resetForm.confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Password reset failed' });
        return;
      }

      setShowReset(false);
      setResetForm({ email: '', leetcodeUsername: '', password: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password reset. You can login now.' });
    } catch {
      setMessage({ type: 'error', text: 'Password reset failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    const payload: {
      telegramChatId?: string;
      alertTime: string;
      alertFrequency: string;
      isActive: boolean;
    } = {
      alertTime: settings.alertTime,
      alertFrequency: settings.alertFrequency,
      isActive: settings.isActive,
    };

    if (settings.telegramChatId.trim()) {
      payload.telegramChatId = settings.telegramChatId.trim();
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Save failed' });
        return;
      }

      applyLoggedInUser(data.user, 'Telegram alert settings saved.');
    } catch {
      setMessage({ type: 'error', text: 'Save failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestReminder = async () => {
    setTestingReminder(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/reminders/test', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Test reminder failed' });
        return;
      }

      setMessage({
        type: 'success',
        text:
          data.type === 'planned_questions'
            ? `Test sent with ${data.pendingCount} pending question(s).`
            : 'Test streak reminder sent.',
      });
    } catch {
      setMessage({ type: 'error', text: 'Test reminder failed. Please try again.' });
    } finally {
      setTestingReminder(false);
    }
  };

  const loadQuestions = async (targetDate: string) => {
    setLoadingQuestions(true);

    try {
      const res = await fetch(`/api/questions?date=${targetDate}`);
      const data = await res.json();

      if (res.ok) {
        setQuestions(data.questions || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load daily questions.' });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadQuestionBank = async () => {
    try {
      const res = await fetch('/api/question-bank');
      const data = await res.json();

      if (res.ok) {
        setQuestionBank(data.groups || []);
      }
    } catch {
      // The dashboard can still work with manual questions.
    }
  };

  const loadSummary = async () => {
    const start = weekStart;
    const end = toInputDate(addDays(new Date(`${weekStart}T12:00:00`), 6));

    try {
      const res = await fetch(`/api/questions/summary?start=${start}&end=${end}`);
      const data = await res.json();

      if (res.ok) {
        const byDate = new Map<string, CalendarDay>(
          (data.days || []).map((day: CalendarDay) => [day.date, day])
        );
        const days = Array.from({ length: 7 }, (_, index) => {
          const date = toInputDate(addDays(new Date(`${weekStart}T12:00:00`), index));
          return byDate.get(date) || { date, planned: 0, completed: 0, pending: 0, missed: 0 };
        });
        setCalendarDays(days);
      }
    } catch {
      setCalendarDays([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();

      if (res.ok) {
        setAnalytics(data);
      }
    } catch {
      setAnalytics(null);
    }
  };

  const refreshPlanningData = async () => {
    await Promise.all([
      loadQuestions(planForm.targetDate),
      loadSummary(),
      loadAnalytics(),
    ]);
  };

  const handleQuestionFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setPlanForm((current) => ({ ...current, sourceText: text }));
  };

  const handleAddQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDate: planForm.targetDate,
          topic: planForm.topic,
          count: planForm.count,
          title: planForm.title,
          url: planForm.url,
          sourceText: planForm.sourceText,
          sheetUrl: planForm.sheetUrl,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to add questions' });
        return;
      }

      setPlanForm((current) => ({
        ...current,
        title: '',
        url: '',
        sourceText: '',
        sheetUrl: '',
      }));
      setQuestions(data.questions || []);
      await refreshPlanningData();
      setMessage({ type: 'success', text: 'Daily DSA plan saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to add questions. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFromBank = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/question-bank/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: planForm.bankGroupId,
          targetDate: planForm.targetDate,
          count: planForm.count,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Could not add from question bank' });
        return;
      }

      await refreshPlanningData();
      setMessage({ type: 'success', text: 'Questions added from bank.' });
    } catch {
      setMessage({ type: 'error', text: 'Could not add from question bank.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncQuestions = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/questions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate: planForm.targetDate }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'LeetCode sync failed' });
        return;
      }

      setQuestions(data.questions || []);
      await refreshPlanningData();
      setMessage({ type: 'success', text: `${data.updated} solved question(s) detected from LeetCode.` });
    } catch {
      setMessage({ type: 'error', text: 'LeetCode sync failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateWeeklyPlan = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart,
          schedule: weeklyPlan.filter((item) => item.groupId && item.count > 0),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Weekly plan failed' });
        return;
      }

      await refreshPlanningData();
      setMessage({ type: 'success', text: `Weekly plan created with ${data.created} questions.` });
    } catch {
      setMessage({ type: 'error', text: 'Weekly plan failed.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = async (question: DailyQuestion) => {
    setQuestions((current) =>
      current.map((item) =>
        item._id === question._id ? { ...item, completed: !item.completed } : item
      )
    );

    try {
      const res = await fetch(`/api/questions/${question._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !question.completed }),
      });

      if (!res.ok && user) {
        await loadQuestions(planForm.targetDate);
      }
      await Promise.all([loadSummary(), loadAnalytics()]);
    } catch {
      if (user) await loadQuestions(planForm.targetDate);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    setQuestions((current) => current.filter((item) => item._id !== questionId));

    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });

      if (!res.ok && user) {
        await loadQuestions(planForm.targetDate);
      }
      await Promise.all([loadSummary(), loadAnalytics()]);
    } catch {
      if (user) await loadQuestions(planForm.targetDate);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setQuestions([]);
    setMessage({ type: '', text: '' });
    window.dispatchEvent(new Event('auth-changed'));
  };

  const handleDelete = async () => {
    if (!user) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Delete failed' });
        return;
      }

      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIdentifierLogin({ identifier: '', password: '' });
      setEmailLogin({ email: '', password: '' });
      setMessage({ type: 'success', text: 'Account deleted. Alerts stopped.' });
    } catch {
      setMessage({ type: 'error', text: 'Delete failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const today = todayInIST();
  const todayLabel = formatCalendarDate(today);
  const currentWeekStart = toInputDate(startOfWeek(new Date(`${today}T12:00:00`)));
  const todaySummary = calendarDays.find((day) => day.date === today);
  const selectedBankGroup = questionBank.find((group) => group.id === planForm.bankGroupId);
  const todayPlanned = todaySummary?.planned ?? (planForm.targetDate === today ? questions.length : 0);
  const todayCompleted =
    todaySummary?.completed ??
    (planForm.targetDate === today ? questions.filter((question) => question.completed).length : 0);
  const todayPending =
    todaySummary?.pending ??
    (planForm.targetDate === today ? questions.filter((question) => !question.completed).length : 0);

  const goToToday = () => {
    setWeekStart(currentWeekStart);
    setPlanForm((current) => ({ ...current, targetDate: today }));
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {user ? 'Your LeetCode Planner' : 'Login and Telegram Alerts'}
            </h1>
            <p className="text-gray-400">
              {user
                ? 'Manage your alert time, daily DSA plan, and Telegram reminders.'
                : 'Login with LeetCode ID or name, Gmail, or Google.'}
            </p>
          </div>

          {!user && (
            <div className="glass-card rounded-2xl p-6 neon-border mb-8 max-w-lg mx-auto">
              <div className="grid grid-cols-2 gap-2 mb-5 rounded-lg bg-lc-darker/70 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('identifier');
                    setMessage({ type: '', text: '' });
                  }}
                  className={`py-2 rounded-md text-sm font-medium ${
                    loginMode === 'identifier'
                      ? 'bg-lc-orange text-black'
                      : 'text-gray-400 hover:text-lc-orange'
                  }`}
                >
                  LeetCode / Name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('email');
                    setMessage({ type: '', text: '' });
                  }}
                  className={`py-2 rounded-md text-sm font-medium ${
                    loginMode === 'email'
                      ? 'bg-lc-orange text-black'
                      : 'text-gray-400 hover:text-lc-orange'
                  }`}
                >
                  Gmail
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {loginMode === 'identifier' ? (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      LeetCode ID or Name
                    </label>
                    <input
                      type="text"
                      value={identifierLogin.identifier}
                      onChange={(e) =>
                        setIdentifierLogin({ ...identifierLogin, identifier: e.target.value })
                      }
                      placeholder="_sumit27_ or Sumit"
                      required
                      className="w-full px-4 py-3 rounded-lg input-dark"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Gmail ID
                    </label>
                    <input
                      type="email"
                      value={emailLogin.email}
                      onChange={(e) =>
                        setEmailLogin({ ...emailLogin, email: e.target.value })
                      }
                      placeholder="you@gmail.com"
                      required
                      className="w-full px-4 py-3 rounded-lg input-dark"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={
                      loginMode === 'identifier'
                        ? identifierLogin.password
                        : emailLogin.password
                    }
                    onChange={(e) =>
                      loginMode === 'identifier'
                        ? setIdentifierLogin({ ...identifierLogin, password: e.target.value })
                        : setEmailLogin({ ...emailLogin, password: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-lg input-dark"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 btn-glow text-black font-bold rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-lc-border/60" />
                <span className="text-xs text-gray-500">or</span>
                <div className="h-px flex-1 bg-lc-border/60" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 rounded-lg border border-lc-border bg-lc-darker text-gray-200 font-bold hover:border-lc-orange/60 hover:text-lc-orange transition-colors disabled:opacity-50"
              >
                Continue with Google
              </button>

              {needsLeetCodeId && (
                <div className="mt-5 p-4 rounded-lg bg-lc-orange/10 border border-lc-orange/30 text-sm text-gray-300">
                  This Gmail ID is not registered. Please sign up with your
                  LeetCode ID first.
                  <Link href="/signup" className="text-lc-orange hover:underline ml-1">
                    Go to sign up
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowReset(!showReset)}
                className="mt-5 text-sm text-gray-400 hover:text-lc-orange"
              >
                Forgot password?
              </button>

              {showReset && (
                <form onSubmit={handleResetPassword} className="mt-5 space-y-4 border-t border-lc-border/50 pt-5">
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                    placeholder="Gmail ID"
                    required
                    className="w-full px-4 py-3 rounded-lg input-dark"
                  />
                  <input
                    type="text"
                    value={resetForm.leetcodeUsername}
                    onChange={(e) => setResetForm({ ...resetForm, leetcodeUsername: e.target.value })}
                    placeholder="LeetCode ID"
                    required
                    className="w-full px-4 py-3 rounded-lg input-dark"
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="password"
                      value={resetForm.password}
                      onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                      placeholder="New password"
                      minLength={6}
                      required
                      className="w-full px-4 py-3 rounded-lg input-dark"
                    />
                    <input
                      type="password"
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      minLength={6}
                      required
                      className="w-full px-4 py-3 rounded-lg input-dark"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg border border-lc-orange text-lc-orange font-bold hover:bg-lc-orange/10 disabled:opacity-50"
                  >
                    Reset Password
                  </button>
                </form>
              )}
            </div>
          )}

          {user && (
            <>
              <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: 'Alert Time', value: formatTime12(settings.alertTime), hint: settings.alertFrequency === 'urgent' ? 'urgent every 10 sec' : `every ${settings.alertFrequency} min` },
                  { label: 'Pending Today', value: todayPending, hint: `${todayPlanned} planned` },
                  { label: 'Completed Today', value: todayCompleted, hint: todayPlanned ? `${Math.round((todayCompleted / todayPlanned) * 100)}% done` : 'no plan yet' },
                  { label: 'Telegram', value: user.telegramChatId ? 'Connected' : 'Missing', hint: settings.isActive ? 'alerts active' : 'paused' },
                  { label: 'LeetCode Streak', value: user.currentStreak, hint: 'days' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-lc-border/50 bg-lc-card/40 p-4">
                    <p className="text-xs uppercase text-gray-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <UserCard username={user.leetcodeUsername} />
              </div>

              <div className="glass-card rounded-2xl p-6 neon-border mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Telegram Alert Settings
                    </h2>
                    <p className="break-words text-gray-500 text-sm">
                      {user.name} / {user.email} / {user.leetcodeUsername}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-lc-orange"
                  >
                    Logout
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      New Telegram Chat ID
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={settings.telegramChatId}
                      onChange={(e) =>
                        setSettings({ ...settings, telegramChatId: e.target.value })
                      }
                      placeholder={user.telegramChatId || 'Add chat ID for alerts'}
                      className="w-full px-4 py-3 rounded-lg input-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Alert Time (IST)
                    </label>
                    <TimePicker12
                      value={settings.alertTime}
                      onChange={(alertTime) =>
                        setSettings({ ...settings, alertTime })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-300 mb-2">
                      Alert Frequency
                    </label>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {[
                        { value: '1', label: 'Every 1 min' },
                        { value: '5', label: 'Every 5 min' },
                        { value: '15', label: 'Every 15 min' },
                        { value: 'urgent', label: 'Urgent 10 sec' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              alertFrequency: option.value as '1' | '5' | '15' | 'urgent',
                            })
                          }
                          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                            settings.alertFrequency === option.value
                              ? 'border-lc-orange bg-lc-orange text-black'
                              : 'border-lc-border text-gray-300 hover:border-lc-orange/60'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between p-4 bg-lc-darker/60 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Telegram Alerts</p>
                      <p className="text-gray-500 text-xs">
                        {settings.isActive ? 'Alerts are active' : 'Alerts are paused'}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({ ...settings, isActive: !settings.isActive })
                      }
                      className={`w-14 h-7 rounded-full transition-all relative ${
                        settings.isActive ? 'bg-lc-green' : 'bg-lc-border'
                      }`}
                      aria-label="Toggle Telegram alerts"
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                          settings.isActive ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 btn-glow text-black font-bold rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestReminder}
                    disabled={testingReminder || !user.telegramChatId}
                    className="w-full rounded-lg border border-lc-orange px-4 py-3 text-sm font-bold text-lc-orange hover:bg-lc-orange/10 disabled:opacity-50"
                  >
                    {testingReminder ? 'Sending...' : 'Send Test Reminder'}
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 neon-border mb-8">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">
                    Daily DSA Plan
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Add specific questions for a day. Telegram will repeat pending question alerts after your saved alert time.
                  </p>
                </div>

                <form onSubmit={handleAddQuestions} className="space-y-5">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Plan Date
                      </label>
                      <input
                        type="date"
                        value={planForm.targetDate}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, targetDate: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg input-dark"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Problem Type
                      </label>
                      <input
                        type="text"
                        value={planForm.topic}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, topic: e.target.value })
                        }
                        placeholder="Arrays, DP, Graph"
                        className="w-full px-4 py-3 rounded-lg input-dark"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Questions Per Day
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={planForm.count}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, count: Number(e.target.value) })
                        }
                        className="w-full px-4 py-3 rounded-lg input-dark"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Question Bank
                      </label>
                      <select
                        value={planForm.bankGroupId}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, bankGroupId: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg input-dark"
                      >
                        {questionBank.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.type === 'preset' ? 'Preset: ' : 'Topic: '}
                            {group.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedBankGroup
                          ? `${selectedBankGroup.questions.length} saved questions available`
                          : 'Saved DSA lists load automatically'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateFromBank}
                      disabled={saving || !questionBank.length}
                      className="rounded-lg border border-lc-orange px-4 py-3 text-sm font-bold text-lc-orange hover:bg-lc-orange/10 disabled:opacity-50"
                    >
                      Add From Bank
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Question Title
                      </label>
                      <input
                        type="text"
                        value={planForm.title}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, title: e.target.value })
                        }
                        placeholder="Two Sum"
                        className="w-full px-4 py-3 rounded-lg input-dark"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Question Link
                      </label>
                      <input
                        type="url"
                        value={planForm.url}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, url: e.target.value })
                        }
                        placeholder="https://leetcode.com/problems/two-sum/"
                        className="w-full px-4 py-3 rounded-lg input-dark"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Import Questions
                    </label>
                    <input
                      type="url"
                      value={planForm.sheetUrl}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, sheetUrl: e.target.value })
                      }
                      placeholder="Public Google Sheet link or CSV URL"
                      className="mb-3 w-full px-4 py-3 rounded-lg input-dark"
                    />
                    <input
                      type="file"
                      accept=".txt,.csv"
                      onChange={(e) => handleQuestionFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 rounded-lg input-dark file:mr-4 file:rounded-md file:border-0 file:bg-lc-orange file:px-3 file:py-2 file:text-sm file:font-bold file:text-black"
                    />
                    <textarea
                      value={planForm.sourceText}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, sourceText: e.target.value })
                      }
                      placeholder="One question per line. Example: Two Sum, https://leetcode.com/problems/two-sum/"
                      rows={4}
                      className="mt-3 w-full px-4 py-3 rounded-lg input-dark"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 btn-glow text-black font-bold rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving Plan...' : 'Add To Daily Plan'}
                  </button>
                </form>

                <div className="mt-6 border-t border-lc-border/50 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white">
                      Questions for {planForm.targetDate}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {questions.filter((question) => question.completed).length}/{questions.length} done
                      </span>
                      <button
                        type="button"
                        onClick={handleSyncQuestions}
                        disabled={saving || questions.length === 0}
                        className="rounded-lg border border-lc-border px-3 py-1 text-xs font-medium text-gray-300 hover:border-lc-orange/60 hover:text-lc-orange disabled:opacity-50"
                      >
                        Sync LeetCode
                      </button>
                    </div>
                  </div>

                  {loadingQuestions ? (
                    <p className="text-sm text-gray-500">Loading questions...</p>
                  ) : questions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No questions planned for this date.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((question) => (
                        <div
                          key={question._id}
                          className="flex flex-col gap-3 rounded-lg bg-lc-darker/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <label className="flex min-w-0 items-start gap-3">
                            <input
                              type="checkbox"
                              checked={question.completed}
                              onChange={() => toggleQuestion(question)}
                              className="mt-1 h-4 w-4 accent-lc-orange"
                            />
                            <span className="min-w-0">
                              <span
                                className={`block font-medium ${
                                  question.completed
                                    ? 'text-gray-500 line-through'
                                    : 'text-gray-100'
                                }`}
                              >
                                {question.title}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {question.topic || 'General'}
                                {question.url && (
                                  <>
                                    {' | '}
                                    <a
                                      href={question.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-lc-orange hover:underline"
                                    >
                                      Open
                                    </a>
                                  </>
                                )}
                              </span>
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(question._id)}
                            className="self-start rounded-lg border border-lc-red/50 px-3 py-1 text-xs font-medium text-lc-red hover:bg-lc-red/10 sm:self-auto"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 neon-border mb-8">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">Weekly Plan</h2>
                  <p className="text-gray-500 text-sm">
                    Pick a topic or preset for each weekday and generate the week in one click.
                  </p>
                </div>

                <div className="mb-4 max-w-xs">
                  <label className="block text-sm text-gray-300 mb-2">
                    Week Start
                  </label>
                  <input
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg input-dark"
                  />
                </div>

                <div className="space-y-3">
                  {weekdayLabels.map((label, index) => {
                    const item = weeklyPlan[index];
                    return (
                      <div key={label} className="grid gap-3 rounded-lg bg-lc-darker/50 p-3 md:grid-cols-[120px_1fr_120px] md:items-center">
                        <p className="text-sm font-medium text-white">{label}</p>
                        <select
                          value={item.groupId}
                          onChange={(e) =>
                            setWeeklyPlan((current) =>
                              current.map((entry) =>
                                entry.day === index ? { ...entry, groupId: e.target.value } : entry
                              )
                            )
                          }
                          className="w-full px-4 py-3 rounded-lg input-dark"
                        >
                          <option value="">No plan</option>
                          {questionBank.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={item.count}
                          onChange={(e) =>
                            setWeeklyPlan((current) =>
                              current.map((entry) =>
                                entry.day === index ? { ...entry, count: Number(e.target.value) } : entry
                              )
                            )
                          }
                          className="w-full px-4 py-3 rounded-lg input-dark"
                        />
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateWeeklyPlan}
                  disabled={saving}
                  className="mt-5 w-full py-3 btn-glow text-black font-bold rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Generating...' : 'Generate Weekly Plan'}
                </button>
              </div>

              <div className="grid gap-8 mb-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="glass-card rounded-2xl p-6 neon-border">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">Progress Calendar</h2>
                      <p className="text-gray-500 text-sm">
                        Planned, completed, pending, and missed questions.
                        <span className="mt-1 block text-lc-green">
                          Today: {todayLabel}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <button
                        type="button"
                        onClick={goToToday}
                        className="rounded-lg border border-lc-green/50 px-4 py-2 text-sm font-bold text-lc-green hover:bg-lc-green/10"
                      >
                        Go to Today
                      </button>
                      <input
                        type="date"
                        value={weekStart}
                        onChange={(e) => setWeekStart(e.target.value)}
                        className="px-4 py-2 rounded-lg input-dark"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {calendarDays.map((day) => {
                      const isToday = day.date === today;
                      const isSelected = planForm.targetDate === day.date;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setPlanForm({ ...planForm, targetDate: day.date })}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            isSelected
                              ? 'border-lc-orange bg-lc-orange/10'
                              : isToday
                                ? 'border-lc-green/70 bg-lc-green/10'
                                : 'border-lc-border/50 bg-lc-darker/40 hover:border-lc-orange/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-white">
                                {formatCalendarDate(day.date)}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">{day.date}</p>
                            </div>
                            {isToday && (
                              <span className="rounded-full border border-lc-green/50 bg-lc-green/10 px-2 py-1 text-xs font-bold text-lc-green">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <span className="text-gray-500">Planned</span>
                            <span className="text-right text-gray-200">{day.planned}</span>
                            <span className="text-gray-500">Done</span>
                            <span className="text-right text-lc-green">{day.completed}</span>
                            <span className="text-gray-500">Pending</span>
                            <span className="text-right text-lc-orange">{day.pending}</span>
                            <span className="text-gray-500">Missed</span>
                            <span className="text-right text-lc-red">{day.missed}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 neon-border">
                  <h2 className="text-lg font-bold text-white">Analytics</h2>
                  <p className="text-gray-500 text-sm mb-5">
                    Overall planning and completion signal.
                  </p>

                  {analytics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-lc-darker/50 p-3">
                          <p className="text-xs text-gray-500">Total Solved</p>
                          <p className="text-2xl font-bold text-white">{analytics.totalSolved}</p>
                        </div>
                        <div className="rounded-lg bg-lc-darker/50 p-3">
                          <p className="text-xs text-gray-500">Missed Days</p>
                          <p className="text-2xl font-bold text-white">{analytics.missedDays}</p>
                        </div>
                        <div className="rounded-lg bg-lc-darker/50 p-3">
                          <p className="text-xs text-gray-500">Planned</p>
                          <p className="text-2xl font-bold text-white">{analytics.totalPlanned}</p>
                        </div>
                        <div className="rounded-lg bg-lc-darker/50 p-3">
                          <p className="text-xs text-gray-500">Avg / Day</p>
                          <p className="text-2xl font-bold text-white">{analytics.averageQuestionsPerDay}</p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-bold text-white">Topic Progress</p>
                        <div className="space-y-2">
                          {analytics.topicStats.slice(0, 5).map((topic) => (
                            <div key={topic.topic} className="rounded-lg bg-lc-darker/50 p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{topic.topic}</span>
                                <span className="text-gray-500">{topic.completed}/{topic.total}</span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-lc-border">
                                <div
                                  className="h-full bg-lc-green"
                                  style={{ width: `${topic.total ? Math.round((topic.completed / topic.total) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          {analytics.topicStats.length === 0 && (
                            <p className="text-sm text-gray-500">No analytics yet.</p>
                          )}
                        </div>
                      </div>

                      {analytics.weakTopics.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Weak topics: {analytics.weakTopics.map((topic) => topic.topic).join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Analytics will appear after you add questions.</p>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-lc-red/20">
                <h2 className="text-lg font-bold text-lc-red mb-2">
                  Danger Zone
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Delete your account and stop all Telegram alerts permanently.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-6 py-2 border border-lc-red/50 text-lc-red rounded-lg hover:bg-lc-red/10 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Delete My Account
                </button>
              </div>
            </>
          )}

          {message.text && (
            <div
              className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${
                message.type === 'error'
                  ? 'bg-lc-red/10 border border-lc-red/30 text-lc-red'
                  : 'bg-lc-green/10 border border-lc-green/30 text-lc-green'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
