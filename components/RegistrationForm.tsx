'use client';

import { useState } from 'react';
import Link from 'next/link';
import TimePicker12 from '@/components/TimePicker12';

export default function RegistrationForm() {
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    leetcodeUsername: '',
    email: '',
    telegramChatId: '',
    alertTime: '21:00',
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fetchingChatId, setFetchingChatId] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [telegramMessage, setTelegramMessage] = useState({ type: '', text: '' });
  const [lcVerified, setLcVerified] = useState<null | boolean>(null);

  const normalizedPhone = form.phoneNumber.replace(/\s+/g, '');
  const phoneDigits = normalizedPhone.replace(/\D/g, '');
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'LeetCode_sumit_bot';
  const telegramBotUrl = `https://t.me/${botUsername}?start=phone_${phoneDigits}`;
  const showTelegramHelp = phoneDigits.length >= 10;

  const verifyUsername = async () => {
    if (!form.leetcodeUsername.trim()) return;
    setVerifying(true);
    setLcVerified(null);

    try {
      const res = await fetch(`/api/leetcode/${form.leetcodeUsername.trim()}`);
      setLcVerified(res.ok);
    } catch {
      setLcVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const fetchTelegramChatId = async () => {
    if (!phoneDigits) return;
    setFetchingChatId(true);
    setTelegramMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/telegram/chat-id?phone=${encodeURIComponent(phoneDigits)}`);
      const data = await res.json();

      if (res.ok && data.chatId) {
        setForm((current) => ({ ...current, telegramChatId: String(data.chatId) }));
        setTelegramMessage({ type: 'success', text: 'Telegram chat ID filled. You can create your account now.' });
      } else {
        setTelegramMessage({
          type: 'error',
          text: data.error || 'Chat ID not found yet. Open the bot, tap Start, then try again.',
        });
      }
    } catch {
      setTelegramMessage({ type: 'error', text: 'Could not check Telegram right now. Please try again.' });
    } finally {
      setFetchingChatId(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phoneNumber: normalizedPhone,
          email: form.email.trim().toLowerCase(),
          leetcodeUsername: form.leetcodeUsername.trim().toLowerCase(),
          telegramChatId: form.telegramChatId.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Account created. Current streak: ${data.user.currentStreak} days. You can login now.`,
        });
        setForm({
          name: '',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
          leetcodeUsername: '',
          email: '',
          telegramChatId: '',
          alertTime: '21:00',
        });
        setLcVerified(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Sign up failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Sumit"
            required
            className="w-full px-4 py-3 rounded-lg input-dark"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="+918394855509"
            required
            className="w-full px-4 py-3 rounded-lg input-dark"
          />
          {showTelegramHelp && (
            <div className="mt-3 rounded-lg border border-lc-orange/30 bg-lc-orange/10 p-3">
              <p className="text-xs text-gray-300 mb-3">
                Open the Telegram bot with this phone number, tap Start, then come back and fill the chat ID automatically.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={telegramBotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-lc-orange px-4 py-2 text-sm font-bold text-black hover:bg-lc-yellow"
                >
                  Open Telegram Bot
                </a>
                <button
                  type="button"
                  onClick={fetchTelegramChatId}
                  disabled={fetchingChatId}
                  className="inline-flex items-center justify-center rounded-lg border border-lc-orange/50 px-4 py-2 text-sm font-bold text-lc-orange hover:bg-lc-orange/10 disabled:opacity-50"
                >
                  {fetchingChatId ? 'Checking...' : 'Fill Chat ID'}
                </button>
              </div>
              <p className="mt-3 break-all text-xs text-gray-500">
                If Telegram does not show Start, send this message to the bot: /start phone_{phoneDigits}
              </p>
              {telegramMessage.text && (
                <p
                  className={`mt-3 text-xs font-medium ${
                    telegramMessage.type === 'error' ? 'text-lc-red' : 'text-lc-green'
                  }`}
                >
                  {telegramMessage.text}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Gmail ID
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@gmail.com"
          required
          className="w-full px-4 py-3 rounded-lg input-dark"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          LeetCode ID
        </label>
        <div className="relative">
          <input
            type="text"
            value={form.leetcodeUsername}
            onChange={(e) => {
              setForm({ ...form, leetcodeUsername: e.target.value });
              setLcVerified(null);
            }}
            onBlur={verifyUsername}
            placeholder="_sumit27_"
            required
            className="w-full px-4 py-3 rounded-lg input-dark pr-12"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {verifying && (
              <svg className="w-5 h-5 animate-spin text-lc-orange" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {lcVerified === true && <span className="text-lc-green text-lg">OK</span>}
            {lcVerified === false && <span className="text-lc-red text-lg">NO</span>}
          </div>
        </div>
        {lcVerified === false && (
          <p className="text-lc-red text-xs mt-1">LeetCode ID not found</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
            className="w-full px-4 py-3 rounded-lg input-dark"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            minLength={6}
            required
            className="w-full px-4 py-3 rounded-lg input-dark"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telegram Chat ID
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={form.telegramChatId}
            onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
            placeholder="Optional, for alerts"
            className="w-full px-4 py-3 rounded-lg input-dark"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Alert Time (IST)
          </label>
          <TimePicker12
            value={form.alertTime}
            onChange={(alertTime) => setForm({ ...form, alertTime })}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || lcVerified === false}
        className="w-full py-4 btn-glow text-black font-bold rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/dashboard" className="text-lc-orange hover:underline">
          Login here
        </Link>
      </p>

      {message.text && (
        <div
          className={`p-4 rounded-lg text-center text-sm font-medium ${
            message.type === 'error'
              ? 'bg-lc-red/10 border border-lc-red/30 text-lc-red'
              : 'bg-lc-green/10 border border-lc-green/30 text-lc-green'
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}
